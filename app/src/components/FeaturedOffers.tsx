import { Link } from 'react-router-dom';
import { useProducts } from '@/hooks/useProducts';
import { formatPrice } from '@/utils/format';
import { usePricing } from '@/hooks/usePricing';
import Card1 from '@/assets/1gamer.png';
import Card2 from '@/assets/2gamer.png';
import Card3 from '@/assets/3gamer.png';
import Card4 from '@/assets/4gamer.png';
import styles from './FeaturedOffers.module.css';

type FeaturedEntry = {
  codigo: string;
  heading: string;
  fallbackPrice: number;
  href: string;
};

type FeaturedCardData = {
  nombre: string;
  precioBase: number;
  precioFinal: number;
  hasDiscount: boolean;
  url: string;
  enlace: string;
};

const featuredEntries: FeaturedEntry[] = [
  {
    codigo: '1gamer',
    heading: 'Tarjetas de Video',
    fallbackPrice: 194_990,
    href: '/tienda?categoria=Tarjetas%20de%20Video',
  },
  {
    codigo: '2gamer',
    heading: 'Monitores Gamer',
    fallbackPrice: 97_990,
    href: '/tienda?categoria=Monitores',
  },
  {
    codigo: '3gamer',
    heading: 'Todo en SSD',
    fallbackPrice: 23_990,
    href: '/tienda?categoria=SSD',
  },
  {
    codigo: '4gamer',
    heading: 'Memorias RAM',
    fallbackPrice: 22_990,
    href: '/tienda?categoria=Memorias',
  },
];

const FALLBACK_IMAGES: Record<string, string> = {
  '1gamer': Card1,
  '2gamer': Card2,
  '3gamer': Card3,
  '4gamer': Card4,
};

const FeaturedOffersSkeleton: React.FC = () => (
  <section className={styles.section}>
    <div className="container">
      <div className={styles.header}>
        <span className={styles.kicker}>ofertas imperdibles</span>
        <h2 className={styles.title}>
          Potencia tu setup sin romper la billetera
        </h2>
      </div>

      <div className={styles.grid}>
        <div
          className={`${styles.card} ${styles.cardTall} ${styles.cardSkeleton}`}
          aria-hidden="true"
        >
          <div className={styles.cardSkeletonContent}>
            <span className={styles.skeletonTitle} />
            <span className={styles.skeletonPrice} />
            <span className={styles.skeletonBadge} />
          </div>
        </div>

        <div className={styles.stack}>
          {Array.from({ length: 2 }).map((_, index) => (
            <div
              key={`featured-offer-skeleton-${index}`}
              className={`${styles.card} ${styles.cardSkeleton}`}
              aria-hidden="true"
            >
              <div className={styles.cardSkeletonContent}>
                <span className={styles.skeletonTitle} />
                <span className={styles.skeletonPrice} />
                <span className={styles.skeletonCta} />
              </div>
            </div>
          ))}
        </div>

        <div
          className={`${styles.card} ${styles.cardTall} ${styles.cardSkeleton}`}
          aria-hidden="true"
        >
          <div className={styles.cardSkeletonContent}>
            <span className={styles.skeletonTitle} />
            <span className={styles.skeletonPrice} />
            <span className={styles.skeletonBadge} />
          </div>
        </div>
      </div>
    </div>
  </section>
);

