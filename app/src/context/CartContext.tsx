import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react';
import type { Producto } from '@/types';
import { fetchProducts } from '@/services/products';
import { usePricing, type PriceBreakdown } from '@/hooks/usePricing';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import {
  getCart,
  updateCart,
  type CartItemInput,
  type UpdateCartRequest,
} from '@/services/cartService';
import { ApiError } from '@/services/apiClient';

export type CartItem = {
  id: string;
  nombre: string;
  precio: number;
  cantidad: number;
  imagen: string;
  stock: number;
};

type CartState = {
  items: CartItem[];
};

export type CartItemPricing = {
  unitBase: number;
  unitFinal: number;
  subtotalBase: number;
  subtotalFinal: number;
  savingsUnit: number;
  savingsSubtotal: number;
  hasDiscount: boolean;
  discountRate: number;
};

type CartAction =
  | { type: 'ADD_ITEM'; payload: Producto; cantidad?: number }
  | { type: 'REMOVE_ITEM'; payload: { id: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; cantidad: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_ITEMS'; payload: CartItem[] }
  | { type: 'SYNC_PRODUCTS'; payload: Producto[] };

export type CartContextValue = {
  items: CartItem[];
  totalCantidad: number;
  subtotal: number;
  total: number;
  totalSavings: number;
  hasDuocDiscount: boolean;
  discountRate: number;
  getItemPricing: (item: CartItem) => CartItemPricing;
  addItem: (producto: Producto, cantidad?: number) => void;
  removeItem: (id: string) => void;
  updateCantidad: (id: string, cantidad: number) => void;
  clearCart: () => void;
};

const CART_STORAGE_KEY = 'levelup-cart';
const USER_CART_STORAGE_PREFIX = 'levelup-cart-user:';
const isBrowser = typeof window !== 'undefined';

const CartContext = createContext<CartContextValue | undefined>(undefined);

const getStorageKeyForUser = (run: string | null) =>
  run ? `${USER_CART_STORAGE_PREFIX}${run}` : CART_STORAGE_KEY;

const toCartItemInputs = (items: CartItem[]): CartItemInput[] =>
  items
    .filter((item) => item.cantidad > 0)
    .map((item) => ({ productCode: item.id, quantity: item.cantidad }));

const mapRemoteItemsToCartItems = (
  items: CartItemInput[],
  products: Producto[]
): CartItem[] => {
  if (!items || items.length === 0) {
    return [];
  }

  const productMap = new Map(
    products.map((producto) => [producto.codigo, producto])
  );

  return items
    .map((entry) => {
      const producto = productMap.get(entry.productCode);
      if (!producto || producto.deletedAt || producto.stock <= 0) {
        return undefined;
      }
      const cantidad = Math.min(
        Math.max(1, Number(entry.quantity) || 0),
        producto.stock
      );
      if (cantidad <= 0) {
        return undefined;
      }
      return {
        id: producto.codigo,
        nombre: producto.nombre,
        precio: producto.precio,
        cantidad,
        imagen: producto.url || '',
        stock: producto.stock,
      } satisfies CartItem;
    })
    .filter(Boolean) as CartItem[];
};

const extractApiErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof ApiError) {
    const details = error.details as
      | { message?: unknown; error?: unknown }
      | undefined;
    const candidates = [details?.message, details?.error];
    const message = candidates
      .map((value) =>
        typeof value === 'string' && value.trim().length > 0
          ? value.trim()
          : undefined
      )
      .find(Boolean);
    if (message) {
      return message;
    }
    if (error.message && error.message.trim()) {
      return error.message.trim();
    }
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }
  return fallback;
};

const sanitizeStoredItems = (items?: Partial<CartItem>[]): CartItem[] => {
  if (!items || items.length === 0) {
    return [];
  }

  return items
    .map((stored) => {
      if (!stored?.id || !stored.nombre || typeof stored.precio !== 'number')
        return undefined;
      const cantidad = Math.max(1, stored.cantidad ?? 1);
      return {
        id: stored.id,
        nombre: stored.nombre,
        precio: stored.precio,
        cantidad,
        imagen: stored.imagen || '',
        stock: stored.stock ?? 0,
      } satisfies CartItem;
    })
    .filter(Boolean) as CartItem[];
};

