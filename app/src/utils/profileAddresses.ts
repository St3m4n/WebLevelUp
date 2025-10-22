import { normalizeCorreo } from '@/utils/users';
import type { UserAddress } from '@/types';

const STORAGE_KEY = 'levelup:profile-addresses';
export const PROFILE_ADDRESSES_EVENT = 'levelup:profile-addresses-updated';

type AddressStore = Record<string, UserAddress[]>;

export type AddressInput = Omit<
  UserAddress,
  'id' | 'createdAt' | 'updatedAt' | 'isPrimary'
> & {
  isPrimary?: boolean;
};

export type AddressPatch = Partial<Omit<UserAddress, 'id' | 'createdAt'>>;

type AddressesEventDetail = {
  correo: string;
  addresses: UserAddress[];
};

const getWindow = (): Window | undefined =>
  typeof window === 'undefined' ? undefined : window;

const sanitizeAddress = (candidate: unknown): UserAddress | null => {
  if (!candidate || typeof candidate !== 'object') return null;
  const partial = candidate as UserAddress;
  const fullName = typeof partial.fullName === 'string' ? partial.fullName : '';
  const line1 = typeof partial.line1 === 'string' ? partial.line1 : '';
  const city = typeof partial.city === 'string' ? partial.city : '';
  const region = typeof partial.region === 'string' ? partial.region : '';
  const country = typeof partial.country === 'string' ? partial.country : '';
  const id = typeof partial.id === 'string' ? partial.id : '';
  const createdAt =
    typeof partial.createdAt === 'string'
      ? partial.createdAt
      : new Date().toISOString();
  const updatedAt =
    typeof partial.updatedAt === 'string' ? partial.updatedAt : undefined;
  const isPrimary = Boolean(partial.isPrimary);

  if (!id || !fullName || !line1) {
    return null;
  }

  return {
    id,
    fullName,
    line1,
    city,
    region,
    country,
    isPrimary,
    createdAt,
    updatedAt,
  };
};

const cloneAddresses = (addresses: UserAddress[]): UserAddress[] =>
  addresses.map((address) => ({ ...address }));

const orderAddresses = (addresses: UserAddress[]): UserAddress[] => {
  return cloneAddresses(addresses).sort((a, b) => {
    if (a.isPrimary && !b.isPrimary) return -1;
    if (!a.isPrimary && b.isPrimary) return 1;
    const timeA = new Date(a.createdAt).getTime();
    const timeB = new Date(b.createdAt).getTime();
    return timeB - timeA;
  });
};

const loadStore = (): AddressStore => {
  const win = getWindow();
  if (!win) return {};
  try {
    const raw = win.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    return Object.entries(parsed).reduce<AddressStore>((acc, [key, value]) => {
      if (!value || !Array.isArray(value)) return acc;
      const sanitized = value
        .map((item) => sanitizeAddress(item))
        .filter((item): item is UserAddress => Boolean(item));
      if (sanitized.length > 0) {
        acc[key] = orderAddresses(sanitized);
      }
      return acc;
    }, {});
  } catch (error) {
    console.warn('No se pudieron cargar direcciones del perfil', error);
    return {};
  }
};

const persistStore = (store: AddressStore, correo: string) => {
  const win = getWindow();
  if (!win) return;
  try {
    const normalized: AddressStore = {};
    Object.entries(store).forEach(([key, value]) => {
      if (!Array.isArray(value) || value.length === 0) return;
      normalized[key] = orderAddresses(value);
    });
    const hasEntries = Object.keys(normalized).length > 0;
    if (hasEntries) {
      win.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    } else {
      win.localStorage.removeItem(STORAGE_KEY);
    }
    const detail: AddressesEventDetail = {
      correo,
      addresses: normalized[correo] ? cloneAddresses(normalized[correo]) : [],
    };
    win.dispatchEvent(new CustomEvent(PROFILE_ADDRESSES_EVENT, { detail }));
  } catch (error) {
    console.warn('No se pudieron persistir direcciones del perfil', error);
  }
};

const ensureSinglePrimary = (addresses: UserAddress[], primaryId?: string) => {
  let hasPrimary = false;
  addresses.forEach((address) => {
    if (primaryId && address.id === primaryId) {
      address.isPrimary = true;
      hasPrimary = true;
      return;
    }
    if (address.isPrimary) {
      if (!hasPrimary) {
        hasPrimary = true;
      } else if (primaryId) {
        address.isPrimary = false;
      }
    }
  });
  if (!hasPrimary && addresses.length > 0) {
    addresses[0].isPrimary = true;
  }
};

const getStoreAndKey = (
  correo: string
): { store: AddressStore; key: string } => {
  const correoKey = normalizeCorreo(correo);
  return { store: loadStore(), key: correoKey };
};

