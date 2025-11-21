import type { Producto } from '@/types';

import {
  fetchProductByCode,
  fetchProducts,
  type ProductDto,
} from '@/services/products';

const PRODUCT_STORAGE_KEY = 'levelup-products-overrides';
const PRODUCT_EVENT = 'levelup:products-updated';
const DEFAULT_DELETED_AT = '1970-01-01T00:00:00.000Z';

type ProductOrigin = 'seed' | 'custom' | 'override' | 'api';

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

const logWarning = (message: string, error?: unknown) => {
  if (error) {
    console.warn(`[products] ${message}`, error);
    return;
  }
  console.warn(`[products] ${message}`);
};

const sanitizeString = (value: unknown, fallback = ''): string => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.length > 0) {
      return trimmed;
    }
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return fallback;
};

const sanitizeNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return fallback;
};

const resolveImageUrl = (product: ProductDto): string => {
  const candidates = [product.imagenUrl, product.url];
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
  }
  return '';
};

const resolveDeletedAt = (product: ProductDto): string | null => {
  if (typeof product.deletedAt === 'string' && product.deletedAt) {
    return product.deletedAt;
  }
  if (typeof product.eliminado === 'boolean') {
    if (product.eliminado) {
      return product.updatedAt ?? product.createdAt ?? DEFAULT_DELETED_AT;
    }
    return null;
  }
  return null;
};

const toRecord = (
  producto: Producto,
  origin: ProductOrigin,
  metadata?: {
    deletedAt?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
  }
): ProductRecord => ({
  ...producto,
  origin,
  deletedAt:
    metadata && 'deletedAt' in metadata
      ? metadata.deletedAt ?? null
      : null,
  createdAt: metadata?.createdAt ?? undefined,
  updatedAt: metadata?.updatedAt ?? undefined,
});

const sortByName = (records: ProductRecord[]): ProductRecord[] =>
  [...records].sort((a, b) => a.nombre.localeCompare(b.nombre));

let baseProducts: ProductRecord[] = [];
let baseMap: Map<string, ProductRecord> | null = null;

const getBaseMap = (): Map<string, ProductRecord> => {
  if (!baseMap) {
    baseMap = new Map(
      baseProducts.map((product) => [product.codigo, { ...product }])
    );
  }
  return baseMap;
};

const setBaseProducts = (products: ProductRecord[]) => {
  baseProducts = products;
  baseMap = null;
};

const notifyUpdates = () => {
  if (!isBrowser) {
    return;
  }
  window.dispatchEvent(new CustomEvent(PRODUCT_EVENT));
};

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
    logWarning('Failed to parse overrides', error);
    return [];
  }
};

const persistOverrides = (overrides: StoredProduct[]) => {
  if (!isBrowser) {
    return;
  }

  window.localStorage.setItem(PRODUCT_STORAGE_KEY, JSON.stringify(overrides));
  notifyUpdates();
};

