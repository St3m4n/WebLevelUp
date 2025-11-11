// @ts-nocheck
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import Home from '../Home';

// Reemplazamos componentes pesados por placeholders para concentrarnos en la estructura del hero.
vi.mock('@/components/FeaturedOffers', () => ({
  default: () => <section data-testid="featured-offers-placeholder">Ofertas</section>,
}));

vi.mock('@/components/RecommendationsGrid', () => ({
  default: () => <section data-testid="recommendations-placeholder">Recs</section>,
}));

vi.mock('@/assets/background.png', () => ({
  default: 'background.png',
}));

describe('Home snapshot', () => {
  it('mantiene el hero principal y CTAs', () => {
    // Renderiza la página dentro de un router para capturar enlaces con rutas reales.
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    // Extrae el título principal del hero.
    const heroTitle = screen.getByRole('heading', { level: 1 }).textContent?.trim();
    const linkNodes = screen.getAllByRole('link') as HTMLAnchorElement[];
    // Toma los primeros dos enlaces (CTA) para verificar texto y destino.
    const ctas = linkNodes.slice(0, 2).map((link) => ({
      label: link.textContent?.trim() ?? '',
      href: link.getAttribute('href') ?? '',
    }));

    // Obtiene las métricas resumidas que se muestran en el hero.
    const metricNodes = screen.getAllByText(
      /Productos en stock|Despacho express RM|Marcas oficiales/
    ) as HTMLElement[];
    const metrics = metricNodes.map((node) => node.textContent?.trim() ?? '');

    // Snapshots para asegurarnos de que los textos clave sigan presentes.
    expect(heroTitle).toMatchInlineSnapshot('"Todo lo que necesitas para dominar tu setup"');
    expect(ctas).toMatchInlineSnapshot(`
      [
        {
          "href": "/tienda",
          "label": "Ver tienda",
        },
        {
          "href": "/comunidad",
          "label": "Únete a la comunidad",
        },
      ]
    `);
    expect(metrics).toMatchInlineSnapshot(`
      [
        "Productos en stock",
        "Despacho express RM",
        "Marcas oficiales",
      ]
    `);
  });
});
