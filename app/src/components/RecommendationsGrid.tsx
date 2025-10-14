import { Link } from 'react-router-dom';
import { useProducts } from '@/hooks/useProducts';
import { formatPrice } from '@/utils/format';
import styles from './RecommendationsGrid.module.css';

const RecommendationsGrid: React.FC = () => {
  const productos = useProducts();
  const recomendados = productos
    .filter((producto) => !producto.deletedAt && producto.stock > 0)
    .slice(0, 4);

  if (recomendados.length === 0) {
    return null;
  }

  return (
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
};

export default RecommendationsGrid;
