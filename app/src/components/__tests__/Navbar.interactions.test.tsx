import { fireEvent, render, screen } from '@testing-library/react';
import * as RouterDom from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Navbar from '../Navbar';

const mockNavigate = vi.fn();

// Mockeamos useNavigate para poder inspeccionar hacia dónde se dirige el usuario.
vi.mock('react-router-dom', async () => {
  const actual = (await vi.importActual(
    'react-router-dom'
  )) as typeof RouterDom;
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      run: '12345678-9',
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
    },
    logout: vi.fn(),
  }),
}));

vi.mock('@/context/CartContext', () => ({
  useCart: () => ({
    items: [],
    totalCantidad: 1,
    subtotal: 0,
    total: 0,
    totalSavings: 0,
    hasDuocDiscount: false,
    discountRate: 0,
    getItemPricing: vi.fn(),
    addItem: vi.fn(),
    removeItem: vi.fn(),
    updateCantidad: vi.fn(),
    clearCart: vi.fn(),
  }),
}));

vi.mock('@/hooks/useLevelUpStats', () => ({
  useLevelUpStats: () => ({
    stats: null,
    totalExp: 1200,
    level: 3,
    progressPct: 50,
    nextLevelExp: 1600,
    currentExpIntoLevel: 200,
  }),
}));

vi.mock('@/assets/logo2.png', () => ({
  default: 'logo.png',
}));

describe('Navbar interactions', () => {
  afterEach(() => {
    mockNavigate.mockClear();
  });

  it('envía búsquedas con el término normalizado', () => {
    // Renderiza la barra de navegación bajo un router de memoria para poder usar los hooks de navegación.
    render(
      <RouterDom.MemoryRouter>
        <Navbar />
      </RouterDom.MemoryRouter>
    );

    // Simula que la persona usuaria escribe con espacios adicionales y envía el formulario.
    fireEvent.change(screen.getByPlaceholderText('Buscar productos...'), {
      target: { value: ' mouse ' },
    });
    fireEvent.submit(screen.getByRole('search'));

    // Confirma que la navegación se realice con el término limpio en la query.
    expect(mockNavigate).toHaveBeenCalledWith('/tienda?q=mouse');
  });

  it('controla el estado del menú móvil', () => {
    // Renderiza la barra para validar el flujo del menú responsive.
    render(
      <RouterDom.MemoryRouter>
        <Navbar />
      </RouterDom.MemoryRouter>
    );

    const toggle = document.querySelector(
      'button[aria-controls="mobile-menu"]'
    ) as HTMLButtonElement;
    expect(toggle).toBeTruthy();
    // Abre el menú desde el ícono hamburguesa.
    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(toggle).toHaveAttribute('aria-label', 'Cerrar menú');
    expect(document.getElementById('mobile-menu')).not.toBeNull();

    // Al hacer click en un enlace del menú se debe cerrar automáticamente.
    fireEvent.click(screen.getByRole('link', { name: 'Inicio' }));

    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveAttribute('aria-label', 'Abrir menú');
  });
});
