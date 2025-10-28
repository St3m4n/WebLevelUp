import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { NavLink, useLocation, useSearchParams } from 'react-router-dom';
import styles from './SecondaryNav.module.css';

type SecondaryNavProps = {
  currentCategoria?: string;
};
const SecondaryNav: React.FC<SecondaryNavProps> = ({ currentCategoria }) => {
  // Usar una estructura estática en el orden solicitado por el producto propietario.
  // Esto reemplaza la generación dinámica por categoría de productos.
  const categoryGroups = useMemo(
    () => [
      {
        title: 'Hardware y Consolas',
        items: ['Consolas', 'Computadores Gamers'],
      },
      {
        title: 'Periféricos y Accesorios',
        items: ['Mouse', 'Mousepad', 'Sillas Gamers', 'Accesorios'],
      },
      {
        title: 'Juegos',
        items: ['Juegos de Mesa'],
      },
      {
        title: 'Ropa',
        items: ['Poleras Personalizadas', 'Polerones Gamers Personalizados'],
      },
    ],
    []
  );
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const closeTimerRef = useRef<number | null>(null);
  // Bootstrap collapse handles mobile open/close, we don't need local open state here
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
  const isAllActive = !activeCategoria;

  const closeMobileMenus = useCallback(() => {
    const mainCollapse = document.getElementById('secNavCollapse');
    if (mainCollapse) {
      mainCollapse.classList.remove('show', 'collapsing');
      mainCollapse.style.height = '';
    }

    const mainToggler = document.querySelector<HTMLButtonElement>(
      '.mobile-cat-toggler'
    );
    if (mainToggler) {
      mainToggler.setAttribute('aria-expanded', 'false');
    }

    const nestedCollapse = document.getElementById('mobileCategories-0');
    if (nestedCollapse) {
      nestedCollapse.classList.remove('show', 'collapsing');
      nestedCollapse.style.height = '';
    }

    document
      .querySelectorAll<HTMLButtonElement>(
        '[data-bs-target="#mobileCategories-0"]'
      )
      .forEach((button) => {
        button.setAttribute('aria-expanded', 'false');
      });
  }, []);

  const handleLinkClick = () => {
    closeMobileMenus();
  };

  const handleMouseEnter = (i: number) => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setOpenIndex(i);
  };

  const handleMouseLeave = () => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
    }
    // Delay close so the user can move between button and menu without flicker
    closeTimerRef.current = window.setTimeout(() => {
      setOpenIndex(null);
      closeTimerRef.current = null;
    }, 1600) as unknown as number;
  };

  const buildLinkClassName = (
    isActive: boolean,
    categoria: string,
    baseClass = styles.link
  ) => {
    const categoriaLower = categoria.toLowerCase();
    const shouldHighlight =
      isActive ||
      (categoriaLower === 'todos'
        ? isAllActive
        : categoriaLower === activeCategoria);

    return [baseClass, shouldHighlight ? styles.linkActive : '']
      .filter(Boolean)
      .join(' ');
  };

  const buildCategoryHref = (categoria: string) =>
    categoria.toLowerCase() === 'todos'
      ? `/tienda${resetCategoriaSearch}`
      : `/tienda?categoria=${encodeURIComponent(categoria)}`;

  // No extra effects required: Bootstrap collapse handles outside clicks and toggling
  useEffect(() => {
    closeMobileMenus();
  }, [closeMobileMenus, location.pathname, location.search]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };
  }, []);

  return (
    <nav
      className={[
        styles.secondaryNav,
        'secondary-nav',
        'navbar',
        'navbar-expand-lg',
        'navbar-dark',
      ].join(' ')}
    >
      <div className="container">
        <div className="collapse navbar-collapse" id="secNavCollapse">
          {/* Mobile links: shown only on small screens via Bootstrap classes */}
          <ul className="navbar-nav w-100 d-lg-none mb-2">
            <li className="nav-item">
              <button
                className="nav-link w-100 text-start d-flex align-items-center justify-content-between"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#mobileCategories-0"
                aria-expanded="false"
                aria-controls="mobileCategories-0"
              >
                Categorías
                <i className="bi bi-chevron-down ms-2" aria-hidden="true" />
              </button>
              <div
                className="collapse mobile-cats-collapse mt-2"
                id="mobileCategories-0"
              >
                <ul className="navbar-nav ps-3">
                  {/* Mostrar los grupos y sus items en móvil: cada grupo como encabezado + lista */}
                  {categoryGroups.map((group) => (
                    <li key={group.title} className="nav-item">
                      <div className="nav-link text-start fw-bold">
                        {group.title}
                      </div>
                      <ul className="navbar-nav ps-3">
                        {group.items.map((cat) => (
                          <li key={cat} className="nav-item">
                            <NavLink
                              to={buildCategoryHref(cat)}
                              className={({ isActive }) =>
                                [styles.link, isActive ? styles.linkActive : '']
                                  .filter(Boolean)
                                  .join(' ')
                              }
                              onClick={handleLinkClick}
                            >
                              {cat}
                            </NavLink>
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              </div>
            </li>
            <li className="nav-item">
              <NavLink to="/nosotros" className="nav-link">
                Nosotros
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/comunidad" className="nav-link">
                Comunidad
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/contacto" className="nav-link">
                Contacto
              </NavLink>
            </li>
          </ul>

          {/* Desktop: horizontal categories */}
          {/* Desktop: horizontal categories rendered inside an innerGrid so the
              category row spans the same centered max-width as the main header
              (brand -> center -> actions). We control dropdown open state so
              it stays visible al pasar el mouse con un pequeño retraso para
              evitar cierres accidentales. */}
          <div className={styles.innerGrid + ' d-none d-lg-grid'}>
            <div className={styles.leftPlaceholder} />
            <div className={styles.categoryGroupsRow}>
              {categoryGroups.map((group, i) => (
                <div
                  key={group.title}
                  className={`nav-item dropdown ${styles.dropdown} ${
                    openIndex === i ? 'open' : ''
                  }`}
                  onMouseEnter={() => handleMouseEnter(i)}
                  onMouseLeave={handleMouseLeave}
                >
                  <button
                    type="button"
                    className={[styles.link, 'dropdown-toggle'].join(' ')}
                    aria-expanded={openIndex === i}
                  >
                    {group.title}
                  </button>
                  <ul
                    className={[styles.dropdownMenu, 'dropdown-menu'].join(' ')}
                  >
                    {group.items.map((cat) => (
                      <li key={cat}>
                        <NavLink
                          to={buildCategoryHref(cat)}
                          className={({ isActive }) =>
                            buildLinkClassName(
                              isActive,
                              cat,
                              styles.dropdownItem
                            )
                          }
                          onClick={handleLinkClick}
                        >
                          {cat}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className={styles.rightPlaceholder} />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default SecondaryNav;
