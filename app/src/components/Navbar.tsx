import { useEffect, useMemo, useState, useRef } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useLevelUpStats } from '@/hooks/useLevelUpStats';
import logo from '@/assets/logo2.png';
import styles from './Navbar.module.css';

const baseNavLinks = [
  { to: '/', label: 'Inicio' },
  { to: '/tienda', label: 'Tienda' },
  { to: '/nosotros', label: 'Nosotros' },
  { to: '/comunidad', label: 'Comunidad' },
  { to: '/contacto', label: 'Contacto' },
];

const categoryGroups = [
  {
    title: 'Hardware y Consolas',
    links: [
      { to: '/tienda?categoria=Consolas', label: 'Consolas' },
      {
        to: '/tienda?categoria=Computadores Gamers',
        label: 'Computadores Gamers',
      },
    ],
  },
  {
    title: 'Periféricos y Accesorios',
    links: [
      { to: '/tienda?categoria=Mouse', label: 'Mouse' },
      { to: '/tienda?categoria=Mousepad', label: 'Mousepad' },
      { to: '/tienda?categoria=Sillas Gamers', label: 'Sillas Gamers' },
      { to: '/tienda?categoria=Accesorios', label: 'Accesorios' },
    ],
  },
  {
    title: 'Juegos',
    links: [
      { to: '/tienda?categoria=Juegos de Mesa', label: 'Juegos de Mesa' },
    ],
  },
  {
    title: 'Ropa',
    links: [
      {
        to: '/tienda?categoria=Poleras Personalizadas',
        label: 'Poleras Personalizadas',
      },
      {
        to: '/tienda?categoria=Polerones Gamers Personalizados',
        label: 'Polerones Gamers Personalizados',
      },
    ],
  },
];

