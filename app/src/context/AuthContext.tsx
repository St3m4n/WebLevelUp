import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ProfileOverrides, UserAddress } from '@/types';
import {
  login as loginRequest,
  register as registerRequest,
  type AuthenticatedUser,
  type LoginRequest,
  type RegisterRequest,
} from '@/services/authService';
import {
  createUserAddress,
  deleteUserAddress,
  fetchCurrentUser,
  fetchUserAddresses,
  promoteUserAddress,
  resetUserProfile,
  updateUserAddress as updateUserAddressApi,
  updateUserProfile,
  type CreateAddressRequest,
  type UpdateAddressRequest,
} from '@/services/userService';
import { setAuthToken } from '@/services/apiClient';

type RegisterResult = {
  run: string;
  correo: string;
  nombre: string;
  referralCode?: string;
};

type AuthContextValue = {
  user: AuthenticatedUser | null;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  register: (payload: RegisterRequest) => Promise<RegisterResult>;
  profileOverrides: ProfileOverrides;
  updateProfile: (
    patch: Partial<Omit<ProfileOverrides, 'updatedAt'>>
  ) => Promise<ProfileOverrides>;
  clearProfileOverrides: () => Promise<void>;
  addresses: UserAddress[];
  addAddress: (input: CreateAddressRequest) => Promise<UserAddress>;
  updateAddress: (
    id: string,
    patch: UpdateAddressRequest
  ) => Promise<UserAddress>;
  removeAddress: (id: string) => Promise<void>;
  setPrimaryAddress: (id: string) => Promise<UserAddress>;
  refreshSession: () => Promise<void>;
};

type StoredSession = {
  token: string;
};

const AUTH_STORAGE_KEY = 'levelup-auth-session';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const readStoredToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredSession | null;
    if (!parsed || typeof parsed.token !== 'string') return null;
    return parsed.token;
  } catch (error) {
    console.warn('No se pudo restaurar la sesión almacenada', error);
    return null;
  }
};

const persistToken = (token: string | null) => {
  if (typeof window === 'undefined') return;
  if (!token) {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify({ token } satisfies StoredSession)
  );
};

