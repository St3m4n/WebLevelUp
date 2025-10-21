import { useEffect, useMemo, useState } from 'react';
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

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { user, logout } = useAuth();
  const { totalCantidad } = useCart();
  const { level: userLevel } = useLevelUpStats();
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
    setIsProfileMenuOpen(false);
    setIsMenuOpen((prev) => !prev);
  };
  const handleLinkClick = () => {
    setIsMenuOpen(false);
    setIsProfileMenuOpen(false);
  };
  const handleToggleProfileMenu = () => setIsProfileMenuOpen((prev) => !prev);
  const handleLogout = () => {
    logout();
    handleLinkClick();
  };

  const handleSearchSubmit: React.FormEventHandler<HTMLFormElement> = (
    event
  ) => {
    event.preventDefault();
    const trimmed = searchTerm.trim();
    if (!trimmed) {
      return;
    }
    const params = new URLSearchParams();
    params.set('q', trimmed);
    navigate(`/tienda?${params.toString()}`);
    handleLinkClick();
  };

  const handleSearchChange: React.ChangeEventHandler<HTMLInputElement> = (
    event
  ) => {
    setSearchTerm(event.target.value);
  };

  return (
    <header className={styles.navbarRoot}>
      <div className="container">
        <div className={styles.navContent}>
          <Link to="/" className={styles.brand} onClick={handleLinkClick}>
            <img src={logo} alt="Level-Up" />
            Level-Up Gamer
          </Link>

          <nav className={styles.desktopLinks} aria-label="Principal">
            {navLinks.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  [styles.navLink, isActive ? styles.navLinkActive : '']
                    .filter(Boolean)
                    .join(' ')
                }
                onClick={handleLinkClick}
              >
                {label}
              </NavLink>
            ))}
          </nav>

          <form
            role="search"
            aria-label="Buscar productos"
            className={styles.searchForm}
            onSubmit={handleSearchSubmit}
          >
            <label htmlFor="navbar-search" className="visually-hidden">
              Buscar productos
            </label>
            <input
              id="navbar-search"
              type="search"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={handleSearchChange}
              className={styles.searchInput}
            />
            <button
              type="submit"
              className={styles.searchButton}
              aria-label="Buscar"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
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
              className={({ isActive }) =>
                [styles.iconButton, isActive ? styles.iconButtonActive : '']
                  .filter(Boolean)
                  .join(' ')
              }
              onClick={handleLinkClick}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
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
              <span className="visually-hidden">Carrito</span>
            </NavLink>

            <div className={styles.profileWrapper}>
              <button
                type="button"
                aria-haspopup="true"
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
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M12 3.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9zm0 11c4.14 0 7.5 2.53 7.5 5.65V22a1 1 0 0 1-1 1h-13a1 1 0 0 1-1-1v-1.85C4.5 17.03 7.86 14.5 12 14.5z"
                  />
                </svg>
                {user && (
                  <span className={styles.profileLevelBadge} aria-hidden="true">
                    Lv. {userLevel}
                  </span>
                )}
                <span className="visually-hidden">
                  {user ? 'Abrir menú de cuenta' : 'Abrir menú de acceso'}
                </span>
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

          <button
            type="button"
            className={styles.mobileMenuButton}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
            onClick={handleToggleMenu}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M3 6h18M3 12h18M3 18h18"
                strokeWidth={1.8}
                strokeLinecap="round"
              />
            </svg>
            <span className="visually-hidden">Menú</span>
          </button>
        </div>

        {isMenuOpen && (
          <div id="mobile-menu" className={styles.mobileMenu}>
            <form
              role="search"
              aria-label="Buscar productos"
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
                  onChange={handleSearchChange}
                />
                <button type="submit" aria-label="Buscar">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14zm0 2a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm8.53 11.47a1 1 0 0 1 0 1.41l-2.12 2.12a1 1 0 0 1-1.41-1.41l2.12-2.12a1 1 0 0 1 1.41 0z"
                      fill="currentColor"
                    />
                  </svg>
                </button>
              </div>
            </form>
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
            <NavLink
              to="/carrito"
              className={styles.mobileNavLink}
              onClick={handleLinkClick}
            >
              Carrito{' '}
              {totalCantidad > 0 && (
                <span className={styles.cartCount}>{totalCantidad}</span>
              )}
            </NavLink>
            {user ? (
              <>
                <NavLink
                  to="/perfil"
                  className={styles.mobileNavLink}
                  onClick={handleLinkClick}
                >
                  Mi perfil
                </NavLink>
                {isAdminUser && (
                  <NavLink
                    to="/admin"
                    className={styles.mobileNavLink}
                    onClick={handleLinkClick}
                  >
                    Panel admin
                  </NavLink>
                )}
                <button
                  type="button"
                  className={styles.mobileNavLink}
                  onClick={handleLogout}
                >
                  Cerrar sesión
                </button>
              </>
            ) : (
              <>
                <NavLink
                  to="/login"
                  className={styles.mobileNavLink}
                  onClick={handleLinkClick}
                >
                  Iniciar sesión
                </NavLink>
                <NavLink
                  to="/registro"
                  className={styles.mobileNavLink}
                  onClick={handleLinkClick}
                >
                  Crear cuenta
                </NavLink>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
