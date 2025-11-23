import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
} from 'react';
import type { AuditAction, AuditEntityType, AuditEvent } from '@/types';
import {
  clearAuditEvents,
  loadAuditEvents,
  recordAuditEvent,
  subscribeToAuditLog,
} from '@/utils/audit';
import { useAuditActor } from '@/hooks/useAuditActor';
import styles from './Admin.module.css';

type ActionFilter = 'all' | AuditAction;
type EntityFilter = 'all' | AuditEntityType;

const ACTION_LABELS: Record<AuditAction, string> = {
  created: 'Creado',
  updated: 'Actualizado',
  deleted: 'Eliminado',
  restored: 'Restaurado',
  login: 'Inicio de sesión',
  logout: 'Cierre de sesión',
  registered: 'Registro',
  'status-changed': 'Cambio de estado',
  responded: 'Respuesta registrada',
  audit_export: 'Exportación de bitácora',
  audit_purge_request: 'Purga de bitácora solicitada',
  audit_purge: 'Bitácora purgada',
};

const ENTITY_LABELS: Record<AuditEntityType, string> = {
  producto: 'Producto',
  usuario: 'Usuario',
  orden: 'Orden',
  mensaje: 'Mensaje',
  categoria: 'Categoría',
  auth: 'Autenticación',
  sistema: 'Sistema',
};

