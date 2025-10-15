import { Link } from 'react-router-dom';
import { useProducts } from '@/hooks/useProducts';
import { formatPrice } from '@/utils/format';
import { usePricing } from '@/hooks/usePricing';
import styles from './RecommendationsGrid.module.css';

const RecommendationsGrid: React.FC = () => {
  const productos = useProducts();
  const { getPriceBreakdown, discountRate } = usePricing();
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
          {recomendados.map((producto) => {
            const pricing = getPriceBreakdown(producto.precio);
            return (
              <article className={styles.card} key={producto.codigo}>
                <div className={styles.imageWrap}>
                  <img
                    src={producto.url}
                    alt={producto.nombre}
                    loading="lazy"
                  />
                </div>

                <div className={styles.body}>
                  <h3 className={styles.productName}>{producto.nombre}</h3>
                  <p className={styles.productDescription}>
                    {producto.descripcion}
                  </p>

                  <div className={styles.meta}>
                    {pricing.hasDiscount ? (
                      <span className={styles.priceWithDiscount}>
                        <span className={styles.priceOriginal}>
                          {formatPrice(pricing.basePrice)}
                        </span>
                        <span className={styles.priceFinal}>
                          {formatPrice(pricing.finalPrice)}
                        </span>
                        <span className={styles.discountBadge}>
                          −{Math.round(discountRate * 100)}% DUOC
                        </span>
                      </span>
                    ) : (
                      <span className={styles.priceFinal}>
                        {formatPrice(pricing.finalPrice)}
                      </span>
                    )}
                    <Link
                      to={`/tienda/${producto.codigo}`}
                      className={styles.action}
                    >
                      Ver detalle →
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default RecommendationsGrid;
