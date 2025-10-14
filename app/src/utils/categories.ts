import { loadProducts } from '@/utils/products';
import type { Categoria } from '@/types';

const CATEGORY_STORAGE_KEY = 'categorias';
const CATEGORY_UPDATED_EVENT = 'levelup-categories-updated';

const isBrowser = typeof window !== 'undefined';

const fromProductos = (): Categoria[] => {
  const unique = new Map<string, Categoria>();
  const products = loadProducts();
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
  const partial = candidate as { name?: unknown; deletedAt?: unknown };
  if (typeof partial.name !== 'string') {
    return null;
  }
  const clean = partial.name.trim();
  if (!clean) return null;
  const categoria: Categoria = { name: clean };
  if (typeof partial.deletedAt === 'string' && partial.deletedAt) {
    categoria.deletedAt = partial.deletedAt;
  }
  return categoria;
};

const dedupeCategorias = (categorias: Categoria[]): Categoria[] => {
  const map = new Map<string, Categoria>();
  categorias.forEach((categoria) => {
    const key = categoria.name.toLowerCase();
    const existing = map.get(key);
    if (!existing) {
      map.set(key, { ...categoria });
      return;
    }
    if (!existing.deletedAt && categoria.deletedAt) {
      map.set(key, { ...existing, deletedAt: categoria.deletedAt });
    }
  });
  return Array.from(map.values());
};

export const loadCategories = (): Categoria[] => {
  if (!isBrowser) {
    return dedupeCategorias(fromProductos());
  }
  try {
    const raw = window.localStorage.getItem(CATEGORY_STORAGE_KEY);
    if (!raw) {
      return dedupeCategorias(fromProductos());
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return dedupeCategorias(fromProductos());
    }
    const sanitized = parsed
      .map((item) => sanitizeCategoria(item))
      .filter((item): item is Categoria => Boolean(item));
    if (sanitized.length === 0) {
      return dedupeCategorias(fromProductos());
    }
    return dedupeCategorias(sanitized);
  } catch (error) {
    console.warn(
      'No se pudieron cargar las categorías, usando catálogo base',
      error
    );
    return dedupeCategorias(fromProductos());
  }
};

const persistCategories = (categorias: Categoria[]) => {
  if (!isBrowser) return;
  try {
    const payload = categorias.map((categoria) =>
      categoria.deletedAt
        ? { name: categoria.name, deletedAt: categoria.deletedAt }
        : categoria.name
    );
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
  categorias: Categoria[]
): Categoria[] => {
  const current = dedupeCategorias(categorias);
  const base = fromProductos();
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