const dateFormatter = new Intl.DateTimeFormat('es-CL', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const humanizeToken = (value: string): string => {
  if (!value) {
    return '—';
  }
  return value
    .split(/[_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
};

const resolveActionLabel = (action: string): string => {
  if (!action) {
    return '—';
  }
  const lower = action.toLowerCase();
  return (
    ACTION_LABELS[action] ??
    ACTION_LABELS[lower as AuditAction] ??
    humanizeToken(action)
  );
};

const resolveEntityLabel = (entityType: string): string => {
  if (!entityType) {
    return 'Sistema';
  }
  const lower = entityType.toLowerCase();
  return (
    ENTITY_LABELS[entityType] ??
    ENTITY_LABELS[lower as AuditEntityType] ??
    humanizeToken(entityType)
  );
};

const formatDate = (value: string) => {
  try {
    return dateFormatter.format(new Date(value));
  } catch (error) {
    console.warn('[audit] No se pudo formatear la fecha', error);
    return value;
  }
};

const parseDateInput = (value: string): number | null => {
  if (!value) return null;
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? null : timestamp;
};

const toIsoRangeStart = (value: string): string | undefined => {
  if (!value) {
    return undefined;
  }
  try {
    return new Date(`${value}T00:00:00`).toISOString();
  } catch {
    return undefined;
  }
};

const toIsoRangeEnd = (value: string): string | undefined => {
  if (!value) {
    return undefined;
  }
  try {
    return new Date(`${value}T23:59:59.999`).toISOString();
  } catch {
    return undefined;
  }
};

const serializeMetadata = (metadata: unknown): string => {
  if (metadata === undefined || metadata === null) {
    return '—';
  }

  if (typeof metadata === 'string') {
    const trimmed = metadata.trim();
    if (!trimmed) {
      return '—';
    }
    try {
      const parsed = JSON.parse(trimmed);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return trimmed;
    }
  }

  try {
    return JSON.stringify(metadata, null, 2);
  } catch (error) {
    console.warn('[audit] No se pudo serializar metadata', error);
    return String(metadata);
  }
};

const Auditoria: React.FC = () => {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [actionFilter, setActionFilter] = useState<ActionFilter>('all');
  const [entityFilter, setEntityFilter] = useState<EntityFilter>('all');
  const [query, setQuery] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const actor = useAuditActor();

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await loadAuditEvents({
        action: actionFilter !== 'all' ? actionFilter : undefined,
        entityType: entityFilter !== 'all' ? entityFilter : undefined,
        from: toIsoRangeStart(fromDate),
        to: toIsoRangeEnd(toDate),
        limit: 250,
      });
      setEvents(data);
    } catch (error) {
      console.warn('[audit] Error al cargar eventos', error);
      setErrorMessage(
        'No se pudo cargar la bitácora. Intenta nuevamente más tarde.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [actionFilter, entityFilter, fromDate, toDate]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    const unsubscribe = subscribeToAuditLog(() => {
      fetchEvents();
    });
    return () => unsubscribe?.();
  }, [fetchEvents]);

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

  const handleActionFilterChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setActionFilter(event.target.value as ActionFilter);
  };

  const handleEntityFilterChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setEntityFilter(event.target.value as EntityFilter);
  };

  const handleQueryChange = (event: ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
  };

  const handleFromDateChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFromDate(event.target.value);
  };

  const handleToDateChange = (event: ChangeEvent<HTMLInputElement>) => {
    setToDate(event.target.value);
  };

  const handleResetFilters = () => {
    setActionFilter('all');
    setEntityFilter('all');
    setQuery('');
    setFromDate('');
    setToDate('');
    setErrorMessage(null);
    setStatusMessage(null);
  };

  const filteredEvents = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const fromTs = parseDateInput(fromDate);
    const toTs = parseDateInput(toDate);

    return events.filter((event) => {
      if (actionFilter !== 'all') {
        const normalizedAction = (event.action ?? '').toLowerCase();
        if (normalizedAction !== actionFilter.toLowerCase()) {
          return false;
        }
      }
      if (entityFilter !== 'all') {
        const normalizedEntity = (event.entity.type ?? '').toLowerCase();
        if (normalizedEntity !== entityFilter.toLowerCase()) {
          return false;
        }
      }

      const eventTs = Date.parse(event.timestamp);
      if (fromTs && eventTs < fromTs) {
        return false;
      }
      if (toTs && eventTs > toTs + 86_399_999) {
        return false;
      }

      if (!needle) {
        return true;
      }

      const haystack = [
        event.summary,
        event.actor?.name,
        event.actor?.email,
        event.entity?.name,
        event.entity?.context,
        typeof event.metadata === 'string' ? event.metadata : '',
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(needle);
    });
  }, [actionFilter, entityFilter, events, fromDate, query, toDate]);

  const totals = useMemo(() => {
    const byAction = filteredEvents.reduce<Record<string, number>>(
      (acc, event) => {
        const key = (event.action ?? '').toLowerCase();
        if (!key) {
          return acc;
        }
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      },
      {}
    );

    return {
      total: filteredEvents.length,
      byAction,
    };
  }, [filteredEvents]);

  const getActionCount = (key: string) =>
    totals.byAction[key.toLowerCase()] ?? 0;
  const changeEventsCount =
    getActionCount('created') +
    getActionCount('updated') +
    getActionCount('deleted') +
    getActionCount('restored');

  const handleExport = useCallback(async () => {
    if (filteredEvents.length === 0) {
      return;
    }

    if (typeof window === 'undefined') {
      return;
    }

    const payload = filteredEvents.map((event) => ({
      id: event.id,
      timestamp: event.timestamp,
      action: event.action,
      actor: event.actor,
      entity: event.entity,
      summary: event.summary,
      metadata: event.metadata,
      severity: event.severity,
    }));

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement('a');
    link.href = url;
    link.download = `audit-log-${Date.now()}.json`;
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
    window.setTimeout(() => URL.revokeObjectURL(url), 0);

    setStatusMessage('Descarga de la bitácora generada correctamente.');

    await recordAuditEvent({
      action: 'audit_export',
      summary: 'Bitácora exportada como JSON',
      entity: {
        type: 'sistema',
        context: 'audit-log',
      },
      metadata: {
        records: filteredEvents.length,
        filters: {
          action: actionFilter,
          entity: entityFilter,
          query: query.trim() || null,
          fromDate: fromDate || null,
          toDate: toDate || null,
        },
      },
      actor,
      severity: 'low',
    });
  }, [
    actionFilter,
    actor,
    entityFilter,
    filteredEvents,
    fromDate,
    query,
    toDate,
  ]);

  const handleClear = useCallback(async () => {
    if (typeof window === 'undefined') {
      return;
    }
    const confirmed = window.confirm(
      '¿Seguro que deseas limpiar la bitácora? Esta acción elimina el historial actual.'
    );
    if (!confirmed) {
      return;
    }
    try {
      await clearAuditEvents();
      setStatusMessage('Bitácora limpiada correctamente.');
      await recordAuditEvent({
        action: 'audit_purge_request',
        summary: 'Bitácora limpiada manualmente desde el panel',
        entity: {
          type: 'sistema',
          context: 'audit-log',
        },
        actor,
        severity: 'medium',
      });
      await fetchEvents();
    } catch (error) {
      console.warn('[audit] Error al limpiar la bitácora', error);
      setErrorMessage(
        'No se pudo limpiar la bitácora. Verifica tu sesión e inténtalo de nuevo.'
      );
    }
  }, [actor, fetchEvents]);

  return (
    <div className="container">
      <div className={styles.page}>
        <header className={styles.header}>
          <h1 className={styles.title}>Bitácora de auditoría</h1>
          <p className={styles.subtitle}>
            Revisa cada acción relevante realizada en el panel de
            administración. Filtra por tipo de entidad, acción o rango de fechas
            y exporta los registros cuando necesites compartirlos.
          </p>
        </header>

        {statusMessage && (
          <div className={styles.statusBanner}>{statusMessage}</div>
        )}
        {errorMessage && (
          <div className={styles.statusBannerError} role="alert">
            {errorMessage}
          </div>
        )}

        <section className={styles.sectionCard}>
          <div className={styles.controlsBar}>
            <div className={styles.filtersForm}>
              <input
                type="search"
                value={query}
                onChange={handleQueryChange}
                placeholder="Buscar por resumen, actor o contexto"
                className={styles.searchInput}
                aria-label="Buscar en la bitácora"
              />

              <select
                value={entityFilter}
                onChange={handleEntityFilterChange}
                className={styles.selectInput}
                aria-label="Filtrar por entidad"
              >
                <option value="all">Todas las entidades</option>
                {Object.entries(ENTITY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>

              <select
                value={actionFilter}
                onChange={handleActionFilterChange}
                className={styles.selectInput}
                aria-label="Filtrar por acción"
              >
                <option value="all">Todas las acciones</option>
                {Object.entries(ACTION_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>

              <input
                type="date"
                value={fromDate}
                onChange={handleFromDateChange}
                className={styles.dateInput}
                aria-label="Filtrar desde fecha"
              />

              <input
                type="date"
                value={toDate}
                onChange={handleToDateChange}
                className={styles.dateInput}
                aria-label="Filtrar hasta fecha"
              />

              <button
                type="button"
                onClick={handleResetFilters}
                className={styles.tableActionButton}
              >
                Limpiar filtros
              </button>
            </div>

            <div className={styles.actionsRow}>
              <button
                type="button"
                onClick={handleExport}
                className={styles.primaryAction}
                disabled={filteredEvents.length === 0 || isLoading}
              >
                Exportar JSON
              </button>
              <button
                type="button"
                onClick={handleClear}
                className={`${styles.secondaryAction} ${styles.dangerOutline}`}
                disabled={isLoading || events.length === 0}
              >
                Limpiar bitácora
              </button>
            </div>
          </div>

          <div className={styles.resultsSummary}>
            <span>
              Mostrando <strong>{filteredEvents.length}</strong> de{' '}
              {events.length} eventos registrados
            </span>
            <span>
              Inicio de sesión: <strong>{getActionCount('login')}</strong>
            </span>
            <span>
              Cambios: <strong>{changeEventsCount}</strong>
            </span>
          </div>

          {isLoading ? (
            <div className={styles.emptyState}>
              <strong>Cargando bitácora...</strong>
              <span>Esto puede tomar unos segundos.</span>
            </div>
          ) : events.length === 0 ? (
            <div className={styles.emptyState}>
              <strong>Aún no se registran eventos.</strong>
              <span>
                Las acciones del panel quedarán registradas aquí
                automáticamente.
              </span>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className={styles.emptyResults}>
              <strong>No hay eventos con los filtros actuales.</strong>
              <span>Prueba con otro término o ajusta el rango de fechas.</span>
            </div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">Fecha</th>
                    <th scope="col">Actor</th>
                    <th scope="col">Acción</th>
                    <th scope="col">Entidad</th>
                    <th scope="col">Resumen</th>
                    <th scope="col">Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.map((event) => (
                    <tr key={event.id}>
                      <td>{formatDate(event.timestamp)}</td>
                      <td>
                        <div className={styles.auditActor}>
                          <span className={styles.auditActorName}>
                            {event.actor.name}
                          </span>
                          {event.actor.email && (
                            <span className={styles.auditActorMeta}>
                              {event.actor.email}
                            </span>
                          )}
                          {event.actor.role && (
                            <span className={styles.auditActorMeta}>
                              Rol: {event.actor.role}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={styles.auditBadge}>
                          {resolveActionLabel(event.action)}
                        </span>
                      </td>
                      <td>
                        <div className={styles.auditEntity}>
                          <span className={styles.auditEntityType}>
                            {resolveEntityLabel(event.entity.type)}
                          </span>
                          {event.entity.name && (
                            <span className={styles.auditEntityName}>
                              {event.entity.name}
                            </span>
                          )}
                          {event.entity.context && (
                            <span className={styles.auditEntityMeta}>
                              {event.entity.context}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>{event.summary}</td>
                      <td>
                        <pre className={styles.auditMetadata}>
                          {serializeMetadata(event.metadata)}
                        </pre>
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

export default Auditoria;
