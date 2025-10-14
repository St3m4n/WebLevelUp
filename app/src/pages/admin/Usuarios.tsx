import {
  type ChangeEvent,
  type ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { usuarios } from '@/data/usuarios';
import type { Order, Usuario, UsuarioPerfil } from '@/types';
import { formatPrice } from '@/utils/format';
import {
  loadOrders,
  subscribeToOrders,
  ORDER_STORAGE_KEYS,
} from '@/utils/orders';
import styles from './Admin.module.css';

type ViewMode = 'active' | 'deleted';
type BenefitFilter = 'all' | 'duoc' | 'vitalicio';

type FiltersState = {
  query: string;
  role: '' | UsuarioPerfil;
  benefit: BenefitFilter;
  view: ViewMode;
};

type PersistedUserState = {
  deletedAt: string;
};

type ExtraUsuario = Usuario & {
  passwordHash?: string;
  passwordSalt?: string;
  createdAt?: string;
};

type AdminUsuario = Usuario & {
  origin: 'seed' | 'extra';
  deletedAt?: string;
  createdAt?: string | null;
};

const EXTRA_USERS_STORAGE_KEY = 'levelup-extra-users';
const ADMIN_USER_STATES_KEY = 'levelup-admin-user-state';

const normalizeRun = (run: string) =>
  run.replace(/[^0-9kK]/g, '').toUpperCase();

const normalizeCorreo = (correo: string) => correo.trim().toLowerCase();

const formatRun = (raw: string): string => {
  const clean = normalizeRun(raw);
  if (clean.length < 2) return clean;
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  let formatted = '';
  let count = 0;
  for (let index = body.length - 1; index >= 0; index -= 1) {
    formatted = body[index] + formatted;
    count += 1;
    if (count === 3 && index !== 0) {
      formatted = `.${formatted}`;
      count = 0;
    }
  }
  return `${formatted}-${dv}`;
};

const sanitizeExtraUsuario = (candidate: unknown): ExtraUsuario | null => {
  if (!candidate || typeof candidate !== 'object') return null;
  const partial = candidate as Partial<ExtraUsuario>;
  if (
    typeof partial.correo !== 'string' ||
    typeof partial.run !== 'string' ||
    typeof partial.nombre !== 'string' ||
    typeof partial.apellidos !== 'string'
  ) {
    return null;
  }

  return {
    run: normalizeRun(partial.run),
    nombre: partial.nombre,
    apellidos: partial.apellidos,
    correo: normalizeCorreo(partial.correo),
    perfil: partial.perfil ?? 'Cliente',
    fechaNacimiento: partial.fechaNacimiento ?? null,
    region: partial.region ?? '',
    comuna: partial.comuna ?? '',
    direccion: partial.direccion ?? '',
    descuentoVitalicio: Boolean(partial.descuentoVitalicio),
    isSystem: Boolean(partial.isSystem),
    passwordHash: partial.passwordHash,
    passwordSalt: partial.passwordSalt,
    createdAt: partial.createdAt,
  };
};

const loadExtraUsuarios = (): ExtraUsuario[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(EXTRA_USERS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => sanitizeExtraUsuario(item))
      .filter((item): item is ExtraUsuario => Boolean(item));
  } catch (error) {
    console.warn('No se pudieron cargar usuarios registrados', error);
    return [];
  }
};

const loadPersistedStates = (): Record<string, PersistedUserState> => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(ADMIN_USER_STATES_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    return Object.entries(parsed).reduce<Record<string, PersistedUserState>>(
      (acc, [run, value]) => {
        if (
          typeof run === 'string' &&
          value &&
          typeof value === 'object' &&
          typeof (value as PersistedUserState).deletedAt === 'string'
        ) {
          acc[normalizeRun(run)] = {
            deletedAt: (value as PersistedUserState).deletedAt,
          };
        }
        return acc;
      },
      {}
    );
  } catch (error) {
    console.warn('No se pudieron cargar los estados de usuarios', error);
    return {};
  }
};

