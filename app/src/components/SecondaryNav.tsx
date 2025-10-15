import { useEffect, useMemo, useRef, useState, useId } from 'react';
import { NavLink, useSearchParams } from 'react-router-dom';
import { useProducts } from '@/hooks/useProducts';
import styles from './SecondaryNav.module.css';

type SecondaryNavProps = {
  currentCategoria?: string;
};

const MAX_VISIBLE_CATEGORIES = 6;

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
  const [isOverflowMenuOpen, setIsOverflowMenuOpen] = useState(false);

  const overflowMenuRef = useRef<HTMLDivElement | null>(null);
  const overflowButtonId = `secondary-nav-more-${useId()}`;
  const searchParamsString = searchParams.toString();
  const resetCategoriaSearch = useMemo(() => {
    const next = new URLSearchParams(searchParamsString);
    next.delete('categoria');
    const result = next.toString();
    return result ? `?${result}` : '';
  }, [searchParamsString]);

  const activeCategoria = (
    currentCategoria ??
    searchParams.get('categoria') ??
    ''
  ).toLowerCase();

  const handleToggleMenu = () => setIsMenuOpen((prev) => !prev);
  const handleLinkClick = () => {
    setIsMenuOpen(false);
    setIsOverflowMenuOpen(false);
  };

  const handleOverflowToggle = () => setIsOverflowMenuOpen((prev) => !prev);

  const buildLinkClassName = (
    isActive: boolean,
    categoria: string,
    baseClass = styles.link
  ) =>
    [
      baseClass,
      isActive || categoria.toLowerCase() === activeCategoria
        ? styles.linkActive
        : '',
    ]
      .filter(Boolean)
      .join(' ');

  const visibleCategories = categorias.slice(0, MAX_VISIBLE_CATEGORIES);
  const overflowCategories = categorias.slice(MAX_VISIBLE_CATEGORIES);
  const hasOverflow = overflowCategories.length > 0;

  useEffect(() => {
    setIsOverflowMenuOpen(false);
  }, [categorias.length]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOverflowMenuOpen &&
        overflowMenuRef.current &&
        !overflowMenuRef.current.contains(event.target as Node)
      ) {
        const button = document.getElementById(overflowButtonId);
        if (!button || !button.contains(event.target as Node)) {
          setIsOverflowMenuOpen(false);
        }
      }
    };

    if (isOverflowMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOverflowMenuOpen, overflowButtonId]);

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
            <NavLink
              to={`/tienda${resetCategoriaSearch}`}
              className={({ isActive }) => buildLinkClassName(isActive, '')}
              onClick={handleLinkClick}
            >
              Todos
            </NavLink>
            {visibleCategories.map((categoria) => (
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
            {hasOverflow && (
              <div className={styles.moreWrapper} ref={overflowMenuRef}>
                <button
                  type="button"
                  id={overflowButtonId}
                  className={styles.moreButton}
                  aria-haspopup="true"
                  aria-expanded={isOverflowMenuOpen}
                  onClick={handleOverflowToggle}
                >
                  Ver más
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      d="M6 9l6 6 6-6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
                {isOverflowMenuOpen && (
                  <div role="menu" className={styles.overflowMenu}>
                    {overflowCategories.map((categoria) => (
                      <NavLink
                        key={categoria}
                        role="menuitem"
                        to={`/tienda?categoria=${encodeURIComponent(categoria)}`}
                        className={({ isActive }) =>
                          buildLinkClassName(
                            isActive,
                            categoria,
                            styles.overflowItem
                          )
                        }
                        onClick={handleLinkClick}
                      >
                        {categoria}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            )}
            {!visibleCategories.length && !hasOverflow && (
              <span className={styles.emptyMessage}>
                Sin categorías activas
              </span>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default SecondaryNav;
