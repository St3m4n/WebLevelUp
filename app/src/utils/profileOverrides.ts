import { normalizeCorreo } from '@/utils/users';
import type { ProfileOverrides, UserPreferences } from '@/types';

const STORAGE_KEY = 'levelup:profile-overrides';
export const PROFILE_OVERRIDES_EVENT = 'levelup:profile-overrides-updated';

type OverridesStore = Record<string, ProfileOverrides>;

export type OverridePatch = Partial<Omit<ProfileOverrides, 'preferencias'>> & {
  preferencias?: UserPreferences;
};

type OverridesEventDetail = {
  correo: string;
  overrides: ProfileOverrides;
};

const getWindow = (): Window | undefined =>
  typeof window === 'undefined' ? undefined : window;

const loadStore = (): OverridesStore => {
  const win = getWindow();
  if (!win) return {};
  try {
    const raw = win.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    return Object.entries(parsed).reduce<OverridesStore>(
      (acc, [key, value]) => {
        if (typeof key !== 'string' || !value || typeof value !== 'object') {
          return acc;
        }
        acc[key] = sanitizeOverride(value);
        return acc;
      },
      {}
    );
  } catch (error) {
    console.warn('No se pudieron cargar overrides de perfil', error);
    return {};
  }
};

const sanitizeOverride = (candidate: unknown): ProfileOverrides => {
  if (!candidate || typeof candidate !== 'object') {
    return {};
  }
  const partial = candidate as ProfileOverrides;
  const preferencias = partial.preferencias
    ? sanitizePreferences(partial.preferencias)
    : undefined;
  return {
    nombre: typeof partial.nombre === 'string' ? partial.nombre : undefined,
    apellidos:
      typeof partial.apellidos === 'string' ? partial.apellidos : undefined,
    region: typeof partial.region === 'string' ? partial.region : undefined,
    comuna: typeof partial.comuna === 'string' ? partial.comuna : undefined,
    direccion:
      typeof partial.direccion === 'string' ? partial.direccion : undefined,
    preferencias,
    updatedAt:
      typeof partial.updatedAt === 'string' ? partial.updatedAt : undefined,
  };
};

const sanitizePreferences = (candidate: unknown): UserPreferences => {
  if (!candidate || typeof candidate !== 'object') {
    return {};
  }
  const partial = candidate as UserPreferences;
  return {
    defaultPaymentMethod: partial.defaultPaymentMethod,
  };
};

const persistStore = (store: OverridesStore, correo: string) => {
  const win = getWindow();
  if (!win) return;
  try {
    win.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    const detail: OverridesEventDetail = {
      correo,
      overrides: store[correo] ?? {},
    };
    win.dispatchEvent(new CustomEvent(PROFILE_OVERRIDES_EVENT, { detail }));
  } catch (error) {
    console.warn('No se pudieron persistir overrides de perfil', error);
  }
};

export const getProfileOverrides = (correo: string): ProfileOverrides => {
  const correoKey = normalizeCorreo(correo);
  if (!correoKey) return {};
  const store = loadStore();
  return store[correoKey] ?? {};
};

export const updateProfileOverrides = (
  correo: string,
  patch: OverridePatch
): ProfileOverrides => {
  const correoKey = normalizeCorreo(correo);
  if (!correoKey) return {};
  const store = loadStore();
  const previous = store[correoKey] ?? {};
  const mergedPreferences = patch.preferencias
    ? {
        ...previous.preferencias,
        ...sanitizePreferences(patch.preferencias),
      }
    : previous.preferencias;

  const next: ProfileOverrides = {
    ...previous,
    ...patch,
    preferencias: mergedPreferences,
    updatedAt: new Date().toISOString(),
  };

  // Avoid keeping empty preferencias object when no values present
  if (next.preferencias) {
    const hasPreferences = Boolean(next.preferencias.defaultPaymentMethod);
    if (!hasPreferences) {
      delete next.preferencias;
    }
  }

  store[correoKey] = sanitizeOverride(next);
  persistStore(store, correoKey);
  return store[correoKey];
};

export const subscribeToProfileOverrides = (
  handler: (detail: OverridesEventDetail) => void
): (() => void) | undefined => {
  const win = getWindow();
  if (!win) return undefined;
  const wrapped = (event: Event) => {
    if (!(event instanceof CustomEvent)) return;
    handler(event.detail as OverridesEventDetail);
  };
  win.addEventListener(PROFILE_OVERRIDES_EVENT, wrapped as EventListener);
  return () => {
    win.removeEventListener(PROFILE_OVERRIDES_EVENT, wrapped as EventListener);
  };
};

export const clearProfileOverrides = (correo: string): void => {
  const correoKey = normalizeCorreo(correo);
  if (!correoKey) return;
  const store = loadStore();
  if (!store[correoKey]) return;
  delete store[correoKey];
  persistStore(store, correoKey);
};
