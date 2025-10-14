import { Link } from 'react-router-dom';
import logo from '@/assets/logo2.png';
import styles from './Footer.module.css';

const Footer: React.FC = () => {
  return (
    <footer className={styles.footerRoot}>
      <div className="container">
        <div className={styles.footerContent}>
          <div className={styles.brand}>
            <img src={logo} alt="Level-Up" />
            <p>
              Somos tu tienda gamer favorita. Hardware, periféricos, juegos y
              comunidad en un solo lugar.
            </p>
          </div>

          <div>
            <h3 className={styles.footerTitle}>Secciones</h3>
            <nav className={styles.linkList} aria-label="Secciones">
              <Link to="/" className={styles.link}>
                Inicio
              </Link>
              <Link to="/tienda" className={styles.link}>
                Tienda
              </Link>
              <Link to="/carrito" className={styles.link}>
                Carrito
              </Link>
              <Link to="/checkout" className={styles.link}>
                Checkout
              </Link>
            </nav>
          </div>

          <div>
            <h3 className={styles.footerTitle}>Cuenta</h3>
            <nav className={styles.linkList} aria-label="Cuenta">
              <Link to="/login" className={styles.link}>
                Iniciar sesión
              </Link>
              <Link to="/registro" className={styles.link}>
                Registrarse
              </Link>
              <Link to="/admin" className={styles.link}>
                Panel Admin
              </Link>
            </nav>
          </div>

          <div>
            <h3 className={styles.footerTitle}>Contacto</h3>
            <ul className={styles.linkList}>
              <li className={styles.link}>contacto@levelup.cl</li>
              <li className={styles.link}>+56 9 1234 5678</li>
              <li className={styles.link}>Santiago, Chile</li>
            </ul>
          </div>
        </div>

        <div className={styles.bottomBar}>
          <span>
            © {new Date().getFullYear()} Level-Up Gamer. Todos los derechos
            reservados.
          </span>
          <div className={styles.social}>
            <a href="https://twitch.tv" target="_blank" rel="noreferrer">
              Twitch
            </a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer">
              Instagram
            </a>
            <a href="https://discord.com" target="_blank" rel="noreferrer">
              Discord
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
