import {
  type ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { productos } from '@/data/productos';
import type { Producto } from '@/types';
import { formatPrice } from '@/utils/format';
import styles from './Admin.module.css';

type StockFilter = 'all' | 'healthy' | 'critical' | 'out';
type ViewMode = 'active' | 'deleted';

type PersistedState = {
  deletedAt: string;
};

type FiltersState = {
  query: string;
  category: string;
  stock: StockFilter;
  view: ViewMode;
};

type AdminProduct = Producto & {
  deletedAt?: string;
};

const STORAGE_KEY = 'levelup-admin-product-state';

const deletedAtFormatter = new Intl.DateTimeFormat('es-CL', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const getStockStatus = (
  product: Pick<Producto, 'stock' | 'stockCritico'>
): Exclude<StockFilter, 'all'> => {
  if (product.stock <= 0) {
    return 'out';
  }
  if (product.stock <= product.stockCritico) {
    return 'critical';
  }
  return 'healthy';
};

const loadPersistedState = (): Record<string, PersistedState> => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    return Object.entries(parsed).reduce<Record<string, PersistedState>>(
      (acc, [codigo, value]) => {
        if (
          value &&
          typeof value === 'object' &&
          typeof (value as PersistedState).deletedAt === 'string'
        ) {
          acc[codigo] = {
            deletedAt: (value as PersistedState).deletedAt,
          };
        }
        return acc;
      },
      {}
    );
  } catch (error) {
    console.warn('No se pudieron cargar los estados de productos', error);
    return {};
  }
};

