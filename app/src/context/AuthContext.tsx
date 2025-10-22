import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { usuarios } from '@/data/usuarios';
import type {
  AuditAction,
  ProfileOverrides,
  UserAddress,
  Usuario,
} from '@/types';
import { createAuditActorFromUser, recordAuditEvent } from '@/utils/audit';
import {
  applyReferralOnRegistration,
  ensureReferralCode,
  ensureUserStats,
} from '@/utils/levelup';
import {
  clearProfileOverrides as removeStoredProfileOverrides,
  getProfileOverrides,
  subscribeToProfileOverrides,
  updateProfileOverrides as persistProfileOverrides,
  type OverridePatch,
} from '@/utils/profileOverrides';
import {
  addUserAddress as persistAddUserAddress,
  getUserAddresses,
  removeUserAddress as persistRemoveUserAddress,
  setPrimaryUserAddress as persistSetPrimaryUserAddress,
  subscribeToUserAddresses,
  updateUserAddress as persistUpdateUserAddress,
  type AddressInput,
  type AddressPatch,
} from '@/utils/profileAddresses';
import {
  ADMIN_USER_STATES_EVENT,
  ADMIN_USER_STATES_KEY,
  arePersistedUserStatesEqual,
  loadAdminUserStates,
  normalizeCorreo,
  normalizeRun,
  type PersistedUserState,
} from '@/utils/users';

type AuthUser = Pick<
  Usuario,
  | 'run'
  | 'nombre'
  | 'apellidos'
  | 'correo'
  | 'perfil'
  | 'fechaNacimiento'
  | 'region'
  | 'comuna'
  | 'direccion'
  | 'descuentoVitalicio'
> & { token: string };

type Credentials = {
  correo: string;
  password: string;
};

type RegisterPayload = {
  run: string;
  nombre: string;
  apellidos: string;
  correo: string;
  fechaNacimiento: string;
  region: string;
  comuna: string;
  direccion: string;
  password: string;
  referralCode?: string;
};

type ExtraUsuario = Usuario & {
  passwordHash: string;
  passwordSalt: string;
  createdAt?: string;
};

type AuthUsuario = Usuario & {
  origin: 'seed' | 'extra';
  passwordHash?: string;
  passwordSalt?: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (credentials: Credentials) => Promise<void>;
  logout: () => void;
  register: (payload: RegisterPayload) => Promise<void>;
  profileOverrides: ProfileOverrides;
  updateProfile: (patch: OverridePatch) => ProfileOverrides;
  clearProfileOverrides: () => void;
  addresses: UserAddress[];
  addAddress: (input: AddressInput) => UserAddress | undefined;
  updateAddress: (id: string, patch: AddressPatch) => UserAddress | undefined;
  removeAddress: (id: string) => void;
  setPrimaryAddress: (id: string) => UserAddress | undefined;
};

const AUTH_STORAGE_KEY = 'levelup-auth-user';
const EXTRA_USERS_STORAGE_KEY = 'levelup-extra-users';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const normalizarRun = normalizeRun;

const normalizarCorreo = normalizeCorreo;

const getGlobalCrypto = () => {
  if (typeof globalThis !== 'undefined' && globalThis.crypto) {
    return globalThis.crypto;
  }
  return undefined;
};

const bufferToBase64 = (buffer: Uint8Array): string => {
  let binary = '';
  buffer.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
};

const base64ToBuffer = (base64: string): Uint8Array => {
  const binary = atob(base64);
  const buffer = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    buffer[index] = binary.charCodeAt(index);
  }
  return buffer;
};

const generateSalt = (): string => {
  const cryptoRef = getGlobalCrypto();
  if (cryptoRef?.getRandomValues) {
    const random = new Uint8Array(16);
    cryptoRef.getRandomValues(random);
    return bufferToBase64(random);
  }
  return bufferToBase64(
    new TextEncoder().encode(`fallback-salt-${Date.now()}-${Math.random()}`)
  );
};

