import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useProducts } from '@/hooks/useProducts';
import type { ProductRecord } from '@/utils/products';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/utils/format';
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
  const productos = useProducts();
  const categorias = useMemo(
    () =>
      Array.from(
        new Set(
          productos
            .map((producto) => producto.categoria?.trim())
            .filter(Boolean)
        )
      ).sort((a, b) => (a ?? '').localeCompare(b ?? '')) as string[],
    [productos]
  );
  const { addItem } = useCart();

  const productosFiltrados = useMemo(() => {
    const base = categoriaParam
      ? productos.filter(
          (producto) =>
            producto.categoria?.toLowerCase() === categoriaParam.toLowerCase()
        )
      : productos;
    return ordenarProductos(activeSort, base);
  }, [activeSort, categoriaParam, productos]);

  const handleCategoriaClick = (categoria?: string) => {
    const next = new URLSearchParams(searchParams);
    if (categoria) {
      next.set('categoria', categoria);
    } else {
      next.delete('categoria');
    }
    setSearchParams(next, { replace: true });
  };

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
          </div>

          <div className={styles.controls}>
            <div className={styles.filterGroup}>
              <button
                type="button"
                className={`${styles.filterButton} ${categoriaParam ? '' : styles.filterButtonActive}`}
                onClick={() => handleCategoriaClick(undefined)}
              >
                Todos
              </button>
              {categorias.map((categoria) => (
                <button
                  key={categoria}
                  type="button"
                  className={`${styles.filterButton} ${
                    categoriaParam?.toLowerCase() === categoria.toLowerCase()
                      ? styles.filterButtonActive
                      : ''
                  }`}
                  onClick={() => handleCategoriaClick(categoria)}
                >
                  {categoria}
                </button>
              ))}
            </div>

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
            {productosFiltrados.map((producto) => (
              <article key={producto.codigo} className={styles.card}>
                <img src={producto.url} alt={producto.nombre} loading="lazy" />
                <div className={styles.cardBody}>
                  <h3 className={styles.productName}>{producto.nombre}</h3>
                  <p className={styles.productDescription}>
                    {producto.descripcion}
                  </p>

                  <div className={styles.priceSection}>
                    <span className={styles.price}>
                      {formatPrice(producto.precio)}
                    </span>
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
                    onClick={() => addItem(producto)}
                  >
                    Agregar al carrito
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Tienda;