const mergeUsuarios = (
  seed: Usuario[],
  extras: ExtraUsuario[],
  persisted: Record<string, PersistedUserState>
): AdminUsuario[] => {
  const byRun = new Map<string, AdminUsuario>();
  const byCorreo = new Map<string, AdminUsuario>();

  const pushUsuario = (usuario: Usuario, origin: 'seed' | 'extra') => {
    const runKey = normalizeRun(usuario.run);
    const correoKey = normalizeCorreo(usuario.correo);
    if (!runKey || !correoKey) return;

    const adminUsuario: AdminUsuario = {
      ...usuario,
      run: runKey,
      correo: correoKey,
      origin,
      createdAt:
        origin === 'extra'
          ? ((usuario as ExtraUsuario).createdAt ?? null)
          : null,
    };

    const persistedState = persisted[runKey];
    if (persistedState?.deletedAt) {
      adminUsuario.deletedAt = persistedState.deletedAt;
    }

    const existingByCorreo = byCorreo.get(correoKey);
    const existingByRun = byRun.get(runKey);
    const shouldOverride = origin === 'extra';

    if (!existingByCorreo || shouldOverride) {
      byCorreo.set(correoKey, adminUsuario);
    }

    if (!existingByRun || shouldOverride) {
      byRun.set(runKey, adminUsuario);
    }
  };

  seed.forEach((usuario) => pushUsuario(usuario, 'seed'));
  extras.forEach((usuario) => pushUsuario(usuario, 'extra'));

  return Array.from(byRun.values());
};

