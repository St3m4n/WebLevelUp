import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/utils/format';
import styles from './Carrito.module.css';

const Carrito: React.FC = () => {
  const {
    items,
    totalCantidad,
    subtotal,
    total,
    totalSavings,
    hasDuocDiscount,
    discountRate,
    getItemPricing,
    updateCantidad,
    removeItem,
    clearCart,
  } = useCart();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleChangeCantidad = (
    id: string,
    cantidad: number,
    stock: number,
    nombre: string
  ) => {
    if (!Number.isFinite(cantidad)) return;
    const limite = Math.max(stock, 1);
    const clamped = Math.min(Math.max(1, cantidad), limite);
    updateCantidad(id, clamped);
    if (cantidad > stock) {
      const verbo = stock === 1 ? 'queda' : 'quedan';
      const unidades = stock === 1 ? 'unidad' : 'unidades';
      setStatusMessage(
        `Solo ${verbo} ${stock} ${unidades} disponibles para ${nombre}.`
      );
    } else {
      setStatusMessage(null);
    }
  };

  const handleRemoveItem = (id: string, nombre: string) => {
    removeItem(id);
    setStatusMessage(`${nombre} se eliminó del carrito.`);
  };

  const handleClearCart = () => {
    clearCart();
    setStatusMessage('Carrito vaciado correctamente.');
  };

  if (items.length === 0) {
    return (
      <div className="container">
        <div className={styles.emptyState}>
          <h1>Tu carrito está vacío</h1>
          {statusMessage && (
            <p
              role="status"
              aria-live="polite"
              className={styles.statusMessage}
            >
              {statusMessage}
            </p>
          )}
          <p>
            Agrega productos desde la tienda y vuelve para finalizar tu compra.
          </p>
          <Link to="/tienda">Ir a la tienda →</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className={styles.page}>
        <header className={styles.header}>
          <h1>Tu carrito</h1>
          <p className={styles.subtitle}>
            {totalCantidad} productos listos para subir de nivel tu setup.
          </p>
          {statusMessage && (
            <p
              role="status"
              aria-live="polite"
              className={styles.statusMessage}
            >
              {statusMessage}
            </p>
          )}
        </header>

        <div className={styles.layout}>
          <section className={styles.table}>
            <div className={styles.tableHeader}>
              <span>Producto</span>
              <span>Cantidad</span>
              <span>Total</span>
              <span aria-hidden>
                <span className="visually-hidden">Eliminar</span>
              </span>
            </div>

            {items.map((item) => {
              const pricing = getItemPricing(item);
              return (
                <article key={item.id} className={styles.row}>
                  <div className={styles.productCell}>
                    <img src={item.imagen} alt={item.nombre} loading="lazy" />
                    <div className={styles.productInfo}>
                      <span className={styles.productName}>{item.nombre}</span>
                      <span className={styles.productMeta}>
                        Código: {item.id}
                      </span>
                      <span className={styles.productMeta}>
                        Precio unitario:{' '}
                        {pricing.hasDiscount ? (
                          <span className={styles.priceWithDiscount}>
                            <span className={styles.priceOriginal}>
                              {formatPrice(pricing.unitBase)}
                            </span>
                            <span className={styles.priceFinal}>
                              {formatPrice(pricing.unitFinal)}
                            </span>
                            <span className={styles.discountBadge}>
                              −{Math.round(discountRate * 100)}% DUOC
                            </span>
                          </span>
                        ) : (
                          <span className={styles.priceFinal}>
                            {formatPrice(pricing.unitFinal)}
                          </span>
                        )}
                      </span>
                      <span className={styles.stockInfo}>
                        Stock disponible: {item.stock}
                      </span>
                    </div>
                  </div>

                  <div className={styles.quantityCell}>
                    <div className={styles.quantityControl}>
                      <button
                        type="button"
                        onClick={() =>
                          handleChangeCantidad(
                            item.id,
                            item.cantidad - 1,
                            item.stock,
                            item.nombre
                          )
                        }
                        disabled={item.cantidad <= 1}
                        aria-label={`Reducir cantidad de ${item.nombre}`}
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={item.stock}
                        value={item.cantidad}
                        onChange={(event) =>
                          handleChangeCantidad(
                            item.id,
                            Number(event.target.value),
                            item.stock,
                            item.nombre
                          )
                        }
                        aria-label={`Cantidad para ${item.nombre}`}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          handleChangeCantidad(
                            item.id,
                            item.cantidad + 1,
                            item.stock,
                            item.nombre
                          )
                        }
                        disabled={item.cantidad >= item.stock}
                        aria-label={`Aumentar cantidad de ${item.nombre}`}
                      >
                        +
                      </button>
                    </div>
                    {item.cantidad >= item.stock && (
                      <span className={styles.stockAlert}>
                        Alcanzaste el stock disponible para este producto.
                      </span>
                    )}
                  </div>

                  <span className={styles.priceCell}>
                    {pricing.hasDiscount ? (
                      <span className={styles.priceWithDiscount}>
                        <span className={styles.priceOriginal}>
                          {formatPrice(pricing.subtotalBase)}
                        </span>
                        <span className={styles.priceFinal}>
                          {formatPrice(pricing.subtotalFinal)}
                        </span>
                      </span>
                    ) : (
                      <span className={styles.priceFinal}>
                        {formatPrice(pricing.subtotalFinal)}
                      </span>
                    )}
                  </span>

                  <button
                    type="button"
                    className={styles.removeButton}
                    onClick={() => handleRemoveItem(item.id, item.nombre)}
                  >
                    ×<span className="visually-hidden">Eliminar producto</span>
                  </button>
                </article>
              );
            })}
          </section>

          <aside className={styles.summaryCard}>
            <div className={styles.summaryRow}>
              <span>Subtotal</span>
              <span
                className={
                  hasDuocDiscount ? styles.priceOriginal : styles.priceFinal
                }
              >
                {formatPrice(subtotal)}
              </span>
            </div>
            {hasDuocDiscount && totalSavings > 0 && (
              <div className={styles.summaryRow}>
                <span>Descuento DUOC</span>
                <span className={styles.savingsAmount}>
                  −{formatPrice(totalSavings)}
                </span>
              </div>
            )}
            <div className={styles.summaryRow}>
              <span>Envío</span>
              <span>Calculado en el checkout</span>
            </div>
            <div className={styles.totalRow}>
              <span>Total</span>
              <span className={styles.priceFinal}>{formatPrice(total)}</span>
            </div>
            <div className={styles.summaryActions}>
              <Link to="/checkout" className={styles.checkoutButton}>
                Ir al checkout
              </Link>
              <Link to="/tienda" className={styles.secondaryLink}>
                Seguir comprando
              </Link>
              <button
                type="button"
                className={styles.clearButton}
                onClick={handleClearCart}
              >
                Vaciar carrito
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Carrito;