const hashPasswordWithSalt = async (
  salt: string,
  password: string
): Promise<string> => {
  const cryptoRef = getGlobalCrypto();
  const encoder = new TextEncoder();
  const saltBytes = base64ToBuffer(salt);
  const passwordBytes = encoder.encode(password);
  const combined = new Uint8Array(saltBytes.length + passwordBytes.length);
  combined.set(saltBytes, 0);
  combined.set(passwordBytes, saltBytes.length);

  if (cryptoRef?.subtle) {
    const digest = await cryptoRef.subtle.digest('SHA-256', combined);
    return bufferToBase64(new Uint8Array(digest));
  }

  // Fallback simple hash para entornos sin WebCrypto.
  return bufferToBase64(combined);
};

const sanitizeExtraUser = (candidate: unknown): ExtraUsuario | null => {
  if (!candidate || typeof candidate !== 'object') return null;
  const partial = candidate as Partial<ExtraUsuario>;
  if (
    typeof partial.correo !== 'string' ||
    typeof partial.run !== 'string' ||
    typeof partial.nombre !== 'string' ||
    typeof partial.apellidos !== 'string' ||
    typeof partial.passwordHash !== 'string' ||
    typeof partial.passwordSalt !== 'string'
  ) {
    return null;
  }

  return {
    run: normalizarRun(partial.run),
    nombre: partial.nombre,
    apellidos: partial.apellidos,
    correo: normalizarCorreo(partial.correo),
    perfil: partial.perfil ?? 'Cliente',
    fechaNacimiento: partial.fechaNacimiento ?? null,
    region: partial.region ?? '',
    comuna: partial.comuna ?? '',
    direccion: partial.direccion ?? '',
    descuentoVitalicio: Boolean(partial.descuentoVitalicio),
    passwordHash: partial.passwordHash,
    passwordSalt: partial.passwordSalt,
    createdAt: partial.createdAt,
  };
};

const loadExtraUsers = (): ExtraUsuario[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(EXTRA_USERS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => sanitizeExtraUser(item))
      .filter((item): item is ExtraUsuario => Boolean(item));
  } catch (error) {
    console.warn(
      'No se pudieron cargar usuarios extra desde localStorage',
      error
    );
    return [];
  }
};

const mergeUsuarios = (
  seed: Usuario[],
  extras: ExtraUsuario[]
): AuthUsuario[] => {
  const byCorreo = new Map<string, AuthUsuario>();
  const byRun = new Map<string, AuthUsuario>();

  const pushUsuario = (usuario: Usuario, origin: 'seed' | 'extra') => {
    const correoKey = normalizarCorreo(usuario.correo);
    const runKey = normalizarRun(usuario.run);
    if (!correoKey || !runKey) return;

    const authUsuario: AuthUsuario = {
      ...usuario,
      correo: usuario.correo,
      run: usuario.run,
      origin,
    };

    if (origin === 'extra') {
      const extra = usuario as ExtraUsuario;
      authUsuario.passwordHash = extra.passwordHash;
      authUsuario.passwordSalt = extra.passwordSalt;
    }

    const existingCorreo = byCorreo.get(correoKey);
    const existingRun = byRun.get(runKey);
    const shouldOverride = origin === 'extra';

    if (!existingCorreo || shouldOverride) {
      byCorreo.set(correoKey, authUsuario);
    }

    if (!existingRun || shouldOverride) {
      byRun.set(runKey, authUsuario);
    }
  };

  seed.forEach((usuario) => pushUsuario(usuario, 'seed'));
  extras.forEach((usuario) => pushUsuario(usuario, 'extra'));

  return Array.from(byCorreo.values());
};