const Productos: React.FC = () => {
  const navigate = useNavigate();
  const [persistedState, setPersistedState] = useState<
    Record<string, PersistedState>
  >(() => loadPersistedState());
  const [filters, setFilters] = useState<FiltersState>({
    query: '',
    category: '',
    stock: 'all',
    view: 'active',
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const entries = Object.entries(persistedState).filter(
        ([, value]) => value && typeof value.deletedAt === 'string'
      );
      if (entries.length === 0) {
        window.localStorage.removeItem(STORAGE_KEY);
        return;
      }
      const payload = Object.fromEntries(entries);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
      console.warn('No se pudieron guardar los estados de productos', error);
    }
  }, [persistedState]);

  const categories = useMemo(() => {
    const unique = new Set(
      productos.map((producto) => producto.categoria).filter(Boolean)
    );
    return Array.from(unique).sort((a, b) => a.localeCompare(b, 'es'));
  }, []);

  const adminProducts = useMemo<AdminProduct[]>(
    () =>
      productos.map((producto) => {
        const persisted = persistedState[producto.codigo];
        if (persisted?.deletedAt) {
          return { ...producto, deletedAt: persisted.deletedAt };
        }
        return { ...producto };
      }),
    [persistedState]
  );

  const totals = useMemo(() => {
    return adminProducts.reduce(
      (acc, product) => {
        if (product.deletedAt) {
          acc.deleted += 1;
          return acc;
        }
        acc.active += 1;
        const status = getStockStatus(product);
        if (status === 'critical') {
          acc.critical += 1;
        }
        if (status === 'out') {
          acc.out += 1;
        }
        return acc;
      },
      { active: 0, deleted: 0, critical: 0, out: 0 }
    );
  }, [adminProducts]);

  const filteredProducts = useMemo(() => {
    const query = filters.query.trim().toLowerCase();
    return adminProducts.filter((product) => {
      const isDeleted = Boolean(product.deletedAt);
      if (filters.view === 'active' && isDeleted) return false;
      if (filters.view === 'deleted' && !isDeleted) return false;

      if (query) {
        const haystack =
          `${product.codigo} ${product.nombre} ${product.categoria} ${product.fabricante}`.toLowerCase();
        if (!haystack.includes(query)) {
          return false;
        }
      }

      if (filters.category && product.categoria !== filters.category) {
        return false;
      }

      if (filters.view === 'active' && filters.stock !== 'all') {
        if (getStockStatus(product) !== filters.stock) {
          return false;
        }
      }

      return true;
    });
  }, [adminProducts, filters]);

  const displayedProducts = useMemo(() => {
    if (filters.view === 'deleted') {
      return [...filteredProducts].sort((a, b) => {
        if (!a.deletedAt) return 1;
        if (!b.deletedAt) return -1;
        return (
          new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime()
        );
      });
    }
    return [...filteredProducts].sort((a, b) =>
      a.nombre.localeCompare(b.nombre, 'es')
    );
  }, [filteredProducts, filters.view]);

  const handleQueryChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({ ...prev, query: event.target.value }));
  };

  const handleCategoryChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setFilters((prev) => ({ ...prev, category: event.target.value }));
  };

  const handleStockChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setFilters((prev) => ({
      ...prev,
      stock: event.target.value as StockFilter,
    }));
  };

  const handleViewChange = (nextView: ViewMode) => {
    setFilters((prev) => ({
      ...prev,
      view: nextView,
      stock: nextView === 'deleted' ? 'all' : prev.stock,
    }));
  };

  const handleResetFilters = () => {
    setFilters((prev) => ({
      ...prev,
      query: '',
      category: '',
      stock: 'all',
    }));
  };

  const handleDelete = useCallback((product: AdminProduct) => {
    if (product.deletedAt) return;
    if (typeof window === 'undefined') return;
    const confirmed = window.confirm(
      `¿Eliminar el producto "${product.nombre}"? Podrás restaurarlo más adelante.`
    );
    if (!confirmed) return;
    setPersistedState((prev) => ({
      ...prev,
      [product.codigo]: { deletedAt: new Date().toISOString() },
    }));
  }, []);

  const handleRestore = useCallback((product: AdminProduct) => {
    if (!product.deletedAt) return;
    if (typeof window === 'undefined') return;
    const confirmed = window.confirm(
      `¿Restaurar el producto "${product.nombre}"?`
    );
    if (!confirmed) return;
    setPersistedState((prev) => {
      const next = { ...prev };
      delete next[product.codigo];
      return next;
    });
  }, []);

  const renderStatusBadge = (product: AdminProduct) => {
    const status = getStockStatus(product);
    const label =
      status === 'out'
        ? 'Sin stock'
        : status === 'critical'
          ? 'Stock crítico'
          : 'Stock saludable';
    const badgeClass =
      status === 'out'
        ? styles.statusBadgeOut
        : status === 'critical'
          ? styles.statusBadgeCritical
          : styles.statusBadgeHealthy;
    return (
      <span className={`${styles.statusBadge} ${badgeClass}`.trim()}>
        {label}
      </span>
    );
  };

  return (
    <div className="container">
      <div className={styles.page}>
        <header className={styles.header}>
          <h1 className={styles.title}>Catálogo de productos</h1>
          <p className={styles.subtitle}>
            Revisa stocks en tiempo real, filtra por categoría y marca los
            productos de prueba como inactivos cuando sea necesario.
          </p>
        </header>

        <section className={styles.sectionCard}>
          <div className={styles.controlsBar}>
            <form
              className={styles.filtersForm}
              onSubmit={(event) => event.preventDefault()}
            >
              <input
                id="search"
                type="search"
                value={filters.query}
                onChange={handleQueryChange}
                placeholder="Buscar por SKU, nombre o fabricante"
                className={styles.searchInput}
                aria-label="Buscar producto"
              />
              <select
                id="category"
                value={filters.category}
                onChange={handleCategoryChange}
                className={styles.selectInput}
                aria-label="Filtrar por categoría"
              >
                <option value="">Todas las categorías</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              {filters.view === 'active' && (
                <select
                  id="stock"
                  value={filters.stock}
                  onChange={handleStockChange}
                  className={styles.stockSelect}
                  aria-label="Filtrar por estado de stock"
                >
                  <option value="all">Todos los stocks</option>
                  <option value="healthy">Stock saludable</option>
                  <option value="critical">Stock crítico</option>
                  <option value="out">Sin stock</option>
                </select>
              )}
            </form>
            <button
              type="button"
              className={styles.secondaryAction}
              onClick={handleResetFilters}
            >
              Limpiar filtros
            </button>
          </div>

          <div className={styles.controlsBar}>
            <div
              className={styles.tabList}
              role="tablist"
              aria-label="Vista de productos"
            >
              <button
                type="button"
                role="tab"
                aria-selected={filters.view === 'active'}
                className={`${styles.tabButton} ${
                  filters.view === 'active' ? styles.tabButtonActive : ''
                }`.trim()}
                onClick={() => handleViewChange('active')}
              >
                Activos
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={filters.view === 'deleted'}
                className={`${styles.tabButton} ${
                  filters.view === 'deleted' ? styles.tabButtonActive : ''
                }`.trim()}
                onClick={() => handleViewChange('deleted')}
              >
                Eliminados
              </button>
            </div>
            <div className={styles.resultsSummary}>
              <span>
                Activos: <strong>{totals.active}</strong>
              </span>
              <span>
                Crítico: <strong>{totals.critical}</strong>
              </span>
              <span>
                Sin stock: <strong>{totals.out}</strong>
              </span>
              <span>
                Eliminados: <strong>{totals.deleted}</strong>
              </span>
            </div>
          </div>

          {displayedProducts.length === 0 ? (
            <div className={styles.emptyResults}>
              <strong>
                No encontramos productos para los filtros actuales.
              </strong>
              <span>Prueba limpiarlos o revisa la pestaña de eliminados.</span>
            </div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">SKU</th>
                    <th scope="col">Producto</th>
                    {filters.view === 'active' ? (
                      <>
                        <th scope="col">Categoría</th>
                        <th scope="col">Precio</th>
                        <th scope="col">Stock</th>
                        <th scope="col">Estado</th>
                      </>
                    ) : (
                      <th scope="col">Eliminado el</th>
                    )}
                    <th scope="col" style={{ textAlign: 'right' }}>
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {displayedProducts.map((product) => {
                    const stockStatus = getStockStatus(product);
                    const stockClass =
                      stockStatus === 'out'
                        ? styles.stockOut
                        : stockStatus === 'critical'
                          ? styles.stockWarning
                          : undefined;

                    return (
                      <tr
                        key={product.codigo}
                        className={
                          product.deletedAt ? styles.tableRowDeleted : undefined
                        }
                      >
                        <td>{product.codigo}</td>
                        <td>
                          <div className={styles.productCell}>
                            <strong>{product.nombre}</strong>
                            <span className={styles.productMeta}>
                              {product.fabricante}
                            </span>
                          </div>
                        </td>
                        {filters.view === 'active' ? (
                          <>
                            <td>{product.categoria}</td>
                            <td>{formatPrice(product.precio)}</td>
                            <td className={stockClass}>{product.stock}</td>
                            <td>{renderStatusBadge(product)}</td>
                          </>
                        ) : (
                          <td>
                            {product.deletedAt
                              ? deletedAtFormatter.format(
                                  new Date(product.deletedAt)
                                )
                              : '—'}
                          </td>
                        )}
                        <td>
                          <div className={styles.tableActions}>
                            {filters.view === 'active' ? (
                              <>
                                <button
                                  type="button"
                                  className={styles.tableActionButton}
                                  onClick={() =>
                                    navigate(`/tienda/${product.codigo}`)
                                  }
                                >
                                  Ver en tienda
                                </button>
                                <button
                                  type="button"
                                  className={`${styles.tableActionButton} ${styles.tableActionButtonDanger}`.trim()}
                                  onClick={() => handleDelete(product)}
                                >
                                  Eliminar
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                className={`${styles.tableActionButton} ${styles.tableActionButtonSuccess}`.trim()}
                                onClick={() => handleRestore(product)}
                              >
                                Restaurar
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Productos;
