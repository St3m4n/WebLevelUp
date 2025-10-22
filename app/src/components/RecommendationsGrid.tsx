import { Link } from 'react-router-dom';
import { useProducts } from '@/hooks/useProducts';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { formatPrice } from '@/utils/format';
import { usePricing } from '@/hooks/usePricing';
import { truncateText } from '@/utils/text';
import styles from './RecommendationsGrid.module.css';

const RecommendationsGrid: React.FC = () => {
  const productos = useProducts();
  const { getPriceBreakdown, discountRate } = usePricing();
  const { addItem } = useCart();
  const { addToast } = useToast();
  const MAX_DESCRIPTION_LENGTH = 90;
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
                <Link
                  to={`/tienda/${producto.codigo}`}
                  className={styles.cardMedia}
                  aria-label={`Ver detalles de ${producto.nombre}`}
                >
                  <img
                    src={producto.url}
                    alt={producto.nombre}
                    loading="lazy"
                  />
                </Link>

                <div className={styles.cardBody}>
                  <div className={styles.productMeta}>
                    <h3 className={styles.productName}>
                      <Link
                        to={`/tienda/${producto.codigo}`}
                        className={styles.productLink}
                      >
                        {producto.nombre}
                      </Link>
                    </h3>
                    <p className={styles.productDescription}>
                      {truncateText(
                        producto.descripcion,
                        MAX_DESCRIPTION_LENGTH
                      )}
                    </p>
                  </div>

                  <div className={styles.priceSection}>
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
                  </div>

                  <button
                    type="button"
                    className={styles.addButton}
                    onClick={() => {
                      addItem(producto);
                      addToast({
                        title: 'Producto añadido',
                        description: producto.nombre,
                        variant: 'success',
                      });
                    }}
                  >
                    Agregar al carrito
                  </button>
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
