import React, { useMemo } from 'react';
import './SecondaryNav.css';
import { productos } from '../data/productos';

// Derivar categorías únicas (orden alfabético, sin vacíos)
const useCategorias = () => useMemo(() => (
  Array.from(new Set(productos.map(p => (p.categoria || '').trim()).filter(Boolean)))
    .sort((a,b) => a.localeCompare(b))
), []);

interface SecondaryNavProps {
  currentCategoria?: string; // Para resaltar activa si llega por props/ruta futura
}

const SecondaryNav: React.FC<SecondaryNavProps> = ({ currentCategoria }) => {
  const categorias = useCategorias();
  const current = (currentCategoria || '').toLowerCase();
  const collapseId = 'secNavCollapse';

  return (
    <nav className="navbar navbar-expand-lg navbar-dark secondary-nav">
      <div className="container">
        {/* Contenedor colapsable controlado por el toggler definido en la barra principal (en mobile) */}
        <div className="collapse navbar-collapse" id={collapseId}>
          {/* Versión móvil: menú principal + acordeón de categorías */}
          <ul className="navbar-nav w-100 d-lg-none mb-2">
            <li className="nav-item"><a className="nav-link" href="#">Inicio</a></li>
            <li className="nav-item">
              <button className="nav-link w-100 text-start d-flex align-items-center justify-content-between" type="button" data-bs-toggle="collapse" data-bs-target="#mobileCategories" aria-expanded="false" aria-controls="mobileCategories">
                Categorías <i className="bi bi-chevron-down ms-2" />
              </button>
              <div className="collapse mobile-cats-collapse mt-2" id="mobileCategories">
                <ul className="navbar-nav ps-3">
                  {categorias.map(cat => (
                    <li className="nav-item" key={cat}>
                      <a className={"nav-link" + (cat.toLowerCase() === current ? ' active' : '')} href={`#/categoria/${encodeURIComponent(cat)}`}>{cat}</a>
                    </li>
                  ))}
                </ul>
              </div>
            </li>
            <li className="nav-item"><a className="nav-link" href="#/nosotros">Nosotros</a></li>
            <li className="nav-item"><a className="nav-link" href="#/comunidad">Comunidad</a></li>
            <li className="nav-item"><a className="nav-link" href="#/contacto">Contacto</a></li>
          </ul>
          {/* Desktop: tira horizontal de categorías */}
          <ul className="navbar-nav justify-content-center w-100 secondary-nav-list d-none d-lg-flex">
            {categorias.map(cat => (
              <li className="nav-item" key={cat}>
                <a className={"nav-link" + (cat.toLowerCase() === current ? ' active' : '')} href={`#/categoria/${encodeURIComponent(cat)}`}>{cat}</a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default SecondaryNav;