const mergeUserWithOverrides = (
  base: AuthenticatedUser,
  overrides: ProfileOverrides
): AuthenticatedUser => {
  const normalize = (value?: string | null) =>
    value && value.trim().length > 0 ? value.trim() : undefined;

  return {
    ...base,
    nombre: normalize(overrides.nombre) ?? base.nombre,
    apellidos: normalize(overrides.apellidos) ?? base.apellidos,
    region: normalize(overrides.region) ?? base.region,
    comuna: normalize(overrides.comuna) ?? base.comuna,
    direccion: normalize(overrides.direccion) ?? base.direccion,
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [token, setToken] = useState<string | null>(() => readStoredToken());
  const [baseUser, setBaseUser] = useState<AuthenticatedUser | null>(null);
  const [profileOverrides, setProfileOverrides] = useState<ProfileOverrides>(
    {}
  );
  const [addresses, setAddresses] = useState<UserAddress[]>([]);

  const effectiveUser = useMemo(() => {
    if (!baseUser) return null;
    return mergeUserWithOverrides(baseUser, profileOverrides ?? {});
  }, [baseUser, profileOverrides]);

  const refreshAddresses = useCallback(async (run: string) => {
    try {
      const list = await fetchUserAddresses(run);
      setAddresses(Array.isArray(list) ? list : []);
    } catch (error) {
      console.warn('No se pudieron cargar las direcciones del usuario', error);
      setAddresses([]);
    }
  }, []);

  const refreshSession = useCallback(async () => {
    if (!token) {
      setBaseUser(null);
      setProfileOverrides({});
      setAddresses([]);
      return;
    }
    try {
      setAuthToken(token);
      const current = await fetchCurrentUser();
      setBaseUser(current);
      setProfileOverrides(current.overrides ?? {});
      await refreshAddresses(current.run);
    } catch (error) {
      console.warn('No se pudo refrescar la sesión, cerrando sesión', error);
      setToken(null);
      setAuthToken(null);
      persistToken(null);
      setBaseUser(null);
      setProfileOverrides({});
      setAddresses([]);
    }
  }, [refreshAddresses, token]);

  useEffect(() => {
    persistToken(token);
    setAuthToken(token);
    if (!token) {
      setBaseUser(null);
      setProfileOverrides({});
      setAddresses([]);
      return;
    }

    if (!baseUser) {
      void refreshSession();
    }
  }, [baseUser, refreshSession, token]);

  const login = useCallback(
    async (credentials: LoginRequest) => {
      const response = await loginRequest(credentials);
      setAuthToken(response.token);
      setToken(response.token);
      setBaseUser(response.user);
      setProfileOverrides(response.user.overrides ?? {});
      await refreshAddresses(response.user.run);
    },
    [refreshAddresses]
  );

  const logout = useCallback(() => {
    setToken(null);
    setAuthToken(null);
    persistToken(null);
    setBaseUser(null);
    setProfileOverrides({});
    setAddresses([]);
  }, []);

  const register = useCallback(
    async (payload: RegisterRequest): Promise<RegisterResult> => {
      const response = await registerRequest(payload);
      setAuthToken(response.token);
      setToken(response.token);
      setBaseUser(response.user);
      setProfileOverrides(response.user.overrides ?? {});
      await refreshAddresses(response.user.run);
      return {
        run: response.user.run,
        correo: response.user.correo,
        nombre: response.user.nombre,
        referralCode: response.user.referralCode,
      };
    },
    [refreshAddresses]
  );

  const updateProfile = useCallback(
    async (
      patch: Partial<Omit<ProfileOverrides, 'updatedAt'>>
    ): Promise<ProfileOverrides> => {
      if (!baseUser) {
        throw new Error('Debes iniciar sesión para actualizar tu perfil.');
      }
      const updated = await updateUserProfile(baseUser.run, patch);
      setProfileOverrides(updated ?? {});
      return updated ?? {};
    },
    [baseUser]
  );

  const clearProfileOverrides = useCallback(async () => {
    if (!baseUser) return;
    const cleared = await resetUserProfile(baseUser.run);
    setProfileOverrides(cleared ?? {});
  }, [baseUser]);

  const addAddress = useCallback(
    async (input: CreateAddressRequest): Promise<UserAddress> => {
      if (!baseUser) {
        throw new Error('Debes iniciar sesión para gestionar direcciones.');
      }
      const created = await createUserAddress(baseUser.run, input);
      await refreshAddresses(baseUser.run);
      return created;
    },
    [baseUser, refreshAddresses]
  );

  const updateAddress = useCallback(
    async (id: string, patch: UpdateAddressRequest): Promise<UserAddress> => {
      if (!baseUser) {
        throw new Error('Debes iniciar sesión para gestionar direcciones.');
      }
      const updated = await updateUserAddressApi(baseUser.run, id, patch);
      await refreshAddresses(baseUser.run);
      return updated;
    },
    [baseUser, refreshAddresses]
  );

  const removeAddress = useCallback(
    async (id: string): Promise<void> => {
      if (!baseUser) {
        throw new Error('Debes iniciar sesión para gestionar direcciones.');
      }
      await deleteUserAddress(baseUser.run, id);
      await refreshAddresses(baseUser.run);
    },
    [baseUser, refreshAddresses]
  );

  const setPrimaryAddress = useCallback(
    async (id: string): Promise<UserAddress> => {
      if (!baseUser) {
        throw new Error('Debes iniciar sesión para gestionar direcciones.');
      }
      const updated = await promoteUserAddress(baseUser.run, id);
      await refreshAddresses(baseUser.run);
      return updated;
    },
    [baseUser, refreshAddresses]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user: effectiveUser,
      isAuthenticated: Boolean(effectiveUser) && Boolean(token),
      login,
      logout,
      register,
      profileOverrides,
      updateProfile,
      clearProfileOverrides,
      addresses,
      addAddress,
      updateAddress,
      removeAddress,
      setPrimaryAddress,
      refreshSession,
    }),
    [
      addAddress,
      addresses,
      clearProfileOverrides,
      effectiveUser,
      login,
      logout,
      profileOverrides,
      refreshSession,
      register,
      removeAddress,
      setPrimaryAddress,
      token,
      updateAddress,
      updateProfile,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return ctx;
};