const Navbar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isMobileCategoriesOpen, setIsMobileCategoriesOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { user, logout } = useAuth();
  const { totalCantidad } = useCart();
  const { level: userLevel, totalExp } = useLevelUpStats();
  const [isPulsing, setIsPulsing] = useState(false);
  const prevExpRef = useRef<number>(0);

  useEffect(() => {
    const prev = prevExpRef.current ?? 0;
    if (typeof totalExp === 'number') {
      if (totalExp > prev) {
        setIsPulsing(true);
        const timeout = window.setTimeout(() => setIsPulsing(false), 900);
        prevExpRef.current = totalExp;
        return () => window.clearTimeout(timeout);
      }
      prevExpRef.current = totalExp;
    }
    return undefined;
  }, [totalExp]);

  const navigate = useNavigate();
  const location = useLocation();
  const navLinks = useMemo(() => baseNavLinks, []);
  const isAdminUser = Boolean(
    user && (user.perfil === 'Administrador' || user.perfil === 'Vendedor')
  );

  const profileMenuId = 'profile-menu';

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setSearchTerm(params.get('q') ?? '');
  }, [location.search]);

  const handleToggleMenu = () => {
    setIsMobileMenuOpen((prev) => {
      const next = !prev;
      if (!next) {
        setIsMobileCategoriesOpen(false);
      }
      return next;
    });
    setIsCategoryDropdownOpen(false);
  };
  const handleLinkClick = () => {
    setIsMobileMenuOpen(false);
    setIsCategoryDropdownOpen(false);
    setIsProfileMenuOpen(false);
    setIsMobileCategoriesOpen(false);
  };
  const handleToggleProfileMenu = () => setIsProfileMenuOpen((p) => !p);
  const handleLogout = () => {
    logout();
    handleLinkClick();
  };

  const handleSearchSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    const q = searchTerm.trim();
    if (!q) return;
    const params = new URLSearchParams();
    params.set('q', q);
    navigate(`/tienda?${params.toString()}`);
    handleLinkClick();
  };

  return (
    <header className={styles.navbarRoot}>
      <div className="container">
        <div className={styles.topRow}>
          <nav className={styles.topLinks} aria-label="Top nav">
            {navLinks.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  [styles.topLink, isActive ? styles.topLinkActive : '']
                    .filter(Boolean)
                    .join(' ')
                }
                onClick={handleLinkClick}
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className={styles.mainRow}>
          <button
            type="button"
            className={styles.mobileMenuButton}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-menu"
            aria-label={isMobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
            onClick={handleToggleMenu}
          >
            <svg viewBox="0 0 24 24" aria-hidden>
              <path
                d="M3 6h18M3 12h18M3 18h18"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                fill="none"
              />
            </svg>
            <span className="visually-hidden">Menú</span>
          </button>

          <div className={styles.brandWrapper}>
            <Link to="/" className={styles.brand} onClick={handleLinkClick}>
              <img src={logo} alt="Level-Up Gamer" />
            </Link>

            <div className={styles.categoryDropdownWrapper}>
              <div
                className={styles.categoryDropdown}
                onMouseEnter={() => setIsCategoryDropdownOpen(true)}
                onMouseLeave={() => setIsCategoryDropdownOpen(false)}
              >
                <button
                  type="button"
                  className={styles.categoryDropdownButton}
                  aria-haspopup="true"
                  aria-expanded={isCategoryDropdownOpen}
                >
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    style={{ marginRight: '8px' }}
                  >
                    <path
                      d="M3 6h18M3 12h18M3 18h18"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                    />
                  </svg>
                  Categorías
                </button>

                {isCategoryDropdownOpen && (
                  <div className={styles.categoryDropdownMenu}>
                    <div className={styles.categoryGroupsMenu}>
                      {categoryGroups.map(({ title, links }) => (
                        <div className={styles.categoryGroup} key={title}>
                          <div className={styles.categoryGroupTitle}>
                            {title}
                          </div>
                          <ul>
                            {links.map(({ to, label }) => (
                              <li key={to}>
                                <NavLink
                                  to={to}
                                  className={styles.categoryDropdownItem}
                                  onClick={handleLinkClick}
                                >
                                  {label}
                                </NavLink>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <form
            role="search"
            className={styles.searchForm}
            onSubmit={handleSearchSubmit}
          >
            <label htmlFor="navbar-search" className="visually-hidden">
              Buscar productos
            </label>
            <input
              id="navbar-search"
              className={styles.searchInput}
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button
              type="submit"
              className={styles.searchButton}
              aria-label="Buscar"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
                <path
                  d="M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14zm0 2a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm8.53 11.47a1 1 0 0 1 0 1.41l-2.12 2.12a1 1 0 0 1-1.41-1.41l2.12-2.12a1 1 0 0 1 1.41 0z"
                  fill="currentColor"
                />
              </svg>
            </button>
          </form>

          <div className={styles.ctaLinks}>
            {isAdminUser && (
              <NavLink
                to="/admin"
                className={styles.navLink}
                onClick={handleLinkClick}
              >
                Panel admin
              </NavLink>
            )}

            <NavLink
              to="/carrito"
              aria-label="Abrir carrito"
              className={styles.iconButton}
              onClick={handleLinkClick}
            >
              <svg viewBox="0 0 24 24" aria-hidden width="22" height="22">
                <path
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 3h2l1.6 8.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L20 6H6"
                />
                <circle cx="9.5" cy="19" r="1.5" fill="currentColor" />
                <circle cx="16.5" cy="19" r="1.5" fill="currentColor" />
              </svg>
              {totalCantidad > 0 && (
                <span className={styles.iconBadge}>{totalCantidad}</span>
              )}
            </NavLink>

            <div className={styles.profileWrapper}>
              <button
                type="button"
                aria-haspopup
                aria-expanded={isProfileMenuOpen}
                aria-controls={profileMenuId}
                className={[
                  styles.iconButton,
                  isProfileMenuOpen ? styles.iconButtonActive : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={handleToggleProfileMenu}
              >
                <svg viewBox="0 0 24 24" aria-hidden>
                  <path
                    fill="currentColor"
                    d="M12 3.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9zm0 11c4.14 0 7.5 2.53 7.5 5.65V22a1 1 0 0 1-1 1h-13a1 1 0 0 1-1-1v-1.85C4.5 17.03 7.86 14.5 12 14.5z"
                  />
                </svg>
                {user && (
                  <span
                    className={[
                      styles.profileLevelBadge,
                      isPulsing ? styles.pulse : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    title={`${totalExp} EXP acumulados`}
                  >
                    Lv. {userLevel}
                  </span>
                )}
              </button>

              {isProfileMenuOpen && (
                <div
                  id={profileMenuId}
                  role="menu"
                  className={styles.profileMenu}
                >
                  {user ? (
                    <>
                      <Link
                        to="/perfil"
                        role="menuitem"
                        className={styles.profileMenuItem}
                        onClick={handleLinkClick}
                      >
                        Mi perfil
                      </Link>
                      {isAdminUser && (
                        <Link
                          to="/admin"
                          role="menuitem"
                          className={styles.profileMenuItem}
                          onClick={handleLinkClick}
                        >
                          Panel admin
                        </Link>
                      )}
                      <button
                        type="button"
                        role="menuitem"
                        className={styles.profileMenuItemButton}
                        onClick={handleLogout}
                      >
                        Cerrar sesión
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/login"
                        role="menuitem"
                        className={styles.profileMenuItem}
                        onClick={handleLinkClick}
                      >
                        Iniciar sesión
                      </Link>
                      <Link
                        to="/registro"
                        role="menuitem"
                        className={styles.profileMenuItem}
                        onClick={handleLinkClick}
                      >
                        Crear cuenta
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div id="mobile-menu" className={styles.mobileMenu}>
            <form
              role="search"
              className={styles.mobileSearchForm}
              onSubmit={handleSearchSubmit}
            >
              <label htmlFor="mobile-navbar-search" className="visually-hidden">
                Buscar productos
              </label>
              <div className={styles.mobileSearchGroup}>
                <input
                  id="mobile-navbar-search"
                  type="search"
                  placeholder="Buscar productos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button type="submit" aria-label="Buscar">
                  <svg viewBox="0 0 24 24" aria-hidden>
                    <path
                      d="M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14zm0 2a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm8.53 11.47a1 1 0 0 1 0 1.41l-2.12 2.12a1 1 0 0 1-1.41-1.41l2.12-2.12a1 1 0 0 1 1.41 0z"
                      fill="currentColor"
                    />
                  </svg>
                </button>
              </div>
            </form>

            <button
              type="button"
              className={[
                styles.mobileNavLink,
                styles.mobileDropdownToggle,
              ].join(' ')}
              aria-expanded={isMobileCategoriesOpen}
              aria-controls="mobile-category-menu"
              onClick={() => setIsMobileCategoriesOpen((prev) => !prev)}
            >
              <span>Categorías</span>
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                aria-hidden
                className={[
                  styles.mobileDropdownIcon,
                  isMobileCategoriesOpen ? styles.mobileDropdownIconOpen : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <path
                  d="M6 9l6 6 6-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {isMobileCategoriesOpen && (
              <div
                id="mobile-category-menu"
                className={styles.mobileCategoryMenu}
              >
                <div className={styles.categoryGroupsMenu}>
                  {categoryGroups.map(({ title, links }) => (
                    <div className={styles.categoryGroup} key={title}>
                      <div className={styles.categoryGroupTitle}>{title}</div>
                      <ul>
                        {links.map(({ to, label }) => (
                          <li key={to}>
                            <NavLink
                              to={to}
                              className={styles.categoryDropdownItem}
                              onClick={handleLinkClick}
                            >
                              {label}
                            </NavLink>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {navLinks.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  [
                    styles.mobileNavLink,
                    isActive ? styles.mobileNavLinkActive : '',
                  ]
                    .filter(Boolean)
                    .join(' ')
                }
                onClick={handleLinkClick}
              >
                {label}
              </NavLink>
            ))}
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
