import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import ImageWithSkeleton from '@/components/ImageWithSkeleton';
import { useProducts } from '@/hooks/useProducts';
import type { ProductRecord } from '@/utils/products';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { formatPrice } from '@/utils/format';
import { usePricing } from '@/hooks/usePricing';
import { truncateText } from '@/utils/text';
import styles from './Tienda.module.css';

const SORT_OPTIONS = [
  { value: 'populares', label: 'Más populares' },
  { value: 'precio-asc', label: 'Precio: menor a mayor' },
  { value: 'precio-desc', label: 'Precio: mayor a menor' },
  { value: 'nuevo', label: 'Nuevos ingresos' },
];

const PAGE_SIZE_OPTIONS = [12, 24] as const;
const MAX_DESCRIPTION_LENGTH = 90;

const normalizePageSize = (
  value: string | null
): (typeof PAGE_SIZE_OPTIONS)[number] => {
  const parsed = Number(value);
  if (
    Number.isFinite(parsed) &&
    PAGE_SIZE_OPTIONS.includes(parsed as (typeof PAGE_SIZE_OPTIONS)[number])
  ) {
    return parsed as (typeof PAGE_SIZE_OPTIONS)[number];
  }
  return PAGE_SIZE_OPTIONS[0];
};

const normalizePage = (value: string | null): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1;
};

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
  const navigate = useNavigate();
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
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>(
    () => normalizePageSize(searchParams.get('porPagina'))
  );
  const [currentPage, setCurrentPage] = useState<number>(() =>
    normalizePage(searchParams.get('pagina'))
  );

  useEffect(() => {
    const sizeFromParams = normalizePageSize(searchParams.get('porPagina'));
    if (sizeFromParams !== pageSize) {
      setPageSize(sizeFromParams);
    }
    const pageFromParams = normalizePage(searchParams.get('pagina'));
    if (pageFromParams !== currentPage) {
      setCurrentPage(pageFromParams);
    }
  }, [searchParams, pageSize, currentPage]);

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

  const totalPages = useMemo(() => {
    const total = Math.ceil(productosFiltrados.length / pageSize);
    return total > 0 ? total : 1;
  }, [pageSize, productosFiltrados.length]);

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return productosFiltrados.slice(startIndex, endIndex);
  }, [currentPage, pageSize, productosFiltrados]);

  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
      const next = new URLSearchParams(searchParams);
      next.set('pagina', '1');
      setSearchParams(next, { replace: true });
    }
  }, [
    activeSort,
    categoriaParam,
    searchQuery,
    currentPage,
    searchParams,
    setSearchParams,
  ]);

  useEffect(() => {
    if (currentPage > totalPages) {
      const safePage = totalPages;
      setCurrentPage(safePage);
      const next = new URLSearchParams(searchParams);
      next.set('pagina', String(safePage));
      setSearchParams(next, { replace: true });
    }
  }, [currentPage, totalPages, searchParams, setSearchParams]);

  const handleSortChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const { value } = event.target;
    setActiveSort(value);
    const next = new URLSearchParams(searchParams);
    next.set('orden', value);
    setSearchParams(next, { replace: true });
  };

  const handlePageSizeChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const value = Number(event.target.value);
    const normalizedValue = value as (typeof PAGE_SIZE_OPTIONS)[number];
    if (!PAGE_SIZE_OPTIONS.includes(normalizedValue)) {
      return;
    }
    if (normalizedValue === pageSize) return;
    setPageSize(normalizedValue);
    setCurrentPage(1);
    const next = new URLSearchParams(searchParams);
    next.set('porPagina', String(normalizedValue));
    next.set('pagina', '1');
    setSearchParams(next, { replace: true });
  };

  const handlePageChange = (page: number) => {
    if (page === currentPage) return;
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    const next = new URLSearchParams(searchParams);
    next.set('pagina', String(page));
    setSearchParams(next, { replace: true });
  };

  const showingFrom =
    productosFiltrados.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const showingTo = Math.min(currentPage * pageSize, productosFiltrados.length);
  const showPagination = totalPages > 1;

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
            <div className={styles.pageSizeGroup}>
              <span>Mostrar</span>
              <div className={styles.select}>
                <label htmlFor="page-size" className="visually-hidden">
                  Productos por página
                </label>
                <select
                  id="page-size"
                  value={pageSize}
                  onChange={handlePageSizeChange}
                >
                  {PAGE_SIZE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option} por página
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </header>

        {productosFiltrados.length === 0 ? (
          <div className={styles.emptyState}>
            <h2>No encontramos productos</h2>
            <p>Intenta cambiar los filtros o revisar otra categoría.</p>
          </div>
        ) : (
          <>
            <div className={styles.grid}>
              {paginatedProducts.map((producto) => {
                const pricing = getPriceBreakdown(producto.precio);
                const goToProduct = () =>
                  navigate(`/tienda/${producto.codigo}`);
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
                    key={producto.codigo}
                    className={styles.card}
                    role="link"
                    tabIndex={0}
                    onClick={goToProduct}
                    onKeyDown={handleKeyDown}
                    aria-label={`Ver detalles de ${producto.nombre}`}
                  >
                    <ImageWithSkeleton
                      src={producto.url}
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

            <div className={styles.resultsFooter}>
              <span className={styles.resultsSummary}>
                Mostrando {showingFrom} – {showingTo} de{' '}
                {productosFiltrados.length} productos
              </span>
              {showPagination && (
                <nav
                  className={styles.pagination}
                  aria-label="Paginación de productos"
                >
                  <button
                    type="button"
                    className={styles.paginationNavButton}
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </button>
                  <ul className={styles.paginationList}>
                    {Array.from({ length: totalPages }).map((_, index) => {
                      const page = index + 1;
                      const isActive = page === currentPage;
                      return (
                        <li key={page}>
                          <button
                            type="button"
                            className={
                              isActive
                                ? styles.paginationButtonActive
                                : styles.paginationButton
                            }
                            onClick={() => handlePageChange(page)}
                            aria-current={isActive ? 'page' : undefined}
                          >
                            {page}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                  <button
                    type="button"
                    className={styles.paginationNavButton}
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Siguiente
                  </button>
                </nav>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Tienda;
