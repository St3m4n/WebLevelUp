import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useProducts } from '@/hooks/useProducts';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/utils/format';
import styles from './ProductoDetalle.module.css';

const ProductoDetalle: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const productos = useProducts();
  const [cantidad, setCantidad] = useState(1);
  const [feedback, setFeedback] = useState<string | null>(null);

  const producto = useMemo(() => {
    if (!id) return undefined;
    return productos.find(
      (item) =>
        item.codigo.toLowerCase() === id.toLowerCase() && !item.deletedAt
    );
  }, [id, productos]);

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

  if (!producto) {
    return (
      <div className="container">
        <div className={styles.emptyState}>
          <h1>Producto no encontrado</h1>
          <p>No pudimos encontrar el producto solicitado.</p>
          <Link to="/tienda" className={styles.backLink}>
            Volver a la tienda
          </Link>
        </div>
      </div>
    );
  }

  const maxCantidad = producto.stock;
  const hayStock = maxCantidad > 0;

  const handleChangeCantidad = (value: number) => {
    if (Number.isNaN(value)) return;
    const next = Math.min(Math.max(value, 1), maxCantidad || 1);
    setCantidad(next);
  };

  const handleAddToCart = () => {
    if (!hayStock) return;
    addItem(producto, cantidad);
    setFeedback(
      `${cantidad} ${cantidad === 1 ? 'producto' : 'productos'} añadidos al carrito`
    );
  };

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
            <img src={producto.url} alt={producto.nombre} />
          </section>

          <section className={styles.info}>
            <header className={styles.title}>
              <span className={styles.badge}>{producto.categoria}</span>
              <h1>{producto.nombre}</h1>
              <p>{producto.descripcion}</p>
            </header>

            <div className={styles.pricePanel}>
              <div className={styles.priceRow}>
                <span className={styles.price}>
                  {formatPrice(producto.precio)}
                </span>
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
                  <img src={item.url} alt={item.nombre} loading="lazy" />
                  <h3>{item.nombre}</h3>
                  <footer>
                    <span>{formatPrice(item.precio)}</span>
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
