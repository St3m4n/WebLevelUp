import {
  type ChangeEvent,
  type FormEvent,
  type ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { usuarios } from '@/data/usuarios';
import { regiones } from '@/data/regionesComunas';
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

type StatusState = { kind: 'success' | 'error'; message: string };

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
const EXTRA_USERS_EVENT = 'levelup:extra-users-updated';

type UserFormValues = {
  run: string;
  nombre: string;
  apellidos: string;
  correo: string;
  perfil: UsuarioPerfil;
  fechaNacimiento: string;
  region: string;
  comuna: string;
  direccion: string;
  descuentoVitalicio: boolean;
};

type UserFormErrors = Partial<Record<keyof UserFormValues, string>>;

type UserFormState = {
  isOpen: boolean;
  mode: 'create' | 'edit';
  initial?: AdminUsuario;
};

const allowedRoles: UsuarioPerfil[] = ['Administrador', 'Vendedor', 'Cliente'];

const defaultUserFormValues: UserFormValues = {
  run: '',
  nombre: '',
  apellidos: '',
  correo: '',
  perfil: 'Cliente',
  fechaNacimiento: '',
  region: '',
  comuna: '',
  direccion: '',
  descuentoVitalicio: false,
};

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

const persistExtraUsuarios = (records: ExtraUsuario[]) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(EXTRA_USERS_STORAGE_KEY, JSON.stringify(records));
  window.dispatchEvent(new CustomEvent(EXTRA_USERS_EVENT));
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
  const [formState, setFormState] = useState<UserFormState>({
    isOpen: false,
    mode: 'create',
  });
  const [formValues, setFormValues] = useState<UserFormValues>(
    defaultUserFormValues
  );
  const [formErrors, setFormErrors] = useState<UserFormErrors>({});
  const [status, setStatus] = useState<StatusState | null>(null);

  useEffect(() => {
    if (!status || typeof window === 'undefined') return undefined;
    const timeout = window.setTimeout(() => setStatus(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [status]);

  const updateExtraUsuarios = useCallback(
    (updater: (current: ExtraUsuario[]) => ExtraUsuario[]) => {
      setExtraUsuarios((prev) => {
        const next = updater(prev);
        persistExtraUsuarios(next);
        return next;
      });
    },
    []
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleExtraUsersUpdate = () => {
      setExtraUsuarios(loadExtraUsuarios());
    };
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
    window.addEventListener(EXTRA_USERS_EVENT, handleExtraUsersUpdate);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(EXTRA_USERS_EVENT, handleExtraUsersUpdate);
      window.removeEventListener('storage', onStorage);
    };
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

  const regionOptions = useMemo(
    () => regiones.map((region) => region.nombre),
    []
  );
  const comunasForRegion = useMemo(() => {
    if (!formValues.region) return [];
    const region = regiones.find(
      (candidate) => candidate.nombre === formValues.region
    );
    return region ? region.comunas.map((comuna) => comuna.nombre) : [];
  }, [formValues.region]);

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

  const handleOpenCreate = () => {
    setFormState({ isOpen: true, mode: 'create' });
    setFormValues(defaultUserFormValues);
    setFormErrors({});
  };

  const handleOpenEdit = (usuario: AdminUsuario) => {
    if (usuario.isSystem) return;
    setFormState({ isOpen: true, mode: 'edit', initial: usuario });
    setFormValues({
      run: formatRun(usuario.run),
      nombre: usuario.nombre,
      apellidos: usuario.apellidos,
      correo: usuario.correo,
      perfil: usuario.perfil,
      fechaNacimiento: usuario.fechaNacimiento ?? '',
      region: usuario.region,
      comuna: usuario.comuna,
      direccion: usuario.direccion,
      descuentoVitalicio: usuario.descuentoVitalicio,
    });
    setFormErrors({});
  };

  const handleCloseForm = () => {
    setFormState({ isOpen: false, mode: 'create' });
    setFormValues(defaultUserFormValues);
    setFormErrors({});
  };

  const validateForm = useCallback(
    (values: UserFormValues): UserFormErrors => {
      const errors: UserFormErrors = {};
      const normalizedRun = normalizeRun(values.run);
      const runIsValid = /^[0-9]{7,8}[0-9K]$/i.test(normalizedRun);
      if (!runIsValid) {
        errors.run = 'Ingresa un RUN válido.';
      }

      if (!values.nombre.trim()) {
        errors.nombre = 'Ingresa un nombre.';
      }

      if (!values.apellidos.trim()) {
        errors.apellidos = 'Ingresa los apellidos.';
      }

      if (!allowedRoles.includes(values.perfil)) {
        errors.perfil = 'Selecciona un rol válido.';
      }

      const normalizedCorreo = normalizeCorreo(values.correo);
      const correoRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!correoRegex.test(normalizedCorreo)) {
        errors.correo = 'Ingresa un correo válido.';
      }

      const initialRun = formState.initial?.run ?? null;
      if (
        runIsValid &&
        adminUsuarios.some(
          (usuario) =>
            usuario.run === normalizedRun && usuario.run !== initialRun
        )
      ) {
        errors.run = 'Ya existe un usuario con ese RUN.';
      }

      const initialCorreo = formState.initial?.correo ?? null;
      if (
        correoRegex.test(normalizedCorreo) &&
        adminUsuarios.some(
          (usuario) =>
            usuario.correo === normalizedCorreo &&
            usuario.correo !== initialCorreo
        )
      ) {
        errors.correo = 'Ya existe un usuario con ese correo.';
      }

      if (values.comuna && !values.region) {
        errors.region = 'Selecciona una región para la comuna elegida.';
      }

      if (values.fechaNacimiento) {
        const parsed = new Date(values.fechaNacimiento);
        if (Number.isNaN(parsed.getTime())) {
          errors.fechaNacimiento = 'Ingresa una fecha válida.';
        } else if (parsed.getTime() > Date.now()) {
          errors.fechaNacimiento = 'La fecha no puede estar en el futuro.';
        }
      }

      return errors;
    },
    [adminUsuarios, formState.initial]
  );

  const handleFormFieldChange = (
    event: ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = event.target;
    setFormValues((prev) => {
      if (name === 'region') {
        return { ...prev, region: value, comuna: '' };
      }
      return { ...prev, [name]: value };
    });
    setFormErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleCheckboxChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: checked }));
    setFormErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmitForm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validateForm(formValues);
    if (Object.keys(validation).length > 0) {
      setFormErrors(validation);
      return;
    }

    const normalizedRun = normalizeRun(formValues.run);
    const normalizedCorreo = normalizeCorreo(formValues.correo);
    const existingExtra = extraUsuarios.find(
      (usuario) => usuario.run === normalizedRun
    );
    const timestamp = new Date().toISOString();
    const createdAt =
      formState.mode === 'create'
        ? timestamp
        : (existingExtra?.createdAt ??
          formState.initial?.createdAt ??
          timestamp);

    const record: ExtraUsuario = {
      run: normalizedRun,
      nombre: formValues.nombre.trim(),
      apellidos: formValues.apellidos.trim(),
      correo: normalizedCorreo,
      perfil: formValues.perfil,
      fechaNacimiento: formValues.fechaNacimiento || null,
      region: formValues.region.trim(),
      comuna: formValues.comuna.trim(),
      direccion: formValues.direccion.trim(),
      descuentoVitalicio: formValues.descuentoVitalicio,
      isSystem: formState.initial?.isSystem ?? false,
      passwordHash:
        existingExtra?.passwordHash ??
        formState.initial?.passwordHash ??
        undefined,
      passwordSalt:
        existingExtra?.passwordSalt ??
        formState.initial?.passwordSalt ??
        undefined,
      createdAt,
    };

    try {
      updateExtraUsuarios((prev) => {
        const next = prev.filter((usuario) => usuario.run !== normalizedRun);
        next.push(record);
        return next;
      });
      setStatus({
        kind: 'success',
        message:
          formState.mode === 'create'
            ? `Usuario "${record.nombre} ${record.apellidos}" registrado.`
            : `Usuario "${record.nombre} ${record.apellidos}" actualizado.`,
      });
      handleCloseForm();
    } catch (error) {
      console.warn('No se pudo guardar el usuario', error);
      setStatus({
        kind: 'error',
        message: 'No se pudo guardar el usuario. Inténtalo nuevamente.',
      });
    }
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
    setStatus({
      kind: 'success',
      message: `Usuario "${usuario.nombre} ${usuario.apellidos}" marcado como eliminado.`,
    });
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
    setStatus({
      kind: 'success',
      message: `Usuario "${usuario.nombre} ${usuario.apellidos}" restaurado.`,
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

        {status && (
          <div
            className={
              status.kind === 'error'
                ? styles.statusBannerError
                : styles.statusBanner
            }
          >
            {status.message}
          </div>
        )}

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
            <button
              type="button"
              className={styles.primaryAction}
              onClick={handleOpenCreate}
            >
              Nuevo usuario
            </button>
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
                                  handleOpenEdit(usuario);
                                }}
                                disabled={usuario.isSystem}
                              >
                                Editar
                              </button>
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
                                disabled={usuario.isSystem}
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

        {formState.isOpen && (
          <div className={styles.detailOverlay} role="dialog" aria-modal="true">
            <div className={styles.detailDialog} style={{ maxWidth: '720px' }}>
              <header className={styles.detailHeader}>
                <h2>
                  {formState.mode === 'create'
                    ? 'Registrar nuevo usuario'
                    : `Editar "${formState.initial?.nombre ?? ''} ${
                        formState.initial?.apellidos ?? ''
                      }"`}
                </h2>
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
                <div className={styles.formGrid}>
                  <label className={styles.formControl}>
                    <span>RUN</span>
                    <input
                      name="run"
                      value={formValues.run}
                      onChange={handleFormFieldChange}
                      placeholder="11222333-K"
                      readOnly={formState.mode === 'edit'}
                      required
                      aria-invalid={Boolean(formErrors.run)}
                    />
                    {formErrors.run && (
                      <span className={styles.formError}>{formErrors.run}</span>
                    )}
                  </label>

                  <label className={styles.formControl}>
                    <span>Nombre</span>
                    <input
                      name="nombre"
                      value={formValues.nombre}
                      onChange={handleFormFieldChange}
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
                    <span>Apellidos</span>
                    <input
                      name="apellidos"
                      value={formValues.apellidos}
                      onChange={handleFormFieldChange}
                      required
                      aria-invalid={Boolean(formErrors.apellidos)}
                    />
                    {formErrors.apellidos && (
                      <span className={styles.formError}>
                        {formErrors.apellidos}
                      </span>
                    )}
                  </label>

                  <label className={styles.formControl}>
                    <span>Correo</span>
                    <input
                      name="correo"
                      type="email"
                      value={formValues.correo}
                      onChange={handleFormFieldChange}
                      inputMode="email"
                      required
                      aria-invalid={Boolean(formErrors.correo)}
                    />
                    {formErrors.correo && (
                      <span className={styles.formError}>
                        {formErrors.correo}
                      </span>
                    )}
                  </label>

                  <label className={styles.formControl}>
                    <span>Rol</span>
                    <select
                      name="perfil"
                      value={formValues.perfil}
                      onChange={handleFormFieldChange}
                      required
                      aria-invalid={Boolean(formErrors.perfil)}
                    >
                      {allowedRoles.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                    {formErrors.perfil && (
                      <span className={styles.formError}>
                        {formErrors.perfil}
                      </span>
                    )}
                  </label>

                  <label className={styles.formControl}>
                    <span>Fecha de nacimiento</span>
                    <input
                      name="fechaNacimiento"
                      type="date"
                      value={formValues.fechaNacimiento}
                      onChange={handleFormFieldChange}
                      aria-invalid={Boolean(formErrors.fechaNacimiento)}
                    />
                    {formErrors.fechaNacimiento && (
                      <span className={styles.formError}>
                        {formErrors.fechaNacimiento}
                      </span>
                    )}
                  </label>

                  <label className={styles.formControl}>
                    <span>Región</span>
                    <select
                      name="region"
                      value={formValues.region}
                      onChange={handleFormFieldChange}
                      aria-invalid={Boolean(formErrors.region)}
                    >
                      <option value="">Selecciona una región</option>
                      {regionOptions.map((region) => (
                        <option key={region} value={region}>
                          {region}
                        </option>
                      ))}
                    </select>
                    {formErrors.region && (
                      <span className={styles.formError}>
                        {formErrors.region}
                      </span>
                    )}
                  </label>

                  <label className={styles.formControl}>
                    <span>Comuna</span>
                    <select
                      name="comuna"
                      value={formValues.comuna}
                      onChange={handleFormFieldChange}
                      disabled={!formValues.region}
                    >
                      <option value="">
                        {formValues.region
                          ? 'Selecciona una comuna'
                          : 'Elige una región primero'}
                      </option>
                      {comunasForRegion.map((comuna) => (
                        <option key={comuna} value={comuna}>
                          {comuna}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label
                    className={styles.formControl}
                    style={{ gridColumn: '1 / -1' }}
                  >
                    <span>Dirección</span>
                    <textarea
                      name="direccion"
                      value={formValues.direccion}
                      onChange={handleFormFieldChange}
                      rows={3}
                    />
                  </label>

                  <div
                    className={styles.formControl}
                    style={{ gridColumn: '1 / -1' }}
                  >
                    <span>Beneficios</span>
                    <label className={styles.checkboxControl}>
                      <input
                        name="descuentoVitalicio"
                        type="checkbox"
                        checked={formValues.descuentoVitalicio}
                        onChange={handleCheckboxChange}
                      />
                      <span>Aplicar descuento vitalicio permanente</span>
                    </label>
                  </div>
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
                      ? 'Registrar usuario'
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

export default Usuarios;
