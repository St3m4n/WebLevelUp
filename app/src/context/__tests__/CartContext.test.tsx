import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CartProvider, useCart } from '../CartContext';
import type { Producto } from '@/types';
import type { AuthenticatedUser } from '@/services/authService';

const mockProducts: Producto[] = [
  {
    codigo: 'prod-1',
    nombre: 'Teclado Gamer',
    categoria: 'Periféricos',
    fabricante: 'LevelUp',
    distribuidor: 'LevelUp',
    precio: 15000,
    stock: 5,
    stockCritico: 1,
    url: 'teclado.png',
    descripcion: 'Teclado mecánico RGB',
    deletedAt: null,
  },
];

let remoteItems: Array<{ productCode: string; quantity: number }> = [];

const mockGetCart = vi.fn(async () => ({
  userRun: '12345678-9',
  items: remoteItems,
  totalQuantity: remoteItems.reduce((sum, item) => sum + item.quantity, 0),
  updatedAt: new Date().toISOString(),
}));

const mockUpdateCart = vi.fn(async (payload: unknown) => {
  const p = payload as { items?: { productCode: string; quantity: number }[] };
  const items = Array.isArray(p?.items)
    ? p.items.map((item) => ({
        ...item,
      }))
    : [];
  remoteItems = items;
  return {
    userRun: '12345678-9',
    items: remoteItems,
    totalQuantity: remoteItems.reduce((sum, item) => sum + item.quantity, 0),
    updatedAt: new Date().toISOString(),
  };
});

const authState: { user: AuthenticatedUser | null } = {
  user: null,
};

vi.mock('@/services/products', () => ({
  fetchProducts: () => Promise.resolve(mockProducts),
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => authState,
}));

vi.mock('@/context/ToastContext', () => ({
  useToast: () => ({
    addToast: vi.fn(),
  }),
}));

vi.mock('@/services/cartService', () => ({
  getCart: () => mockGetCart(),
  updateCart: (payload: unknown) => mockUpdateCart(payload),
}));

vi.mock('@/hooks/usePricing', () => ({
  // El pricing se mantiene neutro para centrarse en la lógica de cantidades.
  usePricing: () => ({
    hasDuocDiscount: false,
    discountRate: 0,
    applyDiscount: (price: number) => price,
    getPriceBreakdown: (price: number) => ({
      basePrice: price,
      finalPrice: price,
      hasDiscount: false,
      discountRate: 0,
      savings: 0,
    }),
  }),
}));

type CartValue = ReturnType<typeof useCart>;

const Consumer = ({ onReady }: { onReady: (value: CartValue) => void }) => {
  const cart = useCart();
  onReady(cart);
  return (
    <div>
      <span data-testid="items-count">{cart.totalCantidad}</span>
      <span data-testid="subtotal">{cart.subtotal}</span>
      <button type="button" onClick={() => cart.addItem(mockProducts[0])}>
        add
      </button>
      <button type="button" onClick={() => cart.updateCantidad('prod-1', 3)}>
        update-3
      </button>
      <button type="button" onClick={() => cart.removeItem('prod-1')}>
        remove
      </button>
    </div>
  );
};

describe('CartContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('agrega productos respetando stock máximo', () => {
    let latestContext: CartValue | null = null;
    const handleReady = (value: CartValue) => {
      latestContext = value;
    };

    // Montamos el provider con un consumidor que nos expone el contexto para aserciones directas.
    render(
      <CartProvider>
        <Consumer onReady={handleReady} />
      </CartProvider>
    );

    // Intentamos añadir más unidades de las disponibles para verificar el tope por stock.
    act(() => {
      latestContext?.addItem(mockProducts[0], 10);
    });

    // Se espera que el carrito limite a 5 unidades y actualice las cifras derivadas.
    expect(latestContext).not.toBeNull();
    const contextAfterAdd = latestContext!;
    expect(contextAfterAdd.items[0]?.cantidad).toBe(5);
    expect(screen.getByTestId('items-count').textContent).toBe('5');
    expect(screen.getByTestId('subtotal').textContent).toBe('75000');
  });

  it('actualiza y elimina productos del carrito', () => {
    let latestContext: CartValue | null = null;
    const handleReady = (value: CartValue) => {
      latestContext = value;
    };

    // Montamos nuevamente el provider con el consumidor auxiliar.
    render(
      <CartProvider>
        <Consumer onReady={handleReady} />
      </CartProvider>
    );

    // Agrega el producto inicial.
    act(() => {
      latestContext?.addItem(mockProducts[0]);
    });

    // Ajusta la cantidad a tres unidades y comprueba el resultado.
    act(() => {
      latestContext?.updateCantidad('prod-1', 3);
    });

    expect(latestContext).not.toBeNull();
    const contextAfterUpdate = latestContext!;
    expect(contextAfterUpdate.items[0]?.cantidad).toBe(3);

    // Finalmente elimina el producto y valida que el carrito quede vacío.
    act(() => {
      latestContext?.removeItem('prod-1');
    });

    expect(latestContext).not.toBeNull();
    const contextAfterRemove = latestContext!;
    expect(contextAfterRemove.items).toHaveLength(0);
  });
});
