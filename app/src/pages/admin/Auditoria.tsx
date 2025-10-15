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

const serializeMetadata = (metadata: unknown): string => {
  if (metadata === undefined || metadata === null) {
    return '—';
  }

  try {
    return JSON.stringify(metadata, null, 2);
  } catch (error) {
    console.warn('[audit] No se pudo serializar metadata', error);
    return String(metadata);
  }
};

const Auditoria: React.FC = () => {
  const [events, setEvents] = useState<AuditEvent[]>(() => loadAuditEvents());
  const [actionFilter, setActionFilter] = useState<ActionFilter>('all');
  const [entityFilter, setEntityFilter] = useState<EntityFilter>('all');
  const [query, setQuery] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  useEffect(() => {
    const unsubscribe = subscribeToAuditLog(() => {
      setEvents(loadAuditEvents());
    });
    return () => unsubscribe?.();
  }, []);

  const actor = useAuditActor();

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
  };

  const filteredEvents = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const fromTs = parseDateInput(fromDate);
    const toTs = parseDateInput(toDate);

    return events.filter((event) => {
      if (actionFilter !== 'all' && event.action !== actionFilter) {
        return false;
      }
      if (entityFilter !== 'all' && event.entity.type !== entityFilter) {
        return false;
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
    const byAction = filteredEvents.reduce<Record<AuditAction, number>>(
      (acc, event) => {
        acc[event.action] = (acc[event.action] ?? 0) + 1;
        return acc;
      },
      {
        created: 0,
        updated: 0,
        deleted: 0,
        restored: 0,
        login: 0,
        logout: 0,
        registered: 0,
        'status-changed': 0,
        responded: 0,
      }
    );

    return {
      total: filteredEvents.length,
      byAction,
    };
  }, [filteredEvents]);

  const handleExport = useCallback(() => {
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

    recordAuditEvent({
      action: 'created',
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

  const handleClear = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const confirmed = window.confirm(
      '¿Seguro que deseas limpiar la bitácora? Esta acción elimina el historial actual.'
    );
    if (!confirmed) {
      return;
    }
    clearAuditEvents();
    recordAuditEvent({
      action: 'deleted',
      summary: 'Bitácora limpiada manualmente',
      entity: {
        type: 'sistema',
        context: 'audit-log',
      },
      actor,
    });
  }, [actor]);

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
                disabled={filteredEvents.length === 0}
              >
                Exportar JSON
              </button>
              <button
                type="button"
                onClick={handleClear}
                className={`${styles.secondaryAction} ${styles.dangerOutline}`}
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
              Inicio de sesión: <strong>{totals.byAction.login}</strong>
            </span>
            <span>
              Cambios:{' '}
              <strong>
                {totals.byAction.created +
                  totals.byAction.updated +
                  totals.byAction.deleted +
                  totals.byAction.restored}
              </strong>
            </span>
          </div>

          {events.length === 0 ? (
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
                          {ACTION_LABELS[event.action] ?? event.action}
                        </span>
                      </td>
                      <td>
                        <div className={styles.auditEntity}>
                          <span className={styles.auditEntityType}>
                            {ENTITY_LABELS[event.entity.type] ??
                              event.entity.type}
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
