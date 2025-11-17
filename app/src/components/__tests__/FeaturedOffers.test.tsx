import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import FeaturedOffers from '../FeaturedOffers';

// Simulamos las respuestas del hook de productos para controlar los datos mostrados en la tarjeta.
vi.mock('@/hooks/useProducts', () => ({
  useProducts: () => [
    {
      codigo: '1gamer',
      nombre: 'GPU RTX 5090',
      categoria: 'Tarjetas de Video',
      fabricante: 'Nvidia',
      distribuidor: 'LevelUp',
      precio: 199990,
      stock: 5,
      stockCritico: 1,
      url: 'gpu.png',
      descripcion: 'Best GPU',
      deletedAt: null,
    },
  ],
}));

const priceBreakdownMock = vi.fn((price: number) => ({
  basePrice: price,
  finalPrice: Math.round(price * 0.8),
  hasDiscount: true,
  discountRate: 0.2,
  savings: Math.round(price * 0.2),
}));

// Mockeamos el hook de precios para devolver un cálculo determinista del descuento.
vi.mock('@/hooks/usePricing', () => ({
  usePricing: () => ({
    getPriceBreakdown: priceBreakdownMock,
    discountRate: 0.2,
  }),
}));

describe('FeaturedOffers', () => {
  it('muestra badge de descuento y precios calculados', () => {
    // Renderiza el componente con los mocks anteriores dentro de un router de memoria.
    render(
      <MemoryRouter>
        <FeaturedOffers />
      </MemoryRouter>
    );

    // Verifica que el cálculo de precios se haya ejecutado con los datos mockeados.
    expect(priceBreakdownMock).toHaveBeenCalled();

    const mainCard = screen.getByRole('heading', { name: /gpu rtx 5090/i });
    expect(mainCard).toBeInTheDocument();

    // Confirma que se muestre el badge de descuento y los CTA esperados en todas las tarjetas.
    expect(screen.getAllByText(/−20% DUOC/)).toHaveLength(4);
    expect(screen.getAllByText(/Ver categoría/)).toHaveLength(4);
  });
});