const readCartStateFromStorage = (storageKey: string): CartState => {
  if (!isBrowser) {
    return { items: [] };
  }
  const raw = window.localStorage.getItem(storageKey);
  if (!raw) {
    return { items: [] };
  }
  try {
    const parsed = JSON.parse(raw) as { items?: Partial<CartItem>[] };
    const sanitizedItems = sanitizeStoredItems(parsed.items ?? []);
    return { items: sanitizedItems };
  } catch (error) {
    console.warn('Error al parsear el carrito, limpiando', error);
    window.localStorage.removeItem(storageKey);
    return { items: [] };
  }
};

const initializeCartState = (run: string | null): CartState =>
  readCartStateFromStorage(getStorageKeyForUser(run));

const mergeCartItems = (
  primary: CartItem[],
  secondary: CartItem[]
): CartItem[] => {
  if (secondary.length === 0) {
    return primary;
  }
  const quantities = new Map<string, number>();
  const accumulate = (item: CartItem) => {
    quantities.set(item.id, (quantities.get(item.id) ?? 0) + item.cantidad);
  };
  primary.forEach(accumulate);
  secondary.forEach(accumulate);

  const combined = Array.from(quantities.entries()).map(([id, cantidad]) => ({
    id,
    cantidad,
  }));
  return sanitizeStoredItems(combined);
};

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const cantidad = action.cantidad ?? 1;
      const existing = state.items.find(
        (item) => item.id === action.payload.codigo
      );
      if (existing) {
        return {
          items: state.items.map((item) =>
            item.id === existing.id
              ? {
                ...item,
                cantidad: Math.min(
                  item.cantidad + cantidad,
                  action.payload.stock
                ),
                stock: action.payload.stock,
              }
              : item
          ),
        };
      }
      return {
        items: [
          ...state.items,
          {
            id: action.payload.codigo,
            nombre: action.payload.nombre,
            precio: action.payload.precio,
            cantidad: Math.min(cantidad, action.payload.stock),
            imagen: action.payload.url,
            stock: action.payload.stock,
          },
        ],
      };
    }
    case 'REMOVE_ITEM': {
      return {
        items: state.items.filter((item) => item.id !== action.payload.id),
      };
    }
    case 'UPDATE_QUANTITY': {
      return {
        items: state.items.map((item) => {
          if (item.id !== action.payload.id) {
            return item;
          }
          const maxCantidad = item.stock || 1;
          const nextCantidad = Math.min(
            Math.max(1, action.payload.cantidad),
            maxCantidad
          );
          return { ...item, cantidad: nextCantidad };
        }),
      };
    }
    case 'CLEAR_CART':
      return { items: [] };
    case 'SET_ITEMS':
      return { items: action.payload };
    case 'SYNC_PRODUCTS': {
      const productMap = new Map(
        action.payload.map((product) => [product.codigo, product])
      );

      const syncItems = state.items
        .map((item) => {
          const product = productMap.get(item.id);
          if (!product || product.deletedAt || product.stock <= 0) {
            return undefined;
          }
          const cantidad = Math.min(item.cantidad, product.stock);
          if (cantidad <= 0) {
            return undefined;
          }
          return {
            ...item,
            nombre: product.nombre,
            precio: product.precio,
            imagen: product.url,
            stock: product.stock,
            cantidad,
          } satisfies CartItem;
        })
        .filter(Boolean) as CartItem[];

      if (syncItems.length === state.items.length) {
        let unchanged = true;
        for (let index = 0; index < syncItems.length; index += 1) {
          const prev = state.items[index];
          const next = syncItems[index];
          if (
            prev.id !== next.id ||
            prev.cantidad !== next.cantidad ||
            prev.precio !== next.precio ||
            prev.stock !== next.stock ||
            prev.nombre !== next.nombre ||
            prev.imagen !== next.imagen
          ) {
            unchanged = false;
            break;
          }
        }

        if (unchanged) {
          return state;
        }
      }

      return { items: syncItems };
    }
    default:
      return state;
  }
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const userRun = user?.run ?? null;
  const [state, dispatch] = useReducer(cartReducer, undefined, () =>
    initializeCartState(userRun)
  );
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  const previousUserRunRef = useRef<string | null>(userRun);
  const hydratingRef = useRef(false);
  const lastSuccessfulSyncRef = useRef<string | null>(null);
  const failedSnapshotRef = useRef<string | null>(null);
  const clearCartIntentRef = useRef(false);
  const { hasDuocDiscount, discountRate, applyDiscount, getPriceBreakdown } =
    usePricing();
  const sendCartUpdate = useCallback(
    async (payload: CartItemInput[], options?: { forceReplace?: boolean }) => {
      const request: UpdateCartRequest = {
        items: payload,
        ...(options?.forceReplace ? { forceReplace: true } : {}),
      };
      await updateCart(request);
    },
    []
  );

  const synchronizeFromServer = useCallback(
    async (options?: { mergeGuest?: boolean }) => {
      if (!userRun) {
        return { items: [] as CartItem[], snapshot: '[]' };
      }

      try {
        const products = await fetchProducts().catch(() => []);
        const response = await getCart().catch((error) => {
          if (error instanceof ApiError && error.status === 404) {
            return null;
          }
          throw error;
        });

        const remoteItemsInput = response?.items ?? [];
        const remoteSnapshot = JSON.stringify(
          remoteItemsInput.map((entry) => ({
            productCode: entry.productCode,
            quantity: entry.quantity,
          }))
        );
        const remoteItems = mapRemoteItemsToCartItems(remoteItemsInput, products);

        let mergedItems = remoteItems;
        if (options?.mergeGuest) {
          const guestItems = initializeCartState(null).items;
          mergedItems = mergeCartItems(remoteItems, guestItems);
        }

        const mergedPayload = toCartItemInputs(mergedItems);
        const mergedSnapshot = JSON.stringify(mergedPayload);

        hydratingRef.current = true;
        dispatch({ type: 'SET_ITEMS', payload: mergedItems });
        lastSuccessfulSyncRef.current = mergedSnapshot;
        failedSnapshotRef.current = null;
        previousUserRunRef.current = userRun;

        if (isBrowser) {
          window.localStorage.setItem(
            getStorageKeyForUser(userRun),
            JSON.stringify({ items: mergedItems })
          );
          window.localStorage.removeItem(CART_STORAGE_KEY);
        }

        if (mergedSnapshot !== remoteSnapshot) {
          await sendCartUpdate(mergedPayload);
        }

        return { items: mergedItems, snapshot: mergedSnapshot };
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          const guestItems = options?.mergeGuest
            ? mergeCartItems([], initializeCartState(null).items)
            : [];
          const payload = toCartItemInputs(guestItems);
          const snapshot = JSON.stringify(
            guestItems.map((item) => ({
              productCode: item.id,
              quantity: item.cantidad,
            }))
          );
          hydratingRef.current = true;
          dispatch({ type: 'SET_ITEMS', payload: guestItems });
          lastSuccessfulSyncRef.current = snapshot;
          failedSnapshotRef.current = null;
          previousUserRunRef.current = userRun;

          if (isBrowser) {
            window.localStorage.setItem(
              getStorageKeyForUser(userRun),
              JSON.stringify({ items: guestItems })
            );
            window.localStorage.removeItem(CART_STORAGE_KEY);
          }

          if (payload.length > 0) {
            await sendCartUpdate(payload);
          }

          return { items: guestItems, snapshot };
        }

        throw error;
      } finally {
        hydratingRef.current = false;
      }
    },
    [userRun, sendCartUpdate]
  );

  useEffect(() => {
    if (!isBrowser) return;
    const previousRun = previousUserRunRef.current;
    if (previousRun === userRun) {
      return;
    }

    if (userRun) {
      const hydrate = async () => {
        try {
          await synchronizeFromServer({ mergeGuest: true });
        } catch (error) {
          addToast({
            variant: 'error',
            title: 'No se pudo cargar tu carrito',
            description: extractApiErrorMessage(
              error,
              'Intentaremos de nuevo en unos segundos.'
            ),
          });
          const fallback = mergeCartItems([], initializeCartState(null).items);
          hydratingRef.current = true;
          dispatch({ type: 'SET_ITEMS', payload: fallback });
          hydratingRef.current = false;
          const fallbackSnapshot = JSON.stringify(toCartItemInputs(fallback));
          lastSuccessfulSyncRef.current = null;
          failedSnapshotRef.current = fallbackSnapshot;
          previousUserRunRef.current = userRun;
        }
      };

      hydrate();
      return;
    }

    if (previousRun && isBrowser) {
      window.localStorage.setItem(
        getStorageKeyForUser(previousRun),
        JSON.stringify(stateRef.current)
      );
    }

    clearCartIntentRef.current = false;

    previousUserRunRef.current = null;
    lastSuccessfulSyncRef.current = null;
    failedSnapshotRef.current = null;

    const guestState = initializeCartState(null);
    hydratingRef.current = true;
    dispatch({ type: 'SET_ITEMS', payload: guestState.items });
    hydratingRef.current = false;
  }, [userRun, synchronizeFromServer, addToast]);

  useEffect(() => {
    if (!isBrowser) return;
    const storageKey = userRun
      ? getStorageKeyForUser(userRun)
      : CART_STORAGE_KEY;
    window.localStorage.setItem(storageKey, JSON.stringify(state));
    if (userRun) {
      window.localStorage.removeItem(CART_STORAGE_KEY);
    }
  }, [state, userRun]);

  useEffect(() => {
    if (!userRun) {
      clearCartIntentRef.current = false;
      lastSuccessfulSyncRef.current = null;
      failedSnapshotRef.current = null;
      return;
    }

    if (hydratingRef.current) {
      hydratingRef.current = false;
      return;
    }

    const payload = toCartItemInputs(state.items);
    const snapshot = JSON.stringify(payload);

    if (snapshot === lastSuccessfulSyncRef.current) {
      failedSnapshotRef.current = null;
      return;
    }

    if (snapshot === failedSnapshotRef.current) {
      return;
    }

    let cancelled = false;
    const forceReplace = payload.length === 0 && clearCartIntentRef.current;
    if (clearCartIntentRef.current) {
      clearCartIntentRef.current = false;
    }

    (async () => {
      try {
        await sendCartUpdate(
          payload,
          forceReplace ? { forceReplace: true } : undefined
        );

        if (cancelled) {
          return;
        }

        lastSuccessfulSyncRef.current = snapshot;
        failedSnapshotRef.current = null;
      } catch (error) {
        if (cancelled) {
          return;
        }

        failedSnapshotRef.current = snapshot;
        addToast({
          variant: 'error',
          title: 'No se pudo sincronizar el carrito',
          description: extractApiErrorMessage(
            error,
            'Intenta nuevamente en unos segundos.'
          ),
        });

        try {
          await synchronizeFromServer();
        } catch (syncError) {
          console.warn('No se pudo refrescar carrito remoto', syncError);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [state.items, userRun, addToast, synchronizeFromServer, sendCartUpdate]);

  useEffect(() => {
    const sync = async () => {
      try {
        const products = await fetchProducts();
        dispatch({ type: 'SYNC_PRODUCTS', payload: products });
      } catch (error) {
        console.warn('Failed to sync products for cart', error);
      }
    };

    sync();
  }, []);

  const addItem = useCallback((producto: Producto, cantidad?: number) => {
    dispatch({ type: 'ADD_ITEM', payload: producto, cantidad });
  }, []);

  const removeItem = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { id } });
  }, []);

  const updateCantidad = useCallback((id: string, cantidad: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, cantidad } });
  }, []);

  const clearCart = useCallback(() => {
    clearCartIntentRef.current = true;
    dispatch({ type: 'CLEAR_CART' });
  }, []);

  const totalCantidad = useMemo(
    () => state.items.reduce((sum, item) => sum + item.cantidad, 0),
    [state.items]
  );

  const subtotal = useMemo(
    () =>
      state.items.reduce((sum, item) => sum + item.cantidad * item.precio, 0),
    [state.items]
  );

  const total = useMemo(
    () =>
      state.items.reduce(
        (sum, item) => sum + item.cantidad * applyDiscount(item.precio),
        0
      ),
    [applyDiscount, state.items]
  );

  const totalSavings = useMemo(
    () => Math.max(0, subtotal - total),
    [subtotal, total]
  );

  const getItemPricing = useCallback(
    (item: CartItem): CartItemPricing => {
      const breakdown: PriceBreakdown = getPriceBreakdown(item.precio);
      const subtotalBase = breakdown.basePrice * item.cantidad;
      const subtotalFinal = breakdown.finalPrice * item.cantidad;
      const savingsSubtotal = Math.max(0, subtotalBase - subtotalFinal);
      return {
        unitBase: breakdown.basePrice,
        unitFinal: breakdown.finalPrice,
        subtotalBase,
        subtotalFinal,
        savingsUnit: breakdown.savings,
        savingsSubtotal,
        hasDiscount: breakdown.hasDiscount,
        discountRate: breakdown.discountRate,
      };
    },
    [getPriceBreakdown]
  );

  const value = useMemo(
    () => ({
      items: state.items,
      totalCantidad,
      subtotal,
      total,
      totalSavings,
      hasDuocDiscount,
      discountRate,
      getItemPricing,
      addItem,
      removeItem,
      updateCantidad,
      clearCart,
    }),
    [
      state.items,
      totalCantidad,
      subtotal,
      total,
      totalSavings,
      hasDuocDiscount,
      discountRate,
      getItemPricing,
      addItem,
      removeItem,
      updateCantidad,
      clearCart,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = (): CartContextValue => {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart debe usarse dentro de CartProvider');
  }
  return ctx;
};
