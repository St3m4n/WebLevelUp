import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useMemo,
  useState,
  useRef,
  useCallback,
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
import {
  createCategory as createRemoteCategory,
  deleteCategory as deleteRemoteCategory,
  restoreCategory as restoreRemoteCategory,
  fetchCategories as fetchRemoteCategories,
} from '@/services/categoriesService';
import { ApiError } from '@/services/apiClient';
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
  const [isSyncing, setIsSyncing] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const { products: productos } = useProducts();
  const auditActor = useAuditActor();
  const prevCategoriasLength = useRef(categorias.length);

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

  const updateCategorias = useCallback(
    (updater: (current: Categoria[]) => Categoria[]) => {
      setCategorias((prev) => {
        const next = updater(prev);
        saveCategories(next);
        return next;
      });
    },
    []
  );

  const syncCategoriesFromServer = useCallback(
    async (showSuccessMessage = false) => {
      setIsSyncing(true);
      try {
        const remoteCategorias = await fetchRemoteCategories();
        updateCategorias(() => remoteCategorias);
        if (showSuccessMessage) {
          setStatusMessage('Categorías sincronizadas con el servidor.');
        }
      } catch (error) {
        console.warn('No se pudieron sincronizar las categorías', error);
        const message =
          error instanceof Error && error.message
            ? error.message
            : 'Revisa tu conexión e inténtalo nuevamente.';
        setStatusMessage(`No se pudo sincronizar con el servidor: ${message}`);
      } finally {
        setIsSyncing(false);
      }
    },
    [updateCategorias]
  );

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

  useEffect(() => {
    syncCategoriesFromServer().catch(() => undefined);
  }, [syncCategoriesFromServer]);

  // Sincronización automática con el catálogo
  useEffect(() => {
    if (productos.length === 0) return;

    updateCategorias((prev) => {
      const seeded = seedCategoriesFromProducts(prev, productos);
      if (seeded.length > prev.length) {
        return seeded;
      }
      return prev;
    });
  }, [productos]);

  // Detectar cambios en la cantidad de categorías para notificar
  useEffect(() => {
    const diff = categorias.length - prevCategoriasLength.current;
    if (diff > 0) {
      setStatusMessage(
        `${diff} categoría${diff === 1 ? '' : 's'} sincronizada${
          diff === 1 ? '' : 's'
        } desde el catálogo.`
      );
      recordAuditEvent({
        action: 'updated',
        summary: 'Sincronización automática de categorías',
        entity: {
          type: 'sistema',
          context: 'categorias',
        },
        metadata: {
          agregadas: diff,
        },
        actor: auditActor,
      });
    }
    prevCategoriasLength.current = categorias.length;
  }, [categorias.length, auditActor]);

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

  const handleAddCategoria = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatusMessage(null);
    const validation = validateCategoria(newCategoria);
    if (!validation.ok) {
      setFormError(validation.message ?? 'Nombre inválido.');
      return;
    }
    const clean = newCategoria.trim();
    setIsMutating(true);
    try {
      const created = await createRemoteCategory(clean);
      updateCategorias((prev) => [...prev, created]);
      setNewCategoria('');
      setFormError(null);
      setStatusMessage(`Categoría "${clean}" agregada correctamente.`);
      logCategoryEvent(
        'created',
        created.name,
        `Categoría "${created.name}" creada manualmente`,
        {
          origen: 'panel',
          categoriaId: created.id ?? null,
        }
      );
      await syncCategoriesFromServer();
    } catch (error) {
      console.warn('No se pudo crear la categoría', error);
      let message = 'No se pudo guardar la categoría. Inténtalo nuevamente.';
      if (error instanceof ApiError && error.message) {
        message = error.message;
      } else if (error instanceof Error && error.message) {
        message = error.message;
      }
      setFormError(message);
      setStatusMessage(null);
    } finally {
      setIsMutating(false);
    }
  };

  const handleDelete = async (categoria: Categoria) => {
    if (typeof window === 'undefined') return;
    const confirmed = window.confirm(
      `¿Eliminar la categoría "${categoria.name}"? Podrás restaurarla luego.`
    );
    if (!confirmed) return;
    if (categoria.id == null) {
      setStatusMessage(
        'No se encontró el identificador de la categoría. Se intentará sincronizar con el servidor.'
      );
      await syncCategoriesFromServer();
      return;
    }
    const deletedAt = new Date().toISOString();
    setIsMutating(true);
    try {
      await deleteRemoteCategory(categoria.id);
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
          categoriaId: categoria.id,
        }
      );
      await syncCategoriesFromServer();
    } catch (error) {
      console.warn('No se pudo eliminar la categoría', error);
      const message =
        error instanceof ApiError && error.message
          ? error.message
          : error instanceof Error && error.message
            ? error.message
            : 'No se pudo eliminar la categoría. Intenta nuevamente.';
      setStatusMessage(message);
    } finally {
      setIsMutating(false);
    }
  };

  const handleRestore = async (categoria: Categoria) => {
    if (typeof window === 'undefined') return;
    const confirmed = window.confirm(
      `¿Restaurar la categoría "${categoria.name}"?`
    );
    if (!confirmed) return;
    if (categoria.id == null) {
      setStatusMessage(
        'No se encontró el identificador de la categoría. Se intentará sincronizar con el servidor.'
      );
      await syncCategoriesFromServer();
      return;
    }
    setIsMutating(true);
    try {
      const restored = await restoreRemoteCategory(categoria.id);
      updateCategorias((prev) =>
        prev.map((item) =>
          item.name.toLowerCase() === categoria.name.toLowerCase()
            ? { ...item, deletedAt: restored.deletedAt, id: restored.id }
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
          categoriaId: categoria.id,
        }
      );
      await syncCategoriesFromServer();
    } catch (error) {
      console.warn('No se pudo restaurar la categoría', error);
      const message =
        error instanceof ApiError && error.message
          ? error.message
          : error instanceof Error && error.message
            ? error.message
            : 'No se pudo restaurar la categoría. Intenta nuevamente.';
      setStatusMessage(message);
    } finally {
      setIsMutating(false);
    }
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

        {isSyncing && (
          <div className={styles.statusBanner}>
            Sincronizando categorías con el servidor...
          </div>
        )}
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
            <button
              type="submit"
              className={styles.primaryAction}
              disabled={isMutating || isSyncing}
            >
              Agregar categoría
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
                                disabled={isMutating || isSyncing}
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
                              disabled={isMutating || isSyncing}
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
