import {
  type ChangeEvent,
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import type { Producto } from '@/types';
import { formatPrice } from '@/utils/format';
import { useProducts } from '@/hooks/useProducts';
import { useAuditActor } from '@/hooks/useAuditActor';
import {
  createProduct,
  updateProduct,
  deleteProduct,
  restoreProduct,
  type ProductDto,
} from '@/services/products';
import { recordAuditEvent } from '@/utils/audit';
import styles from './Admin.module.css';

type StockFilter = 'all' | 'healthy' | 'critical' | 'out';
type ViewMode = 'active' | 'deleted';

type FiltersState = {
  query: string;
  category: string;
  stock: StockFilter;
  view: ViewMode;
};

type AdminProduct = ProductDto;

type ProductFormValues = {
  codigo: string;
  nombre: string;
  categoria: string;
  fabricante: string;
  distribuidor: string;
  precio: number;
  stock: number;
  stockCritico: number;
  imagenUrl: string;
  descripcion: string;
};

type ProductFormErrors = Partial<Record<keyof ProductFormValues, string>>;

type ProductFormState = {
  isOpen: boolean;
  mode: 'create' | 'edit';
  initial?: AdminProduct;
};

const deletedAtFormatter = new Intl.DateTimeFormat('es-CL', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const defaultFormValues: ProductFormValues = {
  codigo: '',
  nombre: '',
  categoria: '',
  fabricante: '',
  distribuidor: '',
  precio: 0,
  stock: 0,
  stockCritico: 0,
  imagenUrl: '',
  descripcion: '',
};

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

const PRODUCT_AUDIT_FIELDS = [
  'nombre',
  'categoria',
  'fabricante',
  'distribuidor',
  'precio',
  'stock',
  'stockCritico',
  'url',
  'descripcion',
] as const;

type ProductAuditField = (typeof PRODUCT_AUDIT_FIELDS)[number];

type ProductDiffEntry = {
  field: ProductAuditField;
  before: unknown;
  after: unknown;
};

const computeProductDiff = (
  previous: AdminProduct,
  next: AdminProduct
): ProductDiffEntry[] => {
  // @ts-ignore - dynamic access
  return PRODUCT_AUDIT_FIELDS.reduce<ProductDiffEntry[]>((acc, field) => {
    // @ts-ignore
    const before = previous[field];
    // @ts-ignore
    const after = next[field];
    if (before === after) {
      return acc;
    }
    return [...acc, { field, before, after }];
  }, []);
};

const Productos: React.FC = () => {
  const navigate = useNavigate();
  const { products: productos, refreshProducts } = useProducts();
  const auditActor = useAuditActor();

  const [filters, setFilters] = useState<FiltersState>({
    query: '',
    category: '',
    stock: 'all',
    view: 'active',
  });
  const [formState, setFormState] = useState<ProductFormState>({
    isOpen: false,
    mode: 'create',
  });
  const [formValues, setFormValues] =
    useState<ProductFormValues>(defaultFormValues);
  const [formErrors, setFormErrors] = useState<ProductFormErrors>({});
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const logProductEvent = useCallback(
    (
      action: 'created' | 'updated' | 'deleted' | 'restored',
      product: AdminProduct,
      summary: string,
      metadata?: unknown
    ) => {
      recordAuditEvent({
        action,
        summary,
        entity: {
          type: 'producto',
          id: product.codigo,
          name: product.nombre,
          context: product.categoria,
        },
        metadata,
        actor: auditActor,
      });
    },
    [auditActor]
  );

  useEffect(() => {
    if (!statusMessage) {
      return undefined;
    }
    if (typeof window === 'undefined') {
      return undefined;
    }
    const timeout = window.setTimeout(() => setStatusMessage(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [statusMessage]);

  const categories = useMemo(() => {
    const unique = new Set(
      productos
        .filter((producto) => !producto.deletedAt)
        .map((producto) => producto.categoria)
        .filter(Boolean)
    );
    return Array.from(unique).sort((a, b) => a.localeCompare(b, 'es'));
  }, [productos]);

  const adminProducts = useMemo<AdminProduct[]>(
    () => productos.map((producto) => ({ ...producto })),
    [productos]
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
      if (filters.view === 'active' && isDeleted) {
        return false;
      }
      if (filters.view === 'deleted' && !isDeleted) {
        return false;
      }

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

  const handleDelete = async (product: AdminProduct) => {
    if (product.deletedAt) {
      return;
    }
    if (typeof window === 'undefined') {
      return;
    }
    const confirmed = window.confirm(
      `¿Eliminar el producto "${product.nombre}"?`
    );
    if (!confirmed) {
      return;
    }
    try {
      await deleteProduct(product.codigo);
      await refreshProducts();
      setStatusMessage(`Producto "${product.nombre}" eliminado.`);
      logProductEvent(
        'deleted',
        product,
        `Producto "${product.nombre}" eliminado`,
        {
          stockAnterior: product.stock,
          categoria: product.categoria,
        }
      );
    } catch (error) {
      console.warn('No se pudo eliminar el producto', error);
      setStatusMessage('No se pudo eliminar el producto. Intenta nuevamente.');
    }
  };

  const handleRestore = async (product: AdminProduct) => {
    if (typeof window === 'undefined') {
      return;
    }
    const confirmed = window.confirm(
      `¿Restaurar el producto "${product.nombre}"?`
    );
    if (!confirmed) {
      return;
    }
    try {
      await restoreProduct(product.codigo);
      await refreshProducts();
      setStatusMessage(`Producto "${product.nombre}" restaurado.`);
      logProductEvent(
        'restored',
        product,
        `Producto "${product.nombre}" restaurado`,
        {
          categoria: product.categoria,
        }
      );
    } catch (error) {
      console.warn('No se pudo restaurar el producto', error);
      setStatusMessage('No se pudo restaurar el producto. Intenta nuevamente.');
    }
  };

  const handleOpenCreate = () => {
    setFormState({ isOpen: true, mode: 'create' });
    setFormValues(defaultFormValues);
    setFormErrors({});
  };

  const handleOpenEdit = (product: AdminProduct) => {
    setFormState({ isOpen: true, mode: 'edit', initial: product });
    setFormValues({
      codigo: product.codigo,
      nombre: product.nombre,
      categoria: product.categoria,
      fabricante: product.fabricante,
      distribuidor: product.distribuidor,
      precio: product.precio,
      stock: product.stock,
      stockCritico: product.stockCritico,
      imagenUrl: product.url || '',
      descripcion: product.descripcion ?? '',
    });
    setFormErrors({});
  };

  const handleCloseForm = () => {
    setFormState((prev) => ({ ...prev, isOpen: false, initial: undefined }));
    setFormErrors({});
  };

  const validateForm = (values: ProductFormValues): ProductFormErrors => {
    const errors: ProductFormErrors = {};

    if (formState.mode === 'create' && values.codigo) {
      if (!/^[a-z0-9-]+$/i.test(values.codigo.trim())) {
        errors.codigo = 'Usa solo letras, números o guiones.';
      }
    }

    if (!values.nombre.trim()) {
      errors.nombre = 'Ingresa un nombre.';
    }
    if (!values.categoria.trim()) {
      errors.categoria = 'Selecciona o ingresa una categoría.';
    }
    if (!values.fabricante.trim()) {
      errors.fabricante = 'Ingresa un fabricante.';
    }
    if (!values.distribuidor.trim()) {
      errors.distribuidor = 'Ingresa un distribuidor.';
    }
    if (!Number.isFinite(values.precio) || values.precio <= 0) {
      errors.precio = 'Ingresa un precio válido.';
    }
    if (!Number.isFinite(values.stock) || values.stock < 0) {
      errors.stock = 'El stock debe ser 0 o mayor.';
    }
    if (!Number.isFinite(values.stockCritico) || values.stockCritico < 0) {
      errors.stockCritico = 'El stock crítico debe ser 0 o mayor.';
    } else if (values.stockCritico > values.stock) {
      errors.stockCritico = 'No puede superar el stock disponible.';
    }
    if (!values.imagenUrl.trim()) {
      errors.imagenUrl = 'Ingresa una imagen o URL válida.';
    }

    return errors;
  };

  const handleFormInputChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setFormValues((prev) => {
      if (name === 'precio' || name === 'stock' || name === 'stockCritico') {
        const parsed = Number(value ?? '');
        return { ...prev, [name]: Number.isNaN(parsed) ? 0 : parsed };
      }
      return { ...prev, [name]: value };
    });
    setFormErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmitForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validateForm(formValues);
    if (Object.keys(validation).length > 0) {
      setFormErrors(validation);
      return;
    }

    const payload = {
      nombre: formValues.nombre.trim(),
      categoria: formValues.categoria.trim(),
      fabricante: formValues.fabricante.trim(),
      distribuidor: formValues.distribuidor.trim(),
      precio: Number(formValues.precio),
      stock: Number(formValues.stock),
      stockCritico: Number(formValues.stockCritico),
      url: formValues.imagenUrl.trim(),
      descripcion: formValues.descripcion.trim(),
    } satisfies Omit<Producto, 'codigo'>;

    try {
      if (formState.mode === 'create') {
        const created = await createProduct({
          ...payload,
          codigo: formValues.codigo.trim() || undefined,
          imagenUrl: formValues.imagenUrl.trim(),
        });
        // @ts-ignore
        setStatusMessage(`Producto "${created.nombre}" agregado al catálogo.`);
        logProductEvent(
          'created',
          created as AdminProduct,
          `Producto "${created.nombre}" creado`,
          {
            categoria: created.categoria,
            precio: created.precio,
            stock: created.stock,
            stockCritico: created.stockCritico,
          }
        );
      } else if (formState.initial) {
        const updated = await updateProduct(formState.initial.codigo, payload);
        // @ts-ignore
        const changes = computeProductDiff(formState.initial, updated as AdminProduct);
        // @ts-ignore
        setStatusMessage(`Producto "${updated.nombre}" actualizado correctamente.`);
        logProductEvent(
          'updated',
          updated as AdminProduct,
          `Producto "${updated.nombre}" actualizado`,
          {
            cambios: changes,
          }
        );
      }
      await refreshProducts();
      handleCloseForm();
    } catch (error: any) {
      console.warn('No se pudo guardar el producto', error);
      if (error.details) {
        console.warn('Detalles del error:', error.details);
      }
      setStatusMessage(
        'No se pudo guardar el producto. Revisa los datos e intenta nuevamente.'
      );
    }
  };

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

        {statusMessage && (
          <div className={styles.statusBanner}>{statusMessage}</div>
        )}

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
            <button
              type="button"
              className={styles.primaryAction}
              onClick={handleOpenCreate}
            >
              Nuevo producto
            </button>
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
                                  className={styles.tableActionButton}
                                  onClick={() => handleOpenEdit(product)}
                                >
                                  Editar
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

        {formState.isOpen && (
          <div className={styles.detailOverlay} role="dialog" aria-modal="true">
            <div className={styles.detailDialog}>
              <header className={styles.detailHeader}>
                <div className={styles.detailHeaderText}>
                  <h2>
                    {formState.mode === 'create'
                      ? 'Agregar nuevo producto'
                      : `Editar "${formState.initial?.nombre ?? ''}"`}
                  </h2>
                </div>
                <button
                  type="button"
                  className={styles.closeButton}
                  onClick={handleCloseForm}
                  aria-label="Cerrar"
                >
                  ×
                </button>
              </header>

              <form className={styles.form} onSubmit={handleSubmitForm}>
                <div className={styles.formSection}>
                  <div className={styles.formSectionHeader}>
                    <h3 className={styles.formSectionTitle}>
                      Información básica
                    </h3>
                  </div>
                  <div className={styles.formGrid}>
                    <label className={styles.formControl}>
                      <span>Código (SKU)</span>
                      <input
                        name="codigo"
                        value={formValues.codigo}
                        onChange={handleFormInputChange}
                        placeholder="Se genera automáticamente si lo dejas vacío"
                        readOnly={formState.mode === 'edit'}
                        aria-invalid={Boolean(formErrors.codigo)}
                      />
                      {formErrors.codigo && (
                        <span className={styles.formError}>
                          {formErrors.codigo}
                        </span>
                      )}
                    </label>

                    <label className={styles.formControl}>
                      <span>Nombre</span>
                      <input
                        name="nombre"
                        value={formValues.nombre}
                        onChange={handleFormInputChange}
                        required
                        aria-invalid={Boolean(formErrors.nombre)}
                      />
                      {formErrors.nombre && (
                        <span className={styles.formError}>
                          {formErrors.nombre}
                        </span>
                      )}
                    </label>

                    <label className={styles.formControl}>
                      <span>Categoría</span>
                      <input
                        name="categoria"
                        value={formValues.categoria}
                        onChange={handleFormInputChange}
                        list="catalog-categories"
                        required
                        aria-invalid={Boolean(formErrors.categoria)}
                      />
                      <datalist id="catalog-categories">
                        {categories.map((categoria) => (
                          <option key={categoria} value={categoria} />
                        ))}
                      </datalist>
                      {formErrors.categoria && (
                        <span className={styles.formError}>
                          {formErrors.categoria}
                        </span>
                      )}
                    </label>

                    <label className={styles.formControl}>
                      <span>Fabricante</span>
                      <input
                        name="fabricante"
                        value={formValues.fabricante}
                        onChange={handleFormInputChange}
                        required
                        aria-invalid={Boolean(formErrors.fabricante)}
                      />
                      {formErrors.fabricante && (
                        <span className={styles.formError}>
                          {formErrors.fabricante}
                        </span>
                      )}
                    </label>

                    <label className={styles.formControl}>
                      <span>Distribuidor</span>
                      <input
                        name="distribuidor"
                        value={formValues.distribuidor}
                        onChange={handleFormInputChange}
                        required
                        aria-invalid={Boolean(formErrors.distribuidor)}
                      />
                      {formErrors.distribuidor && (
                        <span className={styles.formError}>
                          {formErrors.distribuidor}
                        </span>
                      )}
                    </label>
                  </div>
                </div>

                <div className={styles.formSection}>
                  <div className={styles.formSectionHeader}>
                    <h3 className={styles.formSectionTitle}>
                      Inventario y precios
                    </h3>
                  </div>
                  <div className={styles.formGrid}>
                    <label className={styles.formControl}>
                      <span>Precio (CLP)</span>
                      <input
                        name="precio"
                        type="number"
                        min={0}
                        step={100}
                        value={formValues.precio}
                        onChange={handleFormInputChange}
                        required
                        aria-invalid={Boolean(formErrors.precio)}
                      />
                      {formErrors.precio && (
                        <span className={styles.formError}>
                          {formErrors.precio}
                        </span>
                      )}
                    </label>

                    <label className={styles.formControl}>
                      <span>Stock disponible</span>
                      <input
                        name="stock"
                        type="number"
                        min={0}
                        value={formValues.stock}
                        onChange={handleFormInputChange}
                        required
                        aria-invalid={Boolean(formErrors.stock)}
                      />
                      {formErrors.stock && (
                        <span className={styles.formError}>
                          {formErrors.stock}
                        </span>
                      )}
                    </label>

                    <label className={styles.formControl}>
                      <span>Stock crítico</span>
                      <input
                        name="stockCritico"
                        type="number"
                        min={0}
                        value={formValues.stockCritico}
                        onChange={handleFormInputChange}
                        required
                        aria-invalid={Boolean(formErrors.stockCritico)}
                      />
                      {formErrors.stockCritico && (
                        <span className={styles.formError}>
                          {formErrors.stockCritico}
                        </span>
                      )}
                    </label>

                    <label className={styles.formControl}>
                      <span>Imagen (URL)</span>
                      <input
                        name="imagenUrl"
                        value={formValues.imagenUrl}
                        onChange={handleFormInputChange}
                        required
                        aria-invalid={Boolean(formErrors.imagenUrl)}
                      />
                      {formErrors.imagenUrl && (
                        <span className={styles.formError}>
                          {formErrors.imagenUrl}
                        </span>
                      )}
                    </label>
                  </div>
                </div>

                <div className={styles.formSection}>
                  <div className={styles.formSectionHeader}>
                    <h3 className={styles.formSectionTitle}>Descripción</h3>
                  </div>
                  <label
                    className={`${styles.formControl} ${styles.formControlFull}`}
                  >
                    <span>Descripción</span>
                    <textarea
                      name="descripcion"
                      value={formValues.descripcion}
                      onChange={handleFormInputChange}
                      rows={4}
                    />
                  </label>
                </div>

                <footer className={styles.formFooter}>
                  <button
                    type="button"
                    className={styles.secondaryAction}
                    onClick={handleCloseForm}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className={styles.primaryAction}>
                    {formState.mode === 'create'
                      ? 'Agregar producto'
                      : 'Guardar cambios'}
                  </button>
                </footer>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Productos;
