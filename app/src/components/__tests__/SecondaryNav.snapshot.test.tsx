// @ts-nocheck
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import SecondaryNav from '../SecondaryNav';

describe('SecondaryNav snapshot', () => {
  it('mantiene el orden y enlaces de categorías', () => {
    // Renderiza la navegación secundaria en la ruta de tienda para evaluar su estructura.
    const { container } = render(
      <MemoryRouter initialEntries={['/tienda?categoria=Mouse']}>
        <SecondaryNav />
      </MemoryRouter>
    );

    // Extrae los títulos de cada grupo desplegable para comprobar el orden predefinido.
    const dropdownGroups = (Array.from(
      container.querySelectorAll('.dropdown-toggle')
    ) as HTMLButtonElement[]).map((button) => button.textContent?.trim() ?? '');

    expect(dropdownGroups).toMatchInlineSnapshot(`
      [
        "Hardware y Consolas",
        "Periféricos y Accesorios",
        "Juegos",
        "Ropa",
      ]
    `);

    // Obtiene una muestra de enlaces de categoría para validar rutas y etiquetas.
    const categoryLinks = (Array.from(
      container.querySelectorAll('a[href^="/tienda"]')
    ) as HTMLAnchorElement[]).map((link) => ({
      href: link.getAttribute('href') ?? '',
      label: link.textContent?.trim() ?? '',
    }));

    expect(categoryLinks.slice(0, 6)).toMatchInlineSnapshot(`
      [
        {
          "href": "/tienda?categoria=Consolas",
          "label": "Consolas",
        },
        {
          "href": "/tienda?categoria=Computadores%20Gamers",
          "label": "Computadores Gamers",
        },
        {
          "href": "/tienda?categoria=Mouse",
          "label": "Mouse",
        },
        {
          "href": "/tienda?categoria=Mousepad",
          "label": "Mousepad",
        },
        {
          "href": "/tienda?categoria=Sillas%20Gamers",
          "label": "Sillas Gamers",
        },
        {
          "href": "/tienda?categoria=Accesorios",
          "label": "Accesorios",
        },
      ]
    `);
  });
});
