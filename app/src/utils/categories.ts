import type { Categoria } from '@/types';
import type { ProductDto } from '@/services/products';

const CATEGORY_STORAGE_KEY = 'categorias';
const CATEGORY_UPDATED_EVENT = 'levelup-categories-updated';

const isBrowser = typeof window !== 'undefined';

const extractCategoriesFromProducts = (products: ProductDto[]): Categoria[] => {
  const unique = new Map<string, Categoria>();
  products.forEach((producto) => {
    const raw = producto.categoria?.trim();
    if (!raw) return;
    const key = raw.toLowerCase();
    if (!unique.has(key)) {
      unique.set(key, { name: raw });
    }
  });
  return Array.from(unique.values());
};

const sanitizeCategoria = (candidate: unknown): Categoria | null => {
  if (typeof candidate === 'string') {
    const clean = candidate.trim();
    if (!clean) return null;
    return { name: clean };
  }
  if (!candidate || typeof candidate !== 'object') {
    return null;
  }
  const partial = candidate as {
    id?: unknown;
    name?: unknown;
    deletedAt?: unknown;
  };
  if (typeof partial.name !== 'string') {
    return null;
  }
  const clean = partial.name.trim();
  if (!clean) return null;
  const categoria: Categoria = { name: clean };
  if (typeof partial.id === 'number' && Number.isFinite(partial.id)) {
    categoria.id = partial.id;
  }
  if (typeof partial.deletedAt === 'string' && partial.deletedAt) {
    categoria.deletedAt = partial.deletedAt;
  }
  return categoria;
};

const dedupeCategorias = (categorias: Categoria[]): Categoria[] => {
  const map = new Map<string, Categoria>();
  categorias.forEach((categoria) => {
    const key = categoria.name.toLowerCase();
    const normalizedDeletedAt =
      categoria.deletedAt == null || categoria.deletedAt === ''
        ? undefined
        : categoria.deletedAt;
    const normalizedEntry: Categoria = {
      ...categoria,
      deletedAt: normalizedDeletedAt,
    };
    const existing = map.get(key);
    if (!existing) {
      map.set(key, { ...normalizedEntry });
      return;
    }
    const merged: Categoria = {
      ...existing,
      id: existing.id ?? normalizedEntry.id,
      deletedAt: normalizedEntry.deletedAt ?? existing.deletedAt,
    };
    if (normalizedEntry.deletedAt === undefined) {
      merged.deletedAt = undefined;
    }
    map.set(key, merged);
  });
  return Array.from(map.values());
};

export const loadCategories = (): Categoria[] => {
  if (!isBrowser) {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(CATEGORY_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    const sanitized = parsed
      .map((item) => sanitizeCategoria(item))
      .filter((item): item is Categoria => Boolean(item));
    return dedupeCategorias(sanitized);
  } catch (error) {
    console.warn('No se pudieron cargar las categorías', error);
    return [];
  }
};

const persistCategories = (categorias: Categoria[]) => {
  if (!isBrowser) return;
  try {
    const payload = categorias.map((categoria) => {
      const base: Record<string, unknown> = {
        name: categoria.name,
      };
      if (typeof categoria.id === 'number') {
        base.id = categoria.id;
      }
      if (categoria.deletedAt) {
        base.deletedAt = categoria.deletedAt;
      }
      return base;
    });
    window.localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(payload));
    window.dispatchEvent(new Event(CATEGORY_UPDATED_EVENT));
  } catch (error) {
    console.warn('No se pudieron guardar las categorías', error);
  }
};

export const saveCategories = (categorias: Categoria[]) => {
  persistCategories(categorias);
};

export const seedCategoriesFromProducts = (
  currentCategories: Categoria[],
  products: ProductDto[]
): Categoria[] => {
  const current = dedupeCategorias(currentCategories);
  const base = extractCategoriesFromProducts(products);
  const existingKeys = new Set(
    current.map((categoria) => categoria.name.toLowerCase())
  );
  const additions = base.filter(
    (categoria) => !existingKeys.has(categoria.name.toLowerCase())
  );
  if (additions.length === 0) {
    return current;
  }
  return dedupeCategorias([...current, ...additions]);
};

export const subscribeToCategories = (listener: () => void) => {
  if (!isBrowser) return () => undefined;
  const handler = () => listener();
  window.addEventListener(CATEGORY_UPDATED_EVENT, handler);
  return () => window.removeEventListener(CATEGORY_UPDATED_EVENT, handler);
};

export const CATEGORY_STORAGE_KEYS = {
  key: CATEGORY_STORAGE_KEY,
  event: CATEGORY_UPDATED_EVENT,
};
