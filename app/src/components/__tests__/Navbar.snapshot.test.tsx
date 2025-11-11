// @ts-nocheck
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import Navbar from '../Navbar';

// Controlamos la sesión autenticada para que el snapshot tenga un usuario admin.
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      run: '12345678-9',
      nombre: 'Fran',
      apellidos: 'Tester',
      correo: 'fran@example.com',
      perfil: 'Administrador',
      fechaNacimiento: null,
      region: 'Metropolitana',
      comuna: 'Santiago',
      direccion: 'Av. Providencia 123',
      descuentoVitalicio: false,
      token: 'token-123',
    },
    logout: vi.fn(),
  }),
}));

// Ajustamos el contexto de carrito para que existan unidades visibles en la UI.
vi.mock('@/context/CartContext', () => ({
  useCart: () => ({
    items: [],
    totalCantidad: 2,
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

// Forzamos estadísticas específicas para validar el badge de nivel.
vi.mock('@/hooks/useLevelUpStats', () => ({
  useLevelUpStats: () => ({
    stats: null,
    totalExp: 4200,
    level: 5,
    progressPct: 60,
    nextLevelExp: 5000,
    currentExpIntoLevel: 200,
  }),
}));

vi.mock('@/assets/logo2.png', () => ({
  default: 'logo.png',
}));

describe('Navbar snapshot', () => {
  it('mantiene la estructura base de navegación', () => {
    // Renderiza la barra en la raíz de la aplicación para capturar su estructura completa.
    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <Navbar />
      </MemoryRouter>
    );

    // Recorremos los enlaces superiores para validar que sigan presentes y en el mismo orden.
    const topLinks = Array.from(
      container.querySelectorAll<HTMLAnchorElement>('nav[aria-label="Top nav"] a')
    ).map((link) => link.textContent?.trim() ?? '');

    expect(topLinks).toMatchInlineSnapshot(`
      [
        "Inicio",
        "Tienda",
        "Nosotros",
        "Comunidad",
        "Contacto",
      ]
    `);

    const summary = {
      badgeText: container
        .querySelector('span[title*="EXP"]')
        ?.textContent?.trim(),
      cartCount: container
        .querySelector('[aria-label="Abrir carrito"] span')
        ?.textContent?.trim(),
      hasAdminLink: container.querySelector('a[href="/admin"]')?.textContent?.trim(),
    };

    // Comprobamos que los datos clave (nivel, items del carrito, acceso admin) se mantengan.
    expect(summary).toMatchInlineSnapshot(`
      {
        "badgeText": "Lv. 5",
        "cartCount": "2",
        "hasAdminLink": "Panel admin",
      }
    `);
  });
});
