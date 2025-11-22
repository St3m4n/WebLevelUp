import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useProducts } from '@/hooks/useProducts';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { formatPrice } from '@/utils/format';
import { usePricing } from '@/hooks/usePricing';
import { LevelUpConfig } from '@/utils/levelup';
import ImageWithSkeleton from '@/components/ImageWithSkeleton';
import { fetchProductByCode } from '@/services/products';
import type { Producto } from '@/types';
import styles from './ProductoDetalle.module.css';

const ProductoDetalle: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { addToast } = useToast();
  const { products: productos } = useProducts();
  const { getPriceBreakdown, discountRate } = usePricing();
  const [cantidad, setCantidad] = useState(1);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [fallbackProduct, setFallbackProduct] = useState<Producto | null>(
    null
  );
  const [fallbackLoading, setFallbackLoading] = useState(false);
  const [fallbackError, setFallbackError] = useState(false);

  const producto = useMemo(() => {
    if (!id) return undefined;
    const match = productos.find(
      (item) =>
        item.codigo.toLowerCase() === id.toLowerCase() && !item.deletedAt
    );
    if (match) {
      return match;
    }
    if (
      fallbackProduct &&
      fallbackProduct.codigo.toLowerCase() === id.toLowerCase() &&
      !fallbackProduct.deletedAt
    ) {
      return fallbackProduct;
    }
    return undefined;
  }, [fallbackProduct, id, productos]);

  useEffect(() => {
    let active = true;

    if (!id) {
      setFallbackProduct(null);
      setFallbackLoading(false);
      setFallbackError(false);
      return () => {
        active = false;
      };
    }

    if (producto) {
      setFallbackLoading(false);
      setFallbackError(false);
      setFallbackProduct(null);
      return () => {
        active = false;
      };
    }

    setFallbackLoading(true);
    setFallbackError(false);
    setFallbackProduct(null);

    fetchProductByCode(id)
      .then((record) => {
        if (!active) {
          return;
        }
        setFallbackLoading(false);
        if (record && !record.deletedAt) {
          setFallbackProduct(record);
        } else {
          setFallbackProduct(null);
          setFallbackError(true);
        }
      })
      .catch(() => {
        if (!active) {
          return;
        }
        setFallbackLoading(false);
        setFallbackProduct(null);
        setFallbackError(true);
      });

    return () => {
      active = false;
    };
  }, [id, producto]);

  const relacionados = useMemo(() => {
    if (!producto) return [];
    return productos
      .filter(
        (item) =>
          item.categoria === producto.categoria &&
          item.codigo !== producto.codigo &&
          !item.deletedAt
      )
      .slice(0, 3);
  }, [producto, productos]);

  useEffect(() => {
    setCantidad(1);
    setFeedback(null);
  }, [producto]);

  const maxCantidad = producto?.stock ?? 0;
  const hayStock = maxCantidad > 0;

  const handleChangeCantidad = (value: number) => {
    if (Number.isNaN(value)) return;
    const next = Math.min(Math.max(value, 1), maxCantidad || 1);
    setCantidad(next);
  };

  const handleAddToCart = () => {
    if (!producto || !hayStock) return;
    addItem(producto, cantidad);
    setFeedback(
      `${cantidad} ${cantidad === 1 ? 'producto' : 'productos'} añadidos al carrito`
    );
    addToast({
      title: 'Producto añadido',
      description: `${producto.nombre} x${cantidad}`,
      variant: 'success',
    });
  };

  const precioProducto = getPriceBreakdown(producto?.precio ?? 0);
  const purchaseMultiplier = LevelUpConfig.COMPRA_POR_1000;
  const pointsFormatter = useMemo(() => new Intl.NumberFormat('es-CL'), []);
  const pointsPerUnit = useMemo(() => {
    if (!hayStock || !purchaseMultiplier) return 0;
    const unitFinal = Math.max(0, precioProducto.finalPrice);
    return Math.floor(unitFinal / 1000) * purchaseMultiplier;
  }, [hayStock, precioProducto.finalPrice, purchaseMultiplier]);
  const totalPoints = useMemo(() => {
    if (!hayStock || !purchaseMultiplier) return 0;
    const totalCLP = Math.max(0, precioProducto.finalPrice * cantidad);
    return Math.floor(totalCLP / 1000) * purchaseMultiplier;
  }, [cantidad, hayStock, precioProducto.finalPrice, purchaseMultiplier]);
  const formattedRule = useMemo(() => {
    if (!purchaseMultiplier) {
      return 'Sin EXP por compras actualmente.';
    }
    if (purchaseMultiplier === 1) {
      return '1 EXP por cada $1.000 CLP';
    }
    return `${pointsFormatter.format(purchaseMultiplier)} EXP por cada $1.000 CLP`;
  }, [pointsFormatter, purchaseMultiplier]);

  if (!producto) {
    const title = fallbackLoading
      ? 'Cargando producto…'
      : 'Producto no encontrado';
    const message = fallbackLoading
      ? 'Buscando la información del producto en el catálogo.'
      : fallbackError
        ? 'No pudimos encontrar el producto solicitado en el catálogo.'
        : 'No pudimos encontrar el producto solicitado.';
    return (
      <div className="container">
        <div className={styles.emptyState}>
          <h1>{title}</h1>
          <p>{message}</p>
          <Link to="/tienda" className={styles.backLink}>
            Volver a la tienda
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className={styles.page}>
        <div className={styles.topBar}>
          <nav className={styles.breadcrumb} aria-label="breadcrumbs">
            <Link to="/">Inicio</Link>
            <span>•</span>
            <Link to="/tienda">Tienda</Link>
            <span>•</span>
            <span>{producto.nombre}</span>
          </nav>
          <button
            type="button"
            className={styles.backLink}
            onClick={() => navigate(-1)}
          >
            ← Volver
          </button>
        </div>

        <div className={styles.layout}>
          <section className={styles.gallery}>
            <ImageWithSkeleton
              src={producto.url}
              alt={producto.nombre}
              containerClassName={styles.galleryImageContainer}
              className={styles.galleryImage}
            />
          </section>

          <section className={styles.info}>
            <header className={styles.title}>
              <span className={styles.badge}>{producto.categoria}</span>
              <h1>{producto.nombre}</h1>
              <p>{producto.descripcion}</p>
            </header>

            <div className={styles.pricePanel}>
              <div className={styles.priceRow}>
                <div className={styles.priceGroup}>
                  {precioProducto.hasDiscount ? (
                    <>
                      <span className={styles.priceOriginal}>
                        {formatPrice(precioProducto.basePrice)}
                      </span>
                      <span className={styles.priceFinal}>
                        {formatPrice(precioProducto.finalPrice)}
                      </span>
                      <span className={styles.discountBadge}>
                        −{Math.round(discountRate * 100)}% DUOC
                      </span>
                    </>
                  ) : (
                    <span className={styles.priceFinal}>
                      {formatPrice(precioProducto.finalPrice)}
                    </span>
                  )}
                </div>
                <span className={styles.stockTag}>
                  {producto.stock > 5
                    ? 'Stock disponible'
                    : producto.stock === 0
                      ? 'Sin stock disponible'
                      : `Últimas ${producto.stock} unidades`}
                </span>
              </div>
              {hayStock && (
                <div className={styles.quantityRow}>
                  <label htmlFor="cantidad" className={styles.quantityLabel}>
                    Cantidad
                  </label>
                  <div className={styles.quantityControl}>
                    <button
                      type="button"
                      className={styles.quantityButton}
                      onClick={() => handleChangeCantidad(cantidad - 1)}
                      disabled={cantidad <= 1}
                      aria-label="Disminuir cantidad"
                    >
                      −
                    </button>
                    <input
                      id="cantidad"
                      name="cantidad"
                      type="number"
                      min={1}
                      max={maxCantidad}
                      value={cantidad}
                      onChange={(event) =>
                        handleChangeCantidad(Number(event.target.value))
                      }
                      className={styles.quantityInput}
                      inputMode="numeric"
                    />
                    <button
                      type="button"
                      className={styles.quantityButton}
                      onClick={() => handleChangeCantidad(cantidad + 1)}
                      disabled={cantidad >= maxCantidad}
                      aria-label="Aumentar cantidad"
                    >
                      +
                    </button>
                  </div>
                  <span className={styles.quantityHelper}>
                    Máximo {maxCantidad} unidades por compra
                  </span>
                </div>
              )}
              <div
                className={styles.loyaltyInfo}
                role="status"
                aria-live="polite"
              >
                <span className={styles.loyaltyBadge}>
                  +{pointsFormatter.format(totalPoints)} EXP
                </span>
                <div className={styles.loyaltyCopy}>
                  {hayStock ? (
                    <>
                      <span className={styles.loyaltyLead}>
                        Obtendrás {pointsFormatter.format(totalPoints)} EXP
                        Level-Up con esta compra.
                      </span>
                      <span className={styles.loyaltyDetails}>
                        ≈ {pointsFormatter.format(pointsPerUnit)} EXP por unidad
                        · {formattedRule}.
                      </span>
                    </>
                  ) : (
                    <span className={styles.loyaltyLead}>
                      Producto sin stock disponible, no acumula EXP por ahora.
                    </span>
                  )}
                </div>
              </div>
              <div className={styles.ctaGroup}>
                <button
                  type="button"
                  className={styles.primaryCta}
                  onClick={handleAddToCart}
                  disabled={!hayStock}
                >
                  Agregar al carrito
                </button>
                <Link to="/checkout" className={styles.secondaryCta}>
                  Comprar ahora
                </Link>
              </div>
              <p
                className={styles.statusMessage}
                role="status"
                aria-live="polite"
              >
                {feedback}
              </p>
            </div>

            <dl className={styles.specs}>
              <div className={styles.specItem}>
                <dt>Fabricante</dt>
                <dd>{producto.fabricante}</dd>
              </div>
              <div className={styles.specItem}>
                <dt>Distribuidor</dt>
                <dd>{producto.distribuidor}</dd>
              </div>
              <div className={styles.specItem}>
                <dt>Código</dt>
                <dd>{producto.codigo}</dd>
              </div>
              <div className={styles.specItem}>
                <dt>Stock crítico</dt>
                <dd>{producto.stockCritico}</dd>
              </div>
            </dl>
          </section>
        </div>

        {relacionados.length > 0 && (
          <section className={styles.related}>
            <h2>También te puede interesar</h2>
            <div className={styles.relatedGrid}>
              {relacionados.map((item) => (
                <Link
                  key={item.codigo}
                  to={`/tienda/${item.codigo}`}
                  className={styles.relatedCard}
                >
                  <ImageWithSkeleton
                    src={item.url}
                    alt={item.nombre}
                    loading="lazy"
                    containerClassName={styles.relatedImageContainer}
                    className={styles.relatedImage}
                  />
                  <h3>{item.nombre}</h3>
                  <footer>
                    {(() => {
                      const relatedPricing = getPriceBreakdown(item.precio);
                      return relatedPricing.hasDiscount ? (
                        <span className={styles.relatedPriceWithDiscount}>
                          <span className={styles.relatedPriceOriginal}>
                            {formatPrice(relatedPricing.basePrice)}
                          </span>
                          <span className={styles.relatedPriceFinal}>
                            {formatPrice(relatedPricing.finalPrice)}
                          </span>
                        </span>
                      ) : (
                        <span className={styles.relatedPriceFinal}>
                          {formatPrice(relatedPricing.finalPrice)}
                        </span>
                      );
                    })()}
                    <span>{item.categoria}</span>
                  </footer>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default ProductoDetalle;
