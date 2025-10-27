import { useCallback, useEffect, useMemo } from 'react';
import { NavLink, useLocation, useSearchParams } from 'react-router-dom';
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
  const location = useLocation();
  // Bootstrap collapse handles mobile open/close, we don't need local open state here
  const searchParamsString = searchParams.toString();
  const resetCategoriaSearch = useMemo(() => {
    const next = new URLSearchParams(searchParamsString);
    next.delete('categoria');
    const result = next.toString();
    return result ? `?${result}` : '';
  }, [searchParamsString]);

  const allCategories = useMemo(() => ['Todos', ...categorias], [categorias]);

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

  const buildLinkClassName = (
    isActive: boolean,
    categoria: string,
    baseClass = styles.link
  ) =>
    [
      baseClass,
      isActive ||
      (categoria.toLowerCase() === 'todos'
        ? isAllActive
        : categoria.toLowerCase() === activeCategoria)
        ? styles.linkActive
        : '',
    ]
      .filter(Boolean)
      .join(' ');

  const buildCategoryHref = (categoria: string) =>
    categoria.toLowerCase() === 'todos'
      ? `/tienda${resetCategoriaSearch}`
      : `/tienda?categoria=${encodeURIComponent(categoria)}`;

  // No extra effects required: Bootstrap collapse handles outside clicks and toggling
  useEffect(() => {
    closeMobileMenus();
  }, [closeMobileMenus, location.pathname, location.search]);

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
                  {allCategories.map((cat) => (
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
          <ul className="navbar-nav justify-content-center w-100 secondary-nav-list d-none d-lg-flex">
            {allCategories.map((cat) => (
              <li key={cat} className="nav-item">
                <NavLink
                  to={buildCategoryHref(cat)}
                  className={({ isActive }) =>
                    buildLinkClassName(isActive, cat)
                  }
                  onClick={handleLinkClick}
                >
                  {cat}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default SecondaryNav;
