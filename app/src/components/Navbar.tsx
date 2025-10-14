import { useMemo, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import logo from '@/assets/logo2.png';
import styles from './Navbar.module.css';

const baseNavLinks = [
  { to: '/', label: 'Inicio' },
  { to: '/tienda', label: 'Tienda' },
  { to: '/comunidad', label: 'Comunidad', disabled: true },
  { to: '/contacto', label: 'Contacto' },
];

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const { totalCantidad } = useCart();

  const navLinks = useMemo(() => baseNavLinks, []);
  const isAdminUser = Boolean(
    user && (user.perfil === 'Administrador' || user.perfil === 'Vendedor')
  );

  const handleToggleMenu = () => setIsMenuOpen((prev) => !prev);
  const handleLinkClick = () => setIsMenuOpen(false);
  const handleLogout = () => {
    logout();
    handleLinkClick();
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
            {navLinks.map(({ to, label, disabled }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  [
                    styles.navLink,
                    isActive ? styles.navLinkActive : '',
                    disabled ? 'disabled' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')
                }
                aria-disabled={disabled}
                onClick={handleLinkClick}
              >
                {label}
              </NavLink>
            ))}
          </nav>

          <div className={styles.ctaLinks}>
            <NavLink
              to="/carrito"
              className={styles.navLink}
              onClick={handleLinkClick}
            >
              Carrito
              {totalCantidad > 0 && (
                <span className={styles.cartCount}>{totalCantidad}</span>
              )}
            </NavLink>
            {user && (
              <NavLink
                to="/perfil"
                className={styles.navLink}
                onClick={handleLinkClick}
              >
                Mi perfil
              </NavLink>
            )}
            {isAdminUser && (
              <NavLink
                to="/admin"
                className={styles.navLink}
                onClick={handleLinkClick}
              >
                Panel admin
              </NavLink>
            )}
            {user ? (
              <button
                type="button"
                className={styles.navLink}
                onClick={handleLogout}
              >
                Cerrar sesión
              </button>
            ) : (
              <NavLink
                to="/login"
                className={styles.navLink}
                onClick={handleLinkClick}
              >
                Iniciar sesión
              </NavLink>
            )}
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
            {navLinks.map(({ to, label, disabled }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  [
                    styles.mobileNavLink,
                    isActive ? styles.mobileNavLinkActive : '',
                    disabled ? 'disabled' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')
                }
                aria-disabled={disabled}
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
              <NavLink
                to="/login"
                className={styles.mobileNavLink}
                onClick={handleLinkClick}
              >
                Iniciar sesión
              </NavLink>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
