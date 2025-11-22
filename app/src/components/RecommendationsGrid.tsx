import { Link, useNavigate } from 'react-router-dom';
import ImageWithSkeleton from '@/components/ImageWithSkeleton';
import { useProducts } from '@/hooks/useProducts';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { formatPrice } from '@/utils/format';
import { usePricing } from '@/hooks/usePricing';
import { truncateText } from '@/utils/text';
import styles from './RecommendationsGrid.module.css';

const RecommendationsGrid: React.FC = () => {
  const navigate = useNavigate();
  const { products: productos } = useProducts();
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
            const goToProduct = () => navigate(`/tienda/${producto.codigo}`);
            const handleKeyDown: React.KeyboardEventHandler<HTMLElement> = (
              event
            ) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                goToProduct();
              }
            };

            return (
              <article
                className={styles.card}
                key={producto.codigo}
                role="link"
                tabIndex={0}
                onClick={goToProduct}
                onKeyDown={handleKeyDown}
                aria-label={`Ver detalles de ${producto.nombre}`}
              >
                <ImageWithSkeleton
                  src={producto.url || undefined}
                  alt={producto.nombre}
                  loading="lazy"
                  containerClassName={styles.cardMedia}
                  className={styles.cardMediaImage}
                />

                <div className={styles.cardBody}>
                  <div className={styles.productMeta}>
                    <h3 className={styles.productName}>
                      <Link
                        to={`/tienda/${producto.codigo}`}
                        className={styles.productLink}
                        tabIndex={-1}
                        onClick={(event) => event.stopPropagation()}
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
                    onClick={(event) => {
                      event.stopPropagation();
                      addItem(producto);
                      addToast({
                        title: 'Producto añadido',
                        description: producto.nombre,
                        variant: 'success',
                      });
                    }}
                    onKeyDown={(event) => event.stopPropagation()}
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
