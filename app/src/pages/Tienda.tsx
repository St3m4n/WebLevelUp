import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useProducts } from '@/hooks/useProducts';
import type { ProductRecord } from '@/utils/products';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { formatPrice } from '@/utils/format';
import { usePricing } from '@/hooks/usePricing';
import styles from './Tienda.module.css';

const SORT_OPTIONS = [
  { value: 'populares', label: 'Más populares' },
  { value: 'precio-asc', label: 'Precio: menor a mayor' },
  { value: 'precio-desc', label: 'Precio: mayor a menor' },
  { value: 'nuevo', label: 'Nuevos ingresos' },
];

const ordenarProductos = (sort: string, items: ProductRecord[]) => {
  switch (sort) {
    case 'precio-asc':
      return [...items].sort((a, b) => a.precio - b.precio);
    case 'precio-desc':
      return [...items].sort((a, b) => b.precio - a.precio);
    case 'nuevo':
      return [...items].sort((a, b) => b.codigo.localeCompare(a.codigo));
    default:
      return items;
  }
};

const Tienda: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeSort, setActiveSort] = useState(
    searchParams.get('orden') ?? 'populares'
  );
  const categoriaParam = searchParams.get('categoria') ?? undefined;
  const searchQuery = (searchParams.get('q') ?? '').trim();
  const productos = useProducts();
  const { getPriceBreakdown, discountRate } = usePricing();
  const { addItem } = useCart();
  const { addToast } = useToast();

  const productosFiltrados = useMemo(() => {
    const base = categoriaParam
      ? productos.filter(
          (producto) =>
            producto.categoria?.toLowerCase() === categoriaParam.toLowerCase()
        )
      : productos;
    const queryLower = searchQuery.toLowerCase();
    const filtrados = queryLower
      ? base.filter((producto) => {
          const nombre = producto.nombre?.toLowerCase() ?? '';
          const descripcion = producto.descripcion?.toLowerCase() ?? '';
          const categoria = producto.categoria?.toLowerCase() ?? '';
          return (
            nombre.includes(queryLower) ||
            descripcion.includes(queryLower) ||
            categoria.includes(queryLower)
          );
        })
      : base;
    return ordenarProductos(activeSort, filtrados);
  }, [activeSort, categoriaParam, productos, searchQuery]);

  const handleSortChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const { value } = event.target;
    setActiveSort(value);
    const next = new URLSearchParams(searchParams);
    next.set('orden', value);
    setSearchParams(next, { replace: true });
  };

  return (
    <div className="container">
      <div className={styles.page}>
        <header className={styles.header}>
          <nav className={styles.breadcrumb} aria-label="breadcrumb">
            <Link to="/">Inicio</Link>
            <span>•</span>
            <span>Tienda</span>
          </nav>

          <div className={styles.title}>
            <h1>Tienda Level-Up</h1>
            <span className={styles.badge}>
              {productosFiltrados.length} productos
            </span>
            {searchQuery && (
              <span className={styles.searchTag}>
                Resultado para &quot;{searchQuery}&quot;
              </span>
            )}
          </div>

          <div className={styles.controls}>
            <div className={styles.select}>
              <label htmlFor="orden" className="visually-hidden">
                Ordenar productos
              </label>
              <select id="orden" value={activeSort} onChange={handleSortChange}>
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </header>

        {productosFiltrados.length === 0 ? (
          <div className={styles.emptyState}>
            <h2>No encontramos productos</h2>
            <p>Intenta cambiar los filtros o revisar otra categoría.</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {productosFiltrados.map((producto) => {
              const pricing = getPriceBreakdown(producto.precio);
              return (
                <article key={producto.codigo} className={styles.card}>
                  <img
                    src={producto.url}
                    alt={producto.nombre}
                    loading="lazy"
                  />
                  <div className={styles.cardBody}>
                    <h3 className={styles.productName}>{producto.nombre}</h3>
                    <p className={styles.productDescription}>
                      {producto.descripcion}
                    </p>

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
                      <Link
                        to={`/tienda/${producto.codigo}`}
                        className={styles.detailLink}
                      >
                        Ver detalle →
                      </Link>
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
        )}
      </div>
    </div>
  );
};

export default Tienda;
