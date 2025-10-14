import { Link } from 'react-router-dom';
import { productos } from '@/data/productos';
import { formatPrice } from '@/utils/format';
import styles from './RecommendationsGrid.module.css';

const recomendados = productos.slice(0, 4);

const RecommendationsGrid: React.FC = () => (
  <section className={styles.section}>
    <div className="container">
      <header className={styles.header}>
        <h2 className={styles.title}>Te recomendamos</h2>
        <p className={styles.subtitle}>
          Selección curada según tendencias de la comunidad Level-Up.
        </p>
      </header>

      <div className={styles.grid}>
        {recomendados.map((producto) => (
          <article className={styles.card} key={producto.codigo}>
            <div className={styles.imageWrap}>
              <img src={producto.url} alt={producto.nombre} loading="lazy" />
            </div>

            <div className={styles.body}>
              <h3 className={styles.productName}>{producto.nombre}</h3>
              <p className={styles.productDescription}>
                {producto.descripcion}
              </p>

              <div className={styles.meta}>
                <span className={styles.price}>
                  {formatPrice(producto.precio)}
                </span>
                <Link
                  to={`/tienda/${producto.codigo}`}
                  className={styles.action}
                >
                  Ver detalle →
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  </section>
);

export default RecommendationsGrid;
