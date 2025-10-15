import type { Producto } from '@/types';

import { seedProductos } from '@/data/productos';

const PRODUCT_STORAGE_KEY = 'levelup-products-overrides';
const PRODUCT_EVENT = 'levelup:products-updated';

type ProductOrigin = 'seed' | 'custom' | 'override';

export type ProductRecord = Producto & {
  origin: ProductOrigin;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

type StoredProduct = ProductRecord;
type ProductUpdate = Partial<Omit<Producto, 'codigo'>> & {
  deletedAt?: string | null;
};

const isBrowser = typeof window !== 'undefined';

const readOverrides = (): StoredProduct[] => {
  if (!isBrowser) {
    return [];
  }

  const raw = window.localStorage.getItem(PRODUCT_STORAGE_KEY);

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as StoredProduct[];
    return parsed.filter((item) => Boolean(item?.codigo));
  } catch (error) {
    console.warn('[products] Failed to parse overrides', error);
    return [];
  }
};

const persistOverrides = (overrides: StoredProduct[]) => {
  if (!isBrowser) {
    return;
  }

  window.localStorage.setItem(PRODUCT_STORAGE_KEY, JSON.stringify(overrides));
  window.dispatchEvent(new CustomEvent(PRODUCT_EVENT));
};

const buildSeedMap = (): Map<string, ProductRecord> => {
  return new Map(
    seedProductos.map((product) => [
      product.codigo,
      { ...product, origin: 'seed' as ProductOrigin },
    ])
  );
};

const mergeProducts = (includeDeleted: boolean): ProductRecord[] => {
  const overrides = readOverrides();
  const merged = buildSeedMap();

  for (const override of overrides) {
    const existing = merged.get(override.codigo);

    if (existing) {
      merged.set(override.codigo, {
        ...existing,
        ...override,
        origin: override.origin ?? 'override',
      });
      continue;
    }

    merged.set(override.codigo, {
      ...override,
      origin: override.origin ?? 'custom',
    });
  }

  const values = Array.from(merged.values());

  if (!includeDeleted) {
    return values.filter((product) => !product.deletedAt);
  }

  return values;
};

const generateProductCode = (name: string) => {
  const normalized = name
    .replace(/[^a-z0-9]/gi, '')
    .slice(0, 4)
    .toUpperCase();
  const prefix = normalized || 'PRD';
  const suffix = Date.now().toString(36).toUpperCase();
  return `${prefix}-${suffix}`;
};

const upsertOverride = (record: StoredProduct) => {
  const overrides = readOverrides();
  const index = overrides.findIndex((item) => item.codigo === record.codigo);

  if (index >= 0) {
    overrides[index] = record;
  } else {
    overrides.push(record);
  }

  persistOverrides(overrides);
};

const removeOverride = (codigo: string) => {
  const overrides = readOverrides();
  const filtered = overrides.filter((item) => item.codigo !== codigo);
  persistOverrides(filtered);
};

const isOverrideRedundant = (record: ProductRecord) => {
  if (record.origin !== 'override') {
    return false;
  }

  const seed = seedProductos.find(
    (product) => product.codigo === record.codigo
  );

  if (!seed) {
    return false;
  }

  const { deletedAt, ...rest } = record;
  const { ...seedRest } = seed;

  return JSON.stringify(rest) === JSON.stringify(seedRest) && !deletedAt;
};

export const loadProducts = (options?: {
  includeDeleted?: boolean;
}): ProductRecord[] => {
  const includeDeleted = options?.includeDeleted ?? false;
  return mergeProducts(includeDeleted).sort((a, b) =>
    a.nombre.localeCompare(b.nombre)
  );
};

export const addProduct = (
  payload: Omit<Producto, 'codigo'> & {
    codigo?: string;
    deletedAt?: string | null;
  }
): ProductRecord => {
  const codigo = (
    payload.codigo ?? generateProductCode(payload.nombre)
  ).toUpperCase();
  const existing = mergeProducts(true).some(
    (product) => product.codigo === codigo
  );

  if (existing) {
    throw new Error('Ya existe un producto con ese código');
  }

  const timestamp = new Date().toISOString();
  const record: StoredProduct = {
    ...payload,
    codigo,
    origin: 'custom',
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  upsertOverride(record);
  return record;
};

export const updateProduct = (
  codigo: string,
  updates: ProductUpdate
): ProductRecord => {
  const current = mergeProducts(true).find(
    (product) => product.codigo === codigo
  );

  if (!current) {
    throw new ReferenceError('Producto no encontrado');
  }

  const timestamp = new Date().toISOString();
  const origin: ProductOrigin =
    current.origin === 'seed' ? 'override' : current.origin;
  const next: StoredProduct = {
    ...current,
    ...updates,
    codigo,
    origin,
    deletedAt: updates.deletedAt ?? current.deletedAt,
    createdAt: current.createdAt,
    updatedAt: timestamp,
  };

  if (origin === 'override' && isOverrideRedundant(next)) {
    removeOverride(codigo);
    return { ...current, deletedAt: undefined, origin: 'seed' };
  }

  upsertOverride(next);
  return next;
};

export const softDeleteProduct = (codigo: string): ProductRecord => {
  const now = new Date().toISOString();
  return updateProduct(codigo, { deletedAt: now });
};

export const restoreProduct = (codigo: string): ProductRecord => {
  const current = mergeProducts(true).find(
    (product) => product.codigo === codigo
  );

  if (!current) {
    throw new ReferenceError('Producto no encontrado');
  }

  if (current.origin === 'seed' && !current.deletedAt) {
    return current;
  }

  return updateProduct(codigo, { deletedAt: null });
};

export const subscribeToProducts = (listener: () => void) => {
  if (!isBrowser) {
    return () => {};
  }

  const handler = () => listener();
  window.addEventListener(PRODUCT_EVENT, handler);
  window.addEventListener('storage', handler);

  return () => {
    window.removeEventListener(PRODUCT_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
};