const Usuarios: React.FC = () => {
  const [persistedStates, setPersistedStates] = useState<
    Record<string, PersistedUserState>
  >(() => loadPersistedStates());
  const [extraUsuarios, setExtraUsuarios] = useState<ExtraUsuario[]>(() =>
    loadExtraUsuarios()
  );
  const [orders, setOrders] = useState<Order[]>(() => loadOrders());
  const [filters, setFilters] = useState<FiltersState>({
    query: '',
    role: '',
    benefit: 'all',
    view: 'active',
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onStorage = (event: StorageEvent) => {
      if (event.key === EXTRA_USERS_STORAGE_KEY) {
        setExtraUsuarios(loadExtraUsuarios());
      }
      if (event.key === ADMIN_USER_STATES_KEY) {
        setPersistedStates(loadPersistedStates());
      }
      if (event.key === ORDER_STORAGE_KEYS.global) {
        setOrders(loadOrders());
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToOrders(() => {
      setOrders(loadOrders());
    });
    return () => {
      unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const entries = Object.entries(persistedStates).filter(
        ([, value]) => value && typeof value.deletedAt === 'string'
      );
      if (entries.length === 0) {
        window.localStorage.removeItem(ADMIN_USER_STATES_KEY);
        return;
      }
      window.localStorage.setItem(
        ADMIN_USER_STATES_KEY,
        JSON.stringify(Object.fromEntries(entries))
      );
    } catch (error) {
      console.warn('No se pudieron guardar los estados de usuarios', error);
    }
  }, [persistedStates]);

  const adminUsuarios = useMemo(
    () => mergeUsuarios(usuarios, extraUsuarios, persistedStates),
    [extraUsuarios, persistedStates]
  );

  const roles = useMemo(() => {
    const unique = new Set(adminUsuarios.map((usuario) => usuario.perfil));
    return Array.from(unique).sort((a, b) => a.localeCompare(b, 'es'));
  }, [adminUsuarios]);

  const totals = useMemo(() => {
    return adminUsuarios.reduce(
      (acc, usuario) => {
        if (usuario.deletedAt) {
          acc.deleted += 1;
        } else {
          acc.active += 1;
        }
        const correoLower = usuario.correo.toLowerCase();
        if (!usuario.deletedAt && correoLower.endsWith('@duoc.cl')) {
          acc.duoc += 1;
        }
        if (!usuario.deletedAt && usuario.perfil === 'Administrador') {
          acc.admins += 1;
        }
        return acc;
      },
      { active: 0, deleted: 0, duoc: 0, admins: 0 }
    );
  }, [adminUsuarios]);

  const ordersSummary = useMemo(() => {
    return orders.reduce<
      Record<string, { count: number; total: number; lastDate: string | null }>
    >((acc, order) => {
      const key = order.userEmail.toLowerCase();
      const bucket = acc[key] ?? { count: 0, total: 0, lastDate: null };
      bucket.count += 1;
      bucket.total += order.total;
      if (!bucket.lastDate) {
        bucket.lastDate = order.createdAt;
      } else {
        const current = new Date(bucket.lastDate).getTime();
        const candidate = new Date(order.createdAt).getTime();
        if (candidate > current) {
          bucket.lastDate = order.createdAt;
        }
      }
      acc[key] = bucket;
      return acc;
    }, {});
  }, [orders]);

  const filteredUsuarios = useMemo(() => {
    const query = filters.query.trim().toLowerCase();
    return adminUsuarios.filter((usuario) => {
      const isDeleted = Boolean(usuario.deletedAt);
      if (filters.view === 'active' && isDeleted) return false;
      if (filters.view === 'deleted' && !isDeleted) return false;

      if (query) {
        const haystack =
          `${usuario.run} ${usuario.nombre} ${usuario.apellidos} ${usuario.correo}`.toLowerCase();
        if (!haystack.includes(query)) {
          return false;
        }
      }

      if (filters.role && usuario.perfil !== filters.role) {
        return false;
      }

      if (filters.view === 'active' && filters.benefit !== 'all') {
        const correoLower = usuario.correo.toLowerCase();
        const hasBenefit = correoLower.endsWith('@duoc.cl');
        if (filters.benefit === 'duoc' && !hasBenefit) {
          return false;
        }
        if (filters.benefit === 'vitalicio' && !usuario.descuentoVitalicio) {
          return false;
        }
      }

      return true;
    });
  }, [adminUsuarios, filters]);

  const displayedUsuarios = useMemo(() => {
    if (filters.view === 'deleted') {
      return [...filteredUsuarios].sort((a, b) => {
        if (!a.deletedAt) return 1;
        if (!b.deletedAt) return -1;
        return (
          new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime()
        );
      });
    }
    return [...filteredUsuarios].sort((a, b) =>
      a.apellidos.localeCompare(b.apellidos, 'es')
    );
  }, [filteredUsuarios, filters.view]);

  const handleQueryChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({ ...prev, query: event.target.value }));
  };

  const handleRoleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setFilters((prev) => ({
      ...prev,
      role: event.target.value as '' | UsuarioPerfil,
    }));
  };

  const handleBenefitChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setFilters((prev) => ({
      ...prev,
      benefit: event.target.value as BenefitFilter,
    }));
  };

  const handleViewChange = (view: ViewMode) => {
    setFilters((prev) => ({
      ...prev,
      view,
      benefit: view === 'deleted' ? 'all' : prev.benefit,
    }));
  };

  const handleResetFilters = () => {
    setFilters((prev) => ({
      ...prev,
      query: '',
      role: '',
      benefit: 'all',
    }));
  };

  const handleDelete = useCallback((usuario: AdminUsuario) => {
    if (usuario.isSystem) return;
    if (typeof window === 'undefined') return;
    const confirmed = window.confirm(
      `¿Eliminar al usuario "${usuario.nombre} ${usuario.apellidos}"? Podrás restaurarlo más adelante.`
    );
    if (!confirmed) return;
    const runKey = normalizeRun(usuario.run);
    setPersistedStates((prev) => ({
      ...prev,
      [runKey]: { deletedAt: new Date().toISOString() },
    }));
  }, []);

  const handleRestore = useCallback((usuario: AdminUsuario) => {
    if (!usuario.deletedAt) return;
    if (typeof window === 'undefined') return;
    const confirmed = window.confirm(
      `¿Restaurar al usuario "${usuario.nombre} ${usuario.apellidos}"?`
    );
    if (!confirmed) return;
    const runKey = normalizeRun(usuario.run);
    setPersistedStates((prev) => {
      const next = { ...prev };
      delete next[runKey];
      return next;
    });
  }, []);

  const renderBenefitBadges = (usuario: AdminUsuario) => {
    const correoLower = usuario.correo.toLowerCase();
    const badges: ReactElement[] = [];
    if (correoLower.endsWith('@duoc.cl')) {
      badges.push(
        <span
          key="duoc"
          className={`${styles.userBadge} ${styles.userBadgeSuccess}`.trim()}
        >
          20% DUOC
        </span>
      );
    }
    if (usuario.descuentoVitalicio) {
      badges.push(
        <span
          key="vitalicio"
          className={`${styles.userBadge} ${styles.userBadgeWarning}`.trim()}
        >
          Vitalicio
        </span>
      );
    }
    if (usuario.origin === 'extra') {
      badges.push(
        <span
          key="extra"
          className={`${styles.userBadge} ${styles.userBadgeAccent}`.trim()}
        >
          Registrado online
        </span>
      );
    }
    if (usuario.isSystem) {
      badges.push(
        <span key="system" className={styles.userBadge}>
          Protegido
        </span>
      );
    }
    return badges.length > 0 ? (
      <div className={styles.userBadges}>{badges}</div>
    ) : (
      <span className={styles.productMeta}>Sin beneficios especiales</span>
    );
  };

  const renderMetadata = (usuario: AdminUsuario) => {
    const items: ReactElement[] = [];
    if (usuario.region) {
      items.push(
        <span key="region" className={styles.userMetaItem}>
          Región: {usuario.region}
        </span>
      );
    }
    if (usuario.comuna) {
      items.push(
        <span key="comuna" className={styles.userMetaItem}>
          Comuna: {usuario.comuna}
        </span>
      );
    }
    if (usuario.direccion) {
      items.push(
        <span key="direccion" className={styles.userMetaItem}>
          Dirección: {usuario.direccion}
        </span>
      );
    }
    if (usuario.createdAt) {
      const formatted = new Date(usuario.createdAt).toLocaleDateString('es-CL');
      items.push(
        <span key="creado" className={styles.userMetaItem}>
          Registrado el {formatted}
        </span>
      );
    }
    const orderInfo = ordersSummary[usuario.correo.toLowerCase()];
    if (orderInfo) {
      const lastDate = orderInfo.lastDate
        ? new Date(orderInfo.lastDate).toLocaleDateString('es-CL')
        : null;
      items.push(
        <span key="orders" className={styles.userMetaItem}>
          Pedidos: {orderInfo.count} · {formatPrice(orderInfo.total)}
        </span>
      );
      if (lastDate) {
        items.push(
          <span key="last-order" className={styles.userMetaItem}>
            Último pedido: {lastDate}
          </span>
        );
      }
    }
    return items.length > 0 ? (
      <div className={styles.userMeta}>{items}</div>
    ) : null;
  };

  return (
    <div className="container">
      <div className={styles.page}>
        <header className={styles.header}>
          <h1 className={styles.title}>Gestión de usuarios</h1>
          <p className={styles.subtitle}>
            Administra perfiles administrativos, vendedores y clientes. Puedes
            filtrar por rol, beneficios y restaurar cuentas eliminadas.
          </p>
        </header>

        <section className={styles.sectionCard}>
          <div className={styles.controlsBar}>
            <form
              className={styles.filtersForm}
              onSubmit={(event) => event.preventDefault()}
            >
              <input
                id="user-search"
                type="search"
                placeholder="Busca por RUN, nombre o correo"
                value={filters.query}
                onChange={handleQueryChange}
                className={styles.searchInput}
                aria-label="Buscar usuario"
              />
              <select
                id="user-role"
                value={filters.role}
                onChange={handleRoleChange}
                className={styles.selectInput}
                aria-label="Filtrar por rol"
              >
                <option value="">Todos los roles</option>
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
              {filters.view === 'active' && (
                <select
                  id="user-benefit"
                  value={filters.benefit}
                  onChange={handleBenefitChange}
                  className={styles.stockSelect}
                  aria-label="Filtrar por beneficios"
                >
                  <option value="all">Todos los beneficios</option>
                  <option value="duoc">Con correo DUOC (20%)</option>
                  <option value="vitalicio">Con vitalicio</option>
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
              aria-label="Vista de usuarios"
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
                Admins: <strong>{totals.admins}</strong>
              </span>
              <span>
                DUOC 20%: <strong>{totals.duoc}</strong>
              </span>
              <span>
                Eliminados: <strong>{totals.deleted}</strong>
              </span>
              <span>
                Pedidos: <strong>{orders.length}</strong>
              </span>
            </div>
          </div>

          {displayedUsuarios.length === 0 ? (
            <div className={styles.emptyResults}>
              <strong>No hay usuarios que coincidan con los filtros.</strong>
              <span>
                Revisa la pestaña de eliminados o limpia los filtros aplicados.
              </span>
            </div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">RUN</th>
                    <th scope="col">Nombre</th>
                    <th scope="col">Correo</th>
                    <th scope="col">Rol</th>
                    {filters.view === 'deleted' ? (
                      <th scope="col">Eliminado el</th>
                    ) : (
                      <th scope="col">Beneficios</th>
                    )}
                    <th scope="col" style={{ textAlign: 'right' }}>
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {displayedUsuarios.map((usuario) => (
                    <tr key={usuario.run}>
                      <td>{formatRun(usuario.run)}</td>
                      <td>
                        <div className={styles.userCell}>
                          <span className={styles.userName}>
                            {usuario.nombre} {usuario.apellidos}
                          </span>
                          {renderMetadata(usuario)}
                        </div>
                      </td>
                      <td>{usuario.correo}</td>
                      <td>{usuario.perfil}</td>
                      {filters.view === 'deleted' ? (
                        <td>
                          {usuario.deletedAt
                            ? new Date(usuario.deletedAt).toLocaleString(
                                'es-CL',
                                {
                                  dateStyle: 'medium',
                                  timeStyle: 'short',
                                }
                              )
                            : '—'}
                        </td>
                      ) : (
                        <td>{renderBenefitBadges(usuario)}</td>
                      )}
                      <td>
                        <div className={styles.tableActions}>
                          {filters.view === 'active' ? (
                            <>
                              <button
                                type="button"
                                className={
                                  usuario.isSystem
                                    ? `${styles.tableActionButton} ${styles.tableActionButtonDisabled}`.trim()
                                    : styles.tableActionButton
                                }
                                onClick={() => {
                                  if (usuario.isSystem) return;
                                  handleDelete(usuario);
                                }}
                              >
                                {usuario.isSystem ? 'Protegido' : 'Eliminar'}
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              className={`${styles.tableActionButton} ${styles.tableActionButtonSuccess}`.trim()}
                              onClick={() => handleRestore(usuario)}
                            >
                              Restaurar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Usuarios;
