// @ts-nocheck
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import Checkout from '../Checkout';

const mockCartState = {
  items: [],
  subtotal: 0,
  total: 0,
  totalSavings: 0,
  hasDuocDiscount: false,
  discountRate: 0,
  totalCantidad: 0,
  getItemPricing: vi.fn(() => ({
    unitBase: 10000,
    unitFinal: 8000,
    subtotalBase: 10000,
    subtotalFinal: 8000,
    savingsUnit: 2000,
    savingsSubtotal: 2000,
    hasDiscount: true,
    discountRate: 0.2,
  })),
  addItem: vi.fn(),
  removeItem: vi.fn(),
  updateCantidad: vi.fn(),
  clearCart: vi.fn(),
};

const mockUser = {
  run: '11111111-1',
  nombre: 'Fran',
  apellidos: 'Tester',
  correo: 'fran@example.com',
  perfil: 'Cliente',
  fechaNacimiento: null,
  region: 'Metropolitana de Santiago',
  comuna: 'Santiago',
  direccion: 'Av. Providencia 123',
  descuentoVitalicio: false,
  token: 'token-123',
};

const mockAddToast = vi.fn();
const mockAddOrder = vi.fn();
const mockAddPurchasePoints = vi.fn(() => ({ pointsAdded: 120 }));

declare const global: typeof globalThis & { navigator: { clipboard: any } };

// Mockeamos todos los contextos dependientes para tener control total sobre el flujo de compra.
vi.mock('@/context/CartContext', () => ({
  useCart: () => mockCartState,
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
  }),
}));

vi.mock('@/context/ToastContext', () => ({
  useToast: () => ({
    addToast: mockAddToast,
    removeToast: vi.fn(),
  }),
}));

vi.mock('@/utils/orders', () => ({
  addOrder: (...args: unknown[]) => mockAddOrder(...args),
  loadOrders: () => [],
  subscribeToOrders: () => () => undefined,
}));

vi.mock('@/utils/levelup', async () => {
  const actual = await vi.importActual<any>('@/utils/levelup');
  return {
    ...actual,
    addPurchasePoints: (...args: unknown[]) => mockAddPurchasePoints(...args),
  };
});

const renderCheckout = () =>
  // Helper que envuelve al componente en un MemoryRouter tal como lo requiere la vista.
  render(
    <MemoryRouter>
      <Checkout />
    </MemoryRouter>
  );

describe('Checkout component', () => {
  beforeEach(() => {
    mockCartState.items = [];
    mockCartState.total = 0;
    mockCartState.subtotal = 0;
    mockCartState.totalCantidad = 0;
    mockCartState.clearCart.mockClear();
    mockCartState.getItemPricing.mockClear();
    mockAddOrder.mockClear();
    mockAddToast.mockClear();
    mockAddPurchasePoints.mockClear();
  });

  it('muestra error cuando el carrito está vacío', () => {
    // Renderiza el flujo con un carrito vacío.
    renderCheckout();

    // Intenta confirmar la compra sin ítems.
    fireEvent.submit(screen.getByRole('button', { name: /confirmar pedido/i }));

    // Debe mostrarse una alerta y no registrarse ninguna orden.
    expect(
      screen.getByText('Tu carrito está vacío, agrega productos antes de pagar.')
    ).toBeInTheDocument();
    expect(mockAddOrder).not.toHaveBeenCalled();
  });

  it('registra la orden y limpia el carrito cuando el formulario es válido', async () => {
    mockCartState.items = [
      {
        id: 'prod-1',
        nombre: 'Teclado Gamer',
        precio: 10000,
        cantidad: 1,
        imagen: 'teclado.png',
        stock: 5,
      },
    ];
    mockCartState.total = 8000;
    mockCartState.subtotal = 10000;
    mockCartState.totalCantidad = 1;

    // Renderiza nuevamente, esta vez con productos en el carro.
    renderCheckout();

    // Completa los datos del formulario con valores válidos.
    fireEvent.change(screen.getByLabelText('Nombre completo'), {
      target: { value: 'Fran Tester' },
    });
    fireEvent.change(screen.getByLabelText('Correo'), {
      target: { value: 'fran@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Dirección'), {
      target: { value: 'Av. Providencia 123' },
    });
    fireEvent.change(screen.getByLabelText('Región'), {
      target: { value: 'Metropolitana de Santiago' },
    });
    fireEvent.change(screen.getByLabelText('Comuna'), {
      target: { value: 'Santiago' },
    });

    fireEvent.change(screen.getByLabelText('Número de tarjeta'), {
      target: { value: '1234 1234 1234 1234' },
    });
    fireEvent.change(screen.getByLabelText('Expiración'), {
      target: { value: '12/30' },
    });
    fireEvent.change(screen.getByLabelText('CVV'), {
      target: { value: '123' },
    });

    // Envía la orden para disparar la lógica de checkout.
    fireEvent.submit(screen.getByRole('button', { name: /confirmar pedido/i }));

    // Confirma que se registre la orden, se vacíe el carrito, se otorguen puntos y se muestre feedback.
    await waitFor(() => expect(mockAddOrder).toHaveBeenCalled());
    expect(mockCartState.clearCart).toHaveBeenCalled();
    expect(mockAddPurchasePoints).toHaveBeenCalledWith({
      run: mockUser.run,
      totalCLP: 8000,
    });
    expect(mockAddToast).toHaveBeenCalled();
  });
});