const generateId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `addr-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const getUserAddresses = (correo: string): UserAddress[] => {
  const correoKey = normalizeCorreo(correo);
  if (!correoKey) return [];
  const store = loadStore();
  const addresses = store[correoKey] ?? [];
  return cloneAddresses(orderAddresses(addresses));
};

export const addUserAddress = (
  correo: string,
  input: AddressInput
): UserAddress | undefined => {
  const { store, key } = getStoreAndKey(correo);
  if (!key) return undefined;
  const existing = cloneAddresses(store[key] ?? []);
  const now = new Date().toISOString();
  const trimmed: AddressInput = {
    fullName: input.fullName.trim(),
    line1: input.line1.trim(),
    city: input.city.trim(),
    region: input.region.trim(),
    country: input.country.trim() || 'Chile',
    isPrimary: input.isPrimary,
  };
  if (!trimmed.fullName || !trimmed.line1) {
    throw new Error(
      'La dirección debe incluir un nombre y dirección principales.'
    );
  }
  const primaryRequested = Boolean(trimmed.isPrimary) || existing.length === 0;
  const newAddress: UserAddress = {
    id: generateId(),
    fullName: trimmed.fullName,
    line1: trimmed.line1,
    city: trimmed.city,
    region: trimmed.region,
    country: trimmed.country,
    isPrimary: primaryRequested,
    createdAt: now,
  };
  if (!store[key]) {
    store[key] = [];
  }
  const nextAddresses = [...existing, newAddress];
  ensureSinglePrimary(
    nextAddresses,
    primaryRequested ? newAddress.id : undefined
  );
  store[key] = nextAddresses;
  persistStore(store, key);
  return newAddress;
};

export const updateUserAddress = (
  correo: string,
  id: string,
  patch: AddressPatch
): UserAddress | undefined => {
  const { store, key } = getStoreAndKey(correo);
  if (!key || !store[key]) return undefined;
  const existing = cloneAddresses(store[key]);
  const index = existing.findIndex((address) => address.id === id);
  if (index === -1) return undefined;
  const previous = existing[index];
  const updated: UserAddress = {
    ...previous,
    ...patch,
    fullName:
      typeof patch.fullName === 'string'
        ? patch.fullName.trim()
        : previous.fullName,
    line1:
      typeof patch.line1 === 'string' ? patch.line1.trim() : previous.line1,
    city: typeof patch.city === 'string' ? patch.city.trim() : previous.city,
    region:
      typeof patch.region === 'string' ? patch.region.trim() : previous.region,
    country:
      typeof patch.country === 'string'
        ? patch.country.trim() || 'Chile'
        : previous.country,
    isPrimary:
      typeof patch.isPrimary === 'boolean'
        ? patch.isPrimary
        : previous.isPrimary,
    updatedAt: new Date().toISOString(),
  };
  if (!updated.fullName || !updated.line1) {
    throw new Error(
      'La dirección debe incluir un nombre y dirección principales.'
    );
  }
  existing[index] = updated;
  ensureSinglePrimary(existing, updated.isPrimary ? updated.id : undefined);
  store[key] = existing;
  persistStore(store, key);
  return updated;
};

export const removeUserAddress = (
  correo: string,
  id: string
): UserAddress[] => {
  const { store, key } = getStoreAndKey(correo);
  if (!key || !store[key]) return [];
  const existing = cloneAddresses(store[key]);
  const filtered = existing.filter((address) => address.id !== id);
  ensureSinglePrimary(filtered);
  if (filtered.length === 0) {
    delete store[key];
  } else {
    store[key] = filtered;
  }
  persistStore(store, key);
  return filtered;
};

export const setPrimaryUserAddress = (
  correo: string,
  id: string
): UserAddress | undefined => {
  const { store, key } = getStoreAndKey(correo);
  if (!key || !store[key]) return undefined;
  const existing = cloneAddresses(store[key]);
  const target = existing.find((address) => address.id === id);
  if (!target) return undefined;
  ensureSinglePrimary(existing, id);
  store[key] = existing;
  persistStore(store, key);
  return existing.find((address) => address.id === id);
};

export const subscribeToUserAddresses = (
  handler: (detail: AddressesEventDetail) => void
): (() => void) | undefined => {
  const win = getWindow();
  if (!win) return undefined;
  const wrapped = (event: Event) => {
    if (!(event instanceof CustomEvent)) return;
    handler(event.detail as AddressesEventDetail);
  };
  win.addEventListener(PROFILE_ADDRESSES_EVENT, wrapped as EventListener);
  return () => {
    win.removeEventListener(PROFILE_ADDRESSES_EVENT, wrapped as EventListener);
  };
};
