import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react';
import type { Producto } from '@/types';
import { productos } from '@/data/productos';

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

type CartAction =
  | { type: 'ADD_ITEM'; payload: Producto; cantidad?: number }
  | { type: 'REMOVE_ITEM'; payload: { id: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; cantidad: number } }
  | { type: 'CLEAR_CART' };

type CartContextValue = {
  items: CartItem[];
  totalCantidad: number;
  total: number;
  addItem: (producto: Producto, cantidad?: number) => void;
  removeItem: (id: string) => void;
  updateCantidad: (id: string, cantidad: number) => void;
  clearCart: () => void;
};

const CART_STORAGE_KEY = 'levelup-cart';

const CartContext = createContext<CartContextValue | undefined>(undefined);

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
    default:
      return state;
  }
};

const loadInitialState = (): CartState => {
  const raw = localStorage.getItem(CART_STORAGE_KEY);
  if (!raw) return { items: [] };
  try {
    const parsed = JSON.parse(raw) as { items?: Partial<CartItem>[] };
    if (!parsed.items) {
      return { items: [] };
    }

    const sanitizedItems: CartItem[] = parsed.items
      .map((stored) => {
        if (!stored?.id) return undefined;
        const producto = productos.find((item) => item.codigo === stored.id);
        const stock = producto?.stock ?? stored.stock ?? 0;
        if (stock <= 0) {
          return undefined;
        }
        const nombre = producto?.nombre ?? stored.nombre ?? 'Producto';
        const precio = producto?.precio ?? stored.precio ?? 0;
        const imagen = producto?.url ?? stored.imagen ?? '';
        const cantidad = Math.min(Math.max(1, stored.cantidad ?? 1), stock);

        return {
          id: stored.id,
          nombre,
          precio,
          cantidad,
          imagen,
          stock,
        } satisfies CartItem;
      })
      .filter(Boolean) as CartItem[];

    return { items: sanitizedItems };
  } catch (error) {
    console.warn('Error al parsear el carrito, limpiando', error);
    localStorage.removeItem(CART_STORAGE_KEY);
    return { items: [] };
  }
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(
    cartReducer,
    undefined,
    loadInitialState
  );

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state));
  }, [state]);

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
    dispatch({ type: 'CLEAR_CART' });
  }, []);

  const totalCantidad = useMemo(
    () => state.items.reduce((sum, item) => sum + item.cantidad, 0),
    [state.items]
  );

  const total = useMemo(
    () =>
      state.items.reduce((sum, item) => sum + item.cantidad * item.precio, 0),
    [state.items]
  );

  const value = useMemo(
    () => ({
      items: state.items,
      totalCantidad,
      total,
      addItem,
      removeItem,
      updateCantidad,
      clearCart,
    }),
    [
      state.items,
      totalCantidad,
      total,
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