const createAuthUser = (usuario: AuthUsuario): AuthUser => ({
  run: normalizarRun(usuario.run),
  nombre: usuario.nombre,
  apellidos: usuario.apellidos,
  correo: usuario.correo,
  perfil: usuario.perfil,
  fechaNacimiento: usuario.fechaNacimiento ?? null,
  region: usuario.region,
  comuna: usuario.comuna,
  direccion: usuario.direccion,
  descuentoVitalicio: usuario.descuentoVitalicio,
  token: `fake-token-${usuario.run}`,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (typeof window === 'undefined') return null;
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch (error) {
      console.warn('Error al parsear usuario en localStorage', error);
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }
  });

  const [extraUsers, setExtraUsers] = useState<ExtraUsuario[]>(() =>
    loadExtraUsers()
  );

  const [persistedUserStates, setPersistedUserStates] = useState<
    Record<string, PersistedUserState>
  >(() => loadAdminUserStates());

  const [profileOverrides, setProfileOverrides] = useState<ProfileOverrides>(
    {}
  );
  const [addresses, setAddresses] = useState<UserAddress[]>([]);

  const usuariosFusionados = useMemo(
    () => mergeUsuarios(usuarios, extraUsers),
    [extraUsers]
  );

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const refreshStates = () => {
      setPersistedUserStates((previous) => {
        const next = loadAdminUserStates();
        return arePersistedUserStatesEqual(previous, next) ? previous : next;
      });
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key === ADMIN_USER_STATES_KEY) {
        refreshStates();
      }
    };
    window.addEventListener(ADMIN_USER_STATES_EVENT, refreshStates);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener(ADMIN_USER_STATES_EVENT, refreshStates);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (user) {
      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setProfileOverrides({});
      setAddresses([]);
      return undefined;
    }
    const correoKey = normalizeCorreo(user.correo);
    setProfileOverrides(getProfileOverrides(correoKey));
    setAddresses(getUserAddresses(correoKey));

    const unsubscribeOverrides = subscribeToProfileOverrides((event) => {
      if (normalizeCorreo(event.correo) !== correoKey) return;
      setProfileOverrides(event.overrides ?? {});
    });

    const unsubscribeAddresses = subscribeToUserAddresses((event) => {
      if (normalizeCorreo(event.correo) !== correoKey) return;
      setAddresses(event.addresses ?? []);
    });

    return () => {
      unsubscribeOverrides?.();
      unsubscribeAddresses?.();
    };
  }, [user]);

  const effectiveUser = useMemo(() => {
    if (!user) return null;
    const overrides = profileOverrides ?? {};
    const normalizeValue = (value?: string) =>
      value && value.trim().length > 0 ? value.trim() : undefined;

    return {
      ...user,
      nombre: normalizeValue(overrides.nombre) ?? user.nombre,
      apellidos: normalizeValue(overrides.apellidos) ?? user.apellidos,
      region: normalizeValue(overrides.region) ?? user.region,
      comuna: normalizeValue(overrides.comuna) ?? user.comuna,
      direccion: normalizeValue(overrides.direccion) ?? user.direccion,
    };
  }, [profileOverrides, user]);

  const updateProfile = useCallback(
    (patch: OverridePatch) => {
      if (!user) {
        throw new Error('Debes iniciar sesión para actualizar tu perfil.');
      }
      const updated = persistProfileOverrides(user.correo, patch);
      setProfileOverrides(updated);
      return updated;
    },
    [user]
  );

  const clearProfileOverrides = useCallback(() => {
    if (!user) return;
    removeStoredProfileOverrides(user.correo);
    setProfileOverrides({});
  }, [user]);

  const addAddress = useCallback(
    (input: AddressInput) => {
      if (!user) {
        throw new Error('Debes iniciar sesión para gestionar direcciones.');
      }
      const created = persistAddUserAddress(user.correo, input);
      setAddresses(getUserAddresses(user.correo));
      return created;
    },
    [user]
  );

  const updateAddress = useCallback(
    (id: string, patch: AddressPatch) => {
      if (!user) {
        throw new Error('Debes iniciar sesión para actualizar direcciones.');
      }
      const updated = persistUpdateUserAddress(user.correo, id, patch);
      setAddresses(getUserAddresses(user.correo));
      return updated;
    },
    [user]
  );

  const removeAddress = useCallback(
    (id: string) => {
      if (!user) {
        throw new Error('Debes iniciar sesión para eliminar direcciones.');
      }
      persistRemoveUserAddress(user.correo, id);
      setAddresses(getUserAddresses(user.correo));
    },
    [user]
  );

  const setPrimaryAddress = useCallback(
    (id: string) => {
      if (!user) {
        throw new Error('Debes iniciar sesión para gestionar direcciones.');
      }
      const updated = persistSetPrimaryUserAddress(user.correo, id);
      setAddresses(getUserAddresses(user.correo));
      return updated;
    },
    [user]
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if (extraUsers.length === 0) {
        window.localStorage.removeItem(EXTRA_USERS_STORAGE_KEY);
      } else {
        window.localStorage.setItem(
          EXTRA_USERS_STORAGE_KEY,
          JSON.stringify(extraUsers)
        );
      }
    } catch (error) {
      console.warn('No se pudieron persistir los usuarios extra', error);
    }
  }, [extraUsers]);

  const emitAuthAuditEvent = useCallback(
    (
      action: AuditAction,
      usuario: {
        run: string;
        nombre: string;
        apellidos: string;
        correo: string;
        perfil: Usuario['perfil'];
      },
      summary: string,
      options?: {
        entityType?: 'auth' | 'usuario';
        metadata?: unknown;
        severity?: 'low' | 'medium' | 'high';
      }
    ) => {
      recordAuditEvent({
        action,
        summary,
        entity: {
          type: options?.entityType ?? 'auth',
          id: usuario.run,
          name: usuario.correo,
          context: usuario.perfil,
        },
        metadata: options?.metadata,
        severity: options?.severity,
        actor: createAuditActorFromUser(usuario),
      });
    },
    []
  );

  useEffect(() => {
    if (!user) return;
    const runKey = normalizarRun(user.run);
    const state = persistedUserStates[runKey];
    if (!state?.deletedAt) return;
    emitAuthAuditEvent(
      'logout',
      {
        run: user.run,
        nombre: user.nombre,
        apellidos: user.apellidos,
        correo: user.correo,
        perfil: user.perfil,
      },
      'Sesión finalizada automáticamente por desactivación de la cuenta',
      {
        metadata: {
          reason: 'account-disabled',
          deletedAt: state.deletedAt,
        },
        severity: 'medium',
      }
    );
    setUser(null);
  }, [emitAuthAuditEvent, persistedUserStates, user]);

  const login = useCallback(
    async ({ correo, password }: Credentials) => {
      const correoKey = normalizarCorreo(correo);
      const usuario = usuariosFusionados.find(
        (item) => normalizarCorreo(item.correo) === correoKey
      );

      if (!usuario) {
        throw new Error('Usuario no encontrado. ¿Aún no te registras?');
      }

      const actorPayload = {
        run: usuario.run,
        nombre: usuario.nombre,
        apellidos: usuario.apellidos,
        correo: usuario.correo,
        perfil: usuario.perfil,
      };

      const authMethod =
        usuario.passwordHash && usuario.passwordSalt ? 'password' : 'legacy';

      const runKey = normalizarRun(usuario.run);
      const persistedState = persistedUserStates[runKey];
      if (persistedState?.deletedAt) {
        emitAuthAuditEvent(
          'login',
          actorPayload,
          'Intento de inicio de sesión bloqueado: cuenta deshabilitada',
          {
            entityType: 'usuario',
            metadata: {
              origin: usuario.origin,
              method: authMethod,
              deletedAt: persistedState.deletedAt,
              outcome: 'blocked',
            },
            severity: 'medium',
          }
        );
        throw new Error(
          'Esta cuenta está deshabilitada. Contacta al soporte para más información.'
        );
      }

      if (authMethod === 'password') {
        if (!password) {
          throw new Error('Ingresa tu contraseña.');
        }
        const computed = await hashPasswordWithSalt(
          usuario.passwordSalt!,
          password
        );
        if (computed !== usuario.passwordHash) {
          throw new Error('Contraseña incorrecta.');
        }
        ensureUserStats(usuario.run);
        ensureReferralCode(usuario.run);
        setUser(createAuthUser(usuario));
        setProfileOverrides(getProfileOverrides(usuario.correo));
        setAddresses(getUserAddresses(usuario.correo));
        emitAuthAuditEvent('login', actorPayload, 'Inicio de sesión exitoso', {
          metadata: {
            origin: usuario.origin,
            method: authMethod,
          },
        });
        return;
      }

      ensureUserStats(usuario.run);
      ensureReferralCode(usuario.run);
      setUser(createAuthUser(usuario));
      setProfileOverrides(getProfileOverrides(usuario.correo));
      setAddresses(getUserAddresses(usuario.correo));
      emitAuthAuditEvent('login', actorPayload, 'Inicio de sesión exitoso', {
        metadata: {
          origin: usuario.origin,
          method: authMethod,
        },
      });
    },
    [emitAuthAuditEvent, persistedUserStates, usuariosFusionados]
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      const correoKey = normalizarCorreo(payload.correo);
      const runKey = normalizarRun(payload.run);

      const alreadyExists = usuariosFusionados.some(
        (usuario) =>
          normalizarCorreo(usuario.correo) === correoKey ||
          normalizarRun(usuario.run) === runKey
      );

      if (alreadyExists) {
        throw new Error('El correo o RUN ya están registrados.');
      }

      const salt = generateSalt();
      const passwordHash = await hashPasswordWithSalt(salt, payload.password);
      const birthDate = payload.fechaNacimiento.trim();

      const nuevoUsuario: ExtraUsuario = {
        run: runKey,
        nombre: payload.nombre,
        apellidos: payload.apellidos,
        correo: correoKey,
        perfil: 'Cliente',
        fechaNacimiento: null,
        region: payload.region,
        comuna: payload.comuna,
        direccion: payload.direccion,
        descuentoVitalicio: correoKey.endsWith('@duoc.cl'),
        passwordHash,
        passwordSalt: salt,
        createdAt: new Date().toISOString(),
      };
      if (birthDate) {
        nuevoUsuario.fechaNacimiento = birthDate;
      }

      ensureUserStats(runKey);
      ensureReferralCode(runKey);

      const referralCodeToApply = payload.referralCode
        ? payload.referralCode.trim().toUpperCase()
        : '';
      if (referralCodeToApply) {
        const referralResult = applyReferralOnRegistration({
          newUserRun: runKey,
          newUserEmail: correoKey,
          referralCode: referralCodeToApply,
        });
        if (!referralResult.ok) {
          let message = 'No se pudo aplicar el código de referido.';
          switch (referralResult.reason) {
            case 'code-not-found':
              message = 'El código de referido ingresado no existe.';
              break;
            case 'self-ref':
              message = 'No puedes usar tu propio código de referido.';
              break;
            case 'already-referred':
              message = 'Ya registraste un código de referido previamente.';
              break;
            case 'invalid-run':
            case 'no-code':
            default:
              message = 'No se pudo aplicar el código de referido.';
              break;
          }
          throw new Error(message);
        }
      }

      usuarios.push(nuevoUsuario);
      setExtraUsers((prev) => [...prev, nuevoUsuario]);
      setUser(createAuthUser({ ...nuevoUsuario, origin: 'extra' }));
      setProfileOverrides(getProfileOverrides(nuevoUsuario.correo));
      setAddresses(getUserAddresses(nuevoUsuario.correo));
      emitAuthAuditEvent(
        'registered',
        {
          run: nuevoUsuario.run,
          nombre: nuevoUsuario.nombre,
          apellidos: nuevoUsuario.apellidos,
          correo: nuevoUsuario.correo,
          perfil: nuevoUsuario.perfil,
        },
        'Registro de nuevo usuario',
        {
          entityType: 'usuario',
          metadata: {
            region: nuevoUsuario.region,
            comuna: nuevoUsuario.comuna,
          },
        }
      );
    },
    [emitAuthAuditEvent, usuariosFusionados]
  );

  const logout = useCallback(() => {
    setUser((previous) => {
      if (previous) {
        emitAuthAuditEvent(
          'logout',
          {
            run: previous.run,
            nombre: previous.nombre,
            apellidos: previous.apellidos,
            correo: previous.correo,
            perfil: previous.perfil,
          },
          'Cierre de sesión'
        );
      }
      return null;
    });
    setProfileOverrides({});
    setAddresses([]);
  }, [emitAuthAuditEvent]);

  const value = useMemo(
    () => ({
      user: effectiveUser,
      isAuthenticated: Boolean(effectiveUser),
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
    }),
    [
      addAddress,
      addresses,
      clearProfileOverrides,
      effectiveUser,
      login,
      logout,
      register,
      profileOverrides,
      removeAddress,
      setPrimaryAddress,
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
