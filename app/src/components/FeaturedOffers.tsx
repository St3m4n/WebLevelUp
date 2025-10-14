import { Link } from 'react-router-dom';
import { productos } from '@/data/productos';
import { formatPrice } from '@/utils/format';
import styles from './FeaturedOffers.module.css';

type FeaturedEntry = {
  codigo: string;
  heading: string;
  fallbackPrice: number;
  href: string;
};

type FeaturedCardData = {
  nombre: string;
  precio: number;
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

const mapProducto = (entry: FeaturedEntry): FeaturedCardData => {
  const producto = productos.find((item) => item.codigo === entry.codigo);
  if (!producto) {
    return {
      nombre: entry.heading,
      precio: entry.fallbackPrice,
      url: '',
      enlace: entry.href,
    };
  }

  const categoriaLink = producto.categoria
    ? `/tienda?categoria=${encodeURIComponent(producto.categoria)}`
    : entry.href;

  return {
    nombre: producto.nombre ?? entry.heading,
    precio: producto.precio ?? entry.fallbackPrice,
    url: producto.url,
    enlace: categoriaLink,
  };
};

const FeaturedOffers: React.FC = () => {
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
                <span className={styles.priceLabel}>desde</span>
                <span className={styles.priceValue}>
                  {formatPrice(principal.precio)}
                </span>
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
                    <span className={styles.priceLabel}>desde</span>
                    <span className={styles.priceValue}>
                      {formatPrice(item.precio)}
                    </span>
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
                <span className={styles.priceLabel}>desde</span>
                <span className={styles.priceValue}>
                  {formatPrice(cuarto.precio)}
                </span>
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