const mergeProducts = (includeDeleted: boolean): ProductRecord[] => {
  const merged = new Map<string, ProductRecord>();
  const baseEntries = getBaseMap();

  baseEntries.forEach((value, key) => {
    merged.set(key, { ...value, deletedAt: value.deletedAt ?? null });
  });

  const overrides = readOverrides();

  for (const override of overrides) {
    const base = baseEntries.get(override.codigo);
    const inferredOrigin: ProductOrigin =
      override.origin ?? (base ? 'override' : 'custom');

    merged.set(override.codigo, {
      ...(base ? { ...base } : {}),
      ...override,
      origin: inferredOrigin,
      deletedAt: override.deletedAt ?? null,
    });
  }

  const values = Array.from(merged.values());
  const filtered = includeDeleted
    ? values
    : values.filter((product) => !product.deletedAt);

  return sortByName(filtered);
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

const comparableSnapshot = (record: ProductRecord) => {
  const { origin, createdAt, updatedAt, ...rest } = record;
  return {
    ...rest,
    deletedAt: record.deletedAt ?? null,
  } satisfies Omit<ProductRecord, 'origin' | 'createdAt' | 'updatedAt'>;
};

const isOverrideRedundant = (record: ProductRecord) => {
  if (record.origin !== 'override') {
    return false;
  }

  const base = getBaseMap().get(record.codigo);

  if (!base) {
    return false;
  }

  return (
    JSON.stringify(comparableSnapshot(record)) ===
    JSON.stringify(comparableSnapshot(base))
  );
};

let hasScheduledInitialSync = false;
let ongoingSync: Promise<ProductRecord[]> | null = null;

const applyBaseProducts = (next: ProductRecord[]): boolean => {
  const previousSnapshot = JSON.stringify(baseProducts);
  const nextSnapshot = JSON.stringify(next);

  if (previousSnapshot === nextSnapshot) {
    return false;
  }

  setBaseProducts(next.map((product) => ({ ...product })));
  return true;
};

const mapApiProduct = (product: ProductDto): ProductRecord | null => {
  const codigo = sanitizeString(product.codigo).toUpperCase();
  if (!codigo) {
    return null;
  }

  const nombre = sanitizeString(product.nombre, 'Producto sin nombre') ||
    'Producto sin nombre';

  const base: Producto = {
    codigo,
    nombre,
    categoria: sanitizeString(product.categoria, 'Sin categoría') ||
      'Sin categoría',
    fabricante: sanitizeString(product.fabricante, 'Sin fabricante') ||
      'Sin fabricante',
    distribuidor: sanitizeString(product.distribuidor, 'Sin distribuidor') ||
      'Sin distribuidor',
    precio: sanitizeNumber(product.precio),
    stock: Math.max(0, sanitizeNumber(product.stock)),
    stockCritico: Math.max(0, sanitizeNumber(product.stockCritico)),
    url: resolveImageUrl(product),
    descripcion: sanitizeString(product.descripcion),
  };

  return toRecord(base, 'api', {
    deletedAt: resolveDeletedAt(product),
    createdAt: product.createdAt ?? null,
    updatedAt: product.updatedAt ?? null,
  });
};

const performApiSync = async (): Promise<ProductRecord[]> => {
  const apiProducts = await fetchProducts();
  const mapped = apiProducts
    .map((item) => mapApiProduct(item))
    .filter((item): item is ProductRecord => Boolean(item));

  const normalized = sortByName(mapped);
  const changed = applyBaseProducts(normalized);

  if (changed) {
    notifyUpdates();
  }

  return mergeProducts(true);
};

const ensureInitialSync = () => {
  if (!isBrowser || hasScheduledInitialSync) {
    return;
  }
  hasScheduledInitialSync = true;
  requestProductsSync().catch((error) => {
    logWarning('Initial sync failed', error);
  });
};

export const requestProductsSync = (): Promise<ProductRecord[]> => {
  if (!isBrowser) {
    return Promise.resolve(mergeProducts(true));
  }

  if (ongoingSync) {
    return ongoingSync;
  }

  const pending = performApiSync().catch((error) => {
    logWarning('Unable to synchronize products from API', error);
    throw error;
  });

  ongoingSync = pending;

  pending
    .catch(() => undefined)
    .finally(() => {
      if (ongoingSync === pending) {
        ongoingSync = null;
      }
    });

  return pending;
};

export const loadProducts = (options?: {
  includeDeleted?: boolean;
}): ProductRecord[] => {
  ensureInitialSync();
  const includeDeleted = options?.includeDeleted ?? false;
  return mergeProducts(includeDeleted);
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
    deletedAt: payload.deletedAt ?? null,
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
    current.origin === 'seed' || current.origin === 'api'
      ? 'override'
      : current.origin;
  const next: StoredProduct = {
    ...current,
    ...updates,
    codigo,
    origin,
    deletedAt: updates.deletedAt ?? current.deletedAt ?? null,
    createdAt: current.createdAt,
    updatedAt: timestamp,
  };

  if (origin === 'override' && isOverrideRedundant(next)) {
    removeOverride(codigo);
    const base = getBaseMap().get(codigo);
    return base ?? { ...current, deletedAt: null, origin: 'seed' };
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

  if (
    (current.origin === 'seed' || current.origin === 'api') &&
    !current.deletedAt
  ) {
    return current;
  }

  const restored = updateProduct(codigo, { deletedAt: null });

  if (restored.origin === 'override' && restored.deletedAt === null) {
    const isRedundant = isOverrideRedundant(restored);
    if (isRedundant) {
      removeOverride(codigo);
      const base = getBaseMap().get(codigo);
      if (base) {
        return base;
      }
    }
  }

  return restored;
};

export const syncProductByCode = async (
  codigo: string
): Promise<ProductRecord | null> => {
  const normalized = sanitizeString(codigo).toUpperCase();
  if (!normalized) {
    return null;
  }

  const existing = mergeProducts(true).find(
    (product) => product.codigo.toUpperCase() === normalized
  );

  if (existing) {
    return existing;
  }

  try {
    const dto = await fetchProductByCode(normalized);
    const mapped = mapApiProduct(dto);
    if (!mapped) {
      return null;
    }

    const withoutTarget = baseProducts.filter(
      (product) => product.codigo !== mapped.codigo
    );
    const nextBase = sortByName([...withoutTarget, mapped]);
    const changed = applyBaseProducts(nextBase);
    if (changed) {
      notifyUpdates();
    }

    const refreshed = mergeProducts(true).find(
      (product) => product.codigo === mapped.codigo
    );

    return refreshed ?? mapped;
  } catch (error) {
    logWarning(`Unable to fetch product ${normalized}`, error);
    return null;
  }
};

export const subscribeToProducts = (listener: () => void) => {
  if (!isBrowser) {
    return () => {};
  }

  ensureInitialSync();

  const handler = () => listener();
  window.addEventListener(PRODUCT_EVENT, handler);
  window.addEventListener('storage', handler);

  return () => {
    window.removeEventListener(PRODUCT_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
};