const FeaturedOffers: React.FC = () => {
  const { products: productos, loading } = useProducts();
  const { getPriceBreakdown, discountRate } = usePricing();

  if (loading) {
    return <FeaturedOffersSkeleton />;
  }

  const mapProducto = (entry: FeaturedEntry): FeaturedCardData => {
    const producto = productos.find(
      (item) => item.codigo === entry.codigo && !item.deletedAt
    );
    if (!producto) {
      const breakdown = getPriceBreakdown(entry.fallbackPrice);
      return {
        nombre: entry.heading,
        precioBase: breakdown.basePrice,
        precioFinal: breakdown.finalPrice,
        hasDiscount: breakdown.hasDiscount,
        url: FALLBACK_IMAGES[entry.codigo] ?? '',
        enlace: entry.href,
      };
    }

    const categoriaLink = producto.categoria
      ? `/tienda?categoria=${encodeURIComponent(producto.categoria)}`
      : entry.href;

    const breakdown = getPriceBreakdown(producto.precio ?? entry.fallbackPrice);

    return {
      nombre: producto.nombre ?? entry.heading,
      precioBase: breakdown.basePrice,
      precioFinal: breakdown.finalPrice,
      hasDiscount: breakdown.hasDiscount,
      url: producto.url ?? FALLBACK_IMAGES[entry.codigo] ?? '',
      enlace: categoriaLink,
    };
  };

  const [principal, segundo, tercero, cuarto] =
    featuredEntries.map(mapProducto);

  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.header}>
          <span className={styles.kicker}>ofertas imperdibles</span>
          <h2 className={styles.title}>
            Potencia tu setup sin romper la billetera
          </h2>
        </div>

        <div className={styles.grid}>
          <Link
            to={principal.enlace}
            className={`${styles.card} ${styles.cardTall}`}
            style={{
              backgroundImage: principal.url
                ? `url(${principal.url})`
                : undefined,
            }}
          >
            <div className={styles.overlay} />
            <div className={styles.cardContent}>
              <h3 className={styles.cardTitle}>{principal.nombre}</h3>
              <div className={styles.priceBadge}>
                <span className={styles.priceLabel}>
                  {principal.hasDiscount ? 'precio DUOC' : 'desde'}
                </span>
                {principal.hasDiscount ? (
                  <span className={styles.priceValueWithDiscount}>
                    <span className={styles.priceOriginal}>
                      {formatPrice(principal.precioBase)}
                    </span>
                    <span className={styles.priceValue}>
                      {formatPrice(principal.precioFinal)}
                    </span>
                  </span>
                ) : (
                  <span className={styles.priceValue}>
                    {formatPrice(principal.precioFinal)}
                  </span>
                )}
                {principal.hasDiscount && (
                  <span className={styles.discountBadge}>
                    −{Math.round(discountRate * 100)}% DUOC
                  </span>
                )}
              </div>
              <span className={styles.cta}>Ver categoría →</span>
            </div>
          </Link>

          <div className={styles.stack}>
            {[segundo, tercero].map((item, index) => (
              <Link
                key={`${item.enlace}-${index}`}
                to={item.enlace}
                className={styles.card}
                style={{
                  backgroundImage: item.url ? `url(${item.url})` : undefined,
                }}
              >
                <div className={styles.overlay} />
                <div className={styles.cardContent}>
                  <h3 className={styles.cardTitle}>{item.nombre}</h3>
                  <div className={styles.priceBadge}>
                    <span className={styles.priceLabel}>
                      {item.hasDiscount ? 'precio DUOC' : 'desde'}
                    </span>
                    {item.hasDiscount ? (
                      <span className={styles.priceValueWithDiscount}>
                        <span className={styles.priceOriginal}>
                          {formatPrice(item.precioBase)}
                        </span>
                        <span className={styles.priceValue}>
                          {formatPrice(item.precioFinal)}
                        </span>
                      </span>
                    ) : (
                      <span className={styles.priceValue}>
                        {formatPrice(item.precioFinal)}
                      </span>
                    )}
                    {item.hasDiscount && (
                      <span className={styles.discountBadge}>
                        −{Math.round(discountRate * 100)}% DUOC
                      </span>
                    )}
                  </div>
                  <span className={styles.cta}>Ver categoría →</span>
                </div>
              </Link>
            ))}
          </div>

          <Link
            to={cuarto.enlace}
            className={`${styles.card} ${styles.cardTall}`}
            style={{
              backgroundImage: cuarto.url ? `url(${cuarto.url})` : undefined,
            }}
          >
            <div className={styles.overlay} />
            <div className={styles.cardContent}>
              <h3 className={styles.cardTitle}>{cuarto.nombre}</h3>
              <div className={styles.priceBadge}>
                <span className={styles.priceLabel}>
                  {cuarto.hasDiscount ? 'precio DUOC' : 'desde'}
                </span>
                {cuarto.hasDiscount ? (
                  <span className={styles.priceValueWithDiscount}>
                    <span className={styles.priceOriginal}>
                      {formatPrice(cuarto.precioBase)}
                    </span>
                    <span className={styles.priceValue}>
                      {formatPrice(cuarto.precioFinal)}
                    </span>
                  </span>
                ) : (
                  <span className={styles.priceValue}>
                    {formatPrice(cuarto.precioFinal)}
                  </span>
                )}
                {cuarto.hasDiscount && (
                  <span className={styles.discountBadge}>
                    −{Math.round(discountRate * 100)}% DUOC
                  </span>
                )}
              </div>
              <span className={styles.cta}>Ver categoría →</span>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedOffers;
