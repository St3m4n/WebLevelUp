import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useProducts } from '@/hooks/useProducts';
import type { Categoria } from '@/types';
import {
  CATEGORY_STORAGE_KEYS,
  loadCategories,
  saveCategories,
  seedCategoriesFromProducts,
  subscribeToCategories,
} from '@/utils/categories';
import { useAuditActor } from '@/hooks/useAuditActor';
import { recordAuditEvent } from '@/utils/audit';
import styles from './Admin.module.css';

type ViewMode = 'active' | 'deleted';

type FiltersState = {
  query: string;
  view: ViewMode;
};

type ValidationResult = {
  ok: boolean;
  message?: string;
};

const Categorias: React.FC = () => {
  const [categorias, setCategorias] = useState<Categoria[]>(() =>
    loadCategories()
  );
  const [filters, setFilters] = useState<FiltersState>({
    query: '',
    view: 'active',
  });
  const [newCategoria, setNewCategoria] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const { products: productos } = useProducts();
  const auditActor = useAuditActor();
  const logCategoryEvent = (
    action: 'created' | 'deleted' | 'restored' | 'updated',
    nombre: string,
    summary: string,
    metadata?: unknown
  ) => {
    recordAuditEvent({
      action,
      summary,
      entity: {
        type: 'categoria',
        id: nombre.toLowerCase(),
        name: nombre,
      },
      metadata,
      actor: auditActor,
    });
  };
  const productUsage = useMemo(() => {
    const counts = new Map<string, number>();
    productos.forEach((producto) => {
      if (producto.deletedAt) {
        return;
      }
      const categoria = producto.categoria?.trim();
      if (!categoria) return;
      const key = categoria.toLowerCase();
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    return counts;
  }, [productos]);

  useEffect(() => {
    const unsubscribe = subscribeToCategories(() => {
      setCategorias(loadCategories());
    });
    return () => {
      unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onStorage = (event: StorageEvent) => {
      if (event.key === CATEGORY_STORAGE_KEYS.key) {
        setCategorias(loadCategories());
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const updateCategorias = (updater: (current: Categoria[]) => Categoria[]) => {
    setCategorias((prev) => {
      const next = updater(prev);
      saveCategories(next);
      return next;
    });
  };

  const validateCategoria = (nombre: string): ValidationResult => {
    const clean = nombre.trim();
    if (!clean) {
      return { ok: false, message: 'Ingresa un nombre para la categoría.' };
    }
    if (clean.length > 100) {
      return { ok: false, message: 'Máximo 100 caracteres.' };
    }
    const exists = categorias.some(
      (categoria) => categoria.name.toLowerCase() === clean.toLowerCase()
    );
    if (exists) {
      return {
        ok: false,
        message:
          'La categoría ya existe. Si está eliminada, puedes restaurarla.',
      };
    }
    return { ok: true };
  };

  const handleAddCategoria = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatusMessage(null);
    const validation = validateCategoria(newCategoria);
    if (!validation.ok) {
      setFormError(validation.message ?? 'Nombre inválido.');
      return;
    }
    const clean = newCategoria.trim();
    updateCategorias((prev) => [...prev, { name: clean }]);
    setNewCategoria('');
    setFormError(null);
    setStatusMessage(`Categoría "${clean}" agregada correctamente.`);
    logCategoryEvent(
      'created',
      clean,
      `Categoría "${clean}" creada manualmente`,
      {
        origen: 'panel',
      }
    );
  };

  const handleSeedFromCatalog = () => {
    setStatusMessage(null);
    let added = 0;
    updateCategorias((prev) => {
      const seeded = seedCategoriesFromProducts(prev, productos);
      added = seeded.length - prev.length;
      return seeded;
    });
    if (added > 0) {
      setStatusMessage(
        `${added} categoría${added === 1 ? '' : 's'} agregada${
          added === 1 ? '' : 's'
        } desde el catálogo.`
      );
      recordAuditEvent({
        action: 'updated',
        summary: 'Sincronización de categorías desde catálogo de productos',
        entity: {
          type: 'sistema',
          context: 'categorias',
        },
        metadata: {
          agregadas: added,
        },
        actor: auditActor,
      });
    } else {
      setStatusMessage('No hay nuevas categorías para sincronizar.');
    }
  };

  const handleDelete = (categoria: Categoria) => {
    if (typeof window === 'undefined') return;
    const confirmed = window.confirm(
      `¿Eliminar la categoría "${categoria.name}"? Podrás restaurarla luego.`
    );
    if (!confirmed) return;
    const deletedAt = new Date().toISOString();
    updateCategorias((prev) =>
      prev.map((item) =>
        item.name.toLowerCase() === categoria.name.toLowerCase()
          ? { ...item, deletedAt }
          : item
      )
    );
    setStatusMessage(`Categoría "${categoria.name}" eliminada.`);
    const usage = productUsage.get(categoria.name.toLowerCase()) ?? 0;
    logCategoryEvent(
      'deleted',
      categoria.name,
      `Categoría "${categoria.name}" eliminada`,
      {
        deletedAt,
        productosAsociados: usage,
      }
    );
  };

  const handleRestore = (categoria: Categoria) => {
    if (typeof window === 'undefined') return;
    const confirmed = window.confirm(
      `¿Restaurar la categoría "${categoria.name}"?`
    );
    if (!confirmed) return;
    updateCategorias((prev) =>
      prev.map((item) =>
        item.name.toLowerCase() === categoria.name.toLowerCase()
          ? { name: item.name }
          : item
      )
    );
    setStatusMessage(`Categoría "${categoria.name}" restaurada.`);
    logCategoryEvent(
      'restored',
      categoria.name,
      `Categoría "${categoria.name}" restaurada`,
      {
        eliminadoAnteriormente: categoria.deletedAt ?? null,
      }
    );
  };

  const handleQueryChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({ ...prev, query: event.target.value }));
  };

  const handleViewChange = (view: ViewMode) => {
    setFilters((prev) => ({ ...prev, view }));
  };

  useEffect(() => {
    if (!statusMessage) return undefined;
    if (typeof window === 'undefined') return undefined;
    const timeout = window.setTimeout(() => setStatusMessage(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [statusMessage]);

  const normalizedCategorias = useMemo(() => {
    const query = filters.query.trim().toLowerCase();
    const active = categorias
      .filter((categoria) => !categoria.deletedAt)
      .filter((categoria) =>
        query ? categoria.name.toLowerCase().includes(query) : true
      )
      .sort((a, b) => a.name.localeCompare(b.name, 'es'));
    const deleted = categorias
      .filter((categoria) => categoria.deletedAt)
      .filter((categoria) =>
        query ? categoria.name.toLowerCase().includes(query) : true
      )
      .sort((a, b) => {
        const aDate = a.deletedAt ? new Date(a.deletedAt).getTime() : 0;
        const bDate = b.deletedAt ? new Date(b.deletedAt).getTime() : 0;
        return bDate - aDate;
      });
    return { active, deleted };
  }, [categorias, filters.query]);

  const { active: activeCategorias, deleted: deletedCategorias } =
    normalizedCategorias;

  const totals = useMemo(() => {
    return {
      total: categorias.length,
      active: categorias.filter((categoria) => !categoria.deletedAt).length,
      deleted: categorias.filter((categoria) => categoria.deletedAt).length,
    };
  }, [categorias]);

  return (
    <div className="container">
      <div className={styles.page}>
        <header className={styles.header}>
          <h1 className={styles.title}>Gestión de categorías</h1>
          <p className={styles.subtitle}>
            Crea, elimina y restaura categorías del catálogo. Puedes sincronizar
            con los productos disponibles para mantener la lista actualizada.
          </p>
        </header>

        {statusMessage && (
          <div className={styles.statusBanner}>{statusMessage}</div>
        )}

        <section className={styles.sectionCard}>
          <form className={styles.inlineForm} onSubmit={handleAddCategoria}>
            <label className="visually-hidden" htmlFor="categoria-nombre">
              Nombre de la categoría
            </label>
            <input
              id="categoria-nombre"
              value={newCategoria}
              onChange={(event) => {
                setNewCategoria(event.target.value);
                if (formError) {
                  setFormError(null);
                }
              }}
              className={styles.inlineInput}
              placeholder="Ej. Periféricos"
              aria-invalid={Boolean(formError)}
              aria-describedby={formError ? 'categoria-error' : undefined}
            />
            <button type="submit" className={styles.primaryAction}>
              Agregar categoría
            </button>
            <button
              type="button"
              className={styles.secondaryAction}
              onClick={handleSeedFromCatalog}
            >
              Sincronizar con catálogo
            </button>
          </form>
          {formError && (
            <span id="categoria-error" className={styles.formError}>
              {formError}
            </span>
          )}
        </section>

        <section className={styles.sectionCard}>
          <div className={styles.controlsBar}>
            <form
              className={styles.filtersForm}
              onSubmit={(event) => event.preventDefault()}
            >
              <input
                id="categoria-search"
                type="search"
                value={filters.query}
                onChange={handleQueryChange}
                className={styles.searchInput}
                placeholder="Buscar categoría"
                aria-label="Buscar categoría"
              />
            </form>

            <div className={styles.tabList} role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={filters.view === 'active'}
                className={`${styles.tabButton} ${
                  filters.view === 'active' ? styles.tabButtonActive : ''
                }`.trim()}
                onClick={() => handleViewChange('active')}
              >
                Activas ({activeCategorias.length})
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
                Eliminadas ({deletedCategorias.length})
              </button>
            </div>
          </div>

          <div className={styles.resultsSummary}>
            <span>
              Total: <strong>{totals.total}</strong>
            </span>
            <span>
              Activas: <strong>{totals.active}</strong>
            </span>
            <span>
              Eliminadas: <strong>{totals.deleted}</strong>
            </span>
          </div>

          {filters.view === 'active' ? (
            activeCategorias.length === 0 ? (
              <div className={styles.emptyResults}>
                <strong>No hay categorías activas.</strong>
                <span>Agrega una nueva o sincroniza con el catálogo.</span>
              </div>
            ) : (
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th scope="col">Categoría</th>
                      <th scope="col">Productos asociados</th>
                      <th scope="col" style={{ textAlign: 'right' }}>
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeCategorias.map((categoria) => {
                      const usage =
                        productUsage.get(categoria.name.toLowerCase()) ?? 0;
                      return (
                        <tr key={categoria.name}>
                          <td>{categoria.name}</td>
                          <td>{usage}</td>
                          <td>
                            <div className={styles.tableActions}>
                              <button
                                type="button"
                                className={`${styles.tableActionButton} ${styles.tableActionButtonDanger}`.trim()}
                                onClick={() => handleDelete(categoria)}
                              >
                                Eliminar
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          ) : deletedCategorias.length === 0 ? (
            <div className={styles.emptyResults}>
              <strong>No hay categorías eliminadas.</strong>
              <span>Cuando elimines categorías aparecerán aquí.</span>
            </div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">Categoría</th>
                    <th scope="col">Eliminada el</th>
                    <th scope="col" style={{ textAlign: 'right' }}>
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {deletedCategorias.map((categoria) => {
                    const deletedAt = categoria.deletedAt
                      ? new Date(categoria.deletedAt).toLocaleString('es-CL', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })
                      : '—';
                    return (
                      <tr key={`${categoria.name}-deleted`}>
                        <td>{categoria.name}</td>
                        <td>{deletedAt}</td>
                        <td>
                          <div className={styles.tableActions}>
                            <button
                              type="button"
                              className={`${styles.tableActionButton} ${styles.tableActionButtonSuccess}`.trim()}
                              onClick={() => handleRestore(categoria)}
                            >
                              Restaurar
                            </button>
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

export default Categorias;
