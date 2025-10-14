import { useMemo, useState } from 'react';
import { NavLink, useSearchParams } from 'react-router-dom';
import { useProducts } from '@/hooks/useProducts';
import styles from './SecondaryNav.module.css';

type SecondaryNavProps = {
  currentCategoria?: string;
};

const SecondaryNav: React.FC<SecondaryNavProps> = ({ currentCategoria }) => {
  const productos = useProducts();
  const categorias = useMemo(
    () =>
      Array.from(
        new Set(
          productos
            .filter((producto) => !producto.deletedAt)
            .map((producto) => producto.categoria?.trim())
            .filter(Boolean)
        )
      ).sort((a, b) => (a ?? '').localeCompare(b ?? '')) as string[],
    [productos]
  );
  const [searchParams] = useSearchParams();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const activeCategoria = (
    currentCategoria ??
    searchParams.get('categoria') ??
    ''
  ).toLowerCase();

  const handleToggleMenu = () => setIsMenuOpen((prev) => !prev);
  const handleLinkClick = () => setIsMenuOpen(false);

  const buildLinkClassName = (isActive: boolean, categoria: string) =>
    [
      styles.link,
      isActive || categoria.toLowerCase() === activeCategoria
        ? styles.linkActive
        : '',
    ]
      .filter(Boolean)
      .join(' ');

  return (
    <nav className={styles.secondaryNav}>
      <div className="container">
        <div className={styles.inner}>
          <span className={styles.title}>Explora por categoría</span>

          <button
            type="button"
            className={styles.toggleButton}
            aria-expanded={isMenuOpen}
            aria-controls="secondary-nav-links"
            onClick={handleToggleMenu}
          >
            Categorías
            <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M6 9l6 6 6-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>

          <div
            id="secondary-nav-links"
            className={[styles.links, isMenuOpen ? styles.linksOpen : '']
              .filter(Boolean)
              .join(' ')}
          >
            {categorias.map((categoria) => (
              <NavLink
                key={categoria}
                to={`/tienda?categoria=${encodeURIComponent(categoria)}`}
                className={({ isActive }) =>
                  buildLinkClassName(isActive, categoria)
                }
                onClick={handleLinkClick}
              >
                {categoria}
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default SecondaryNav;
