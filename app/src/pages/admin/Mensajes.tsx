import {
  type ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ContactMessage, ContactMessageStatus } from '@/types';
import {
  loadMessages,
  MESSAGE_STORAGE_KEYS,
  subscribeToMessages,
  updateMessage,
  updateMessageStatus,
} from '@/utils/messages';
import { useAuditActor } from '@/hooks/useAuditActor';
import { recordAuditEvent } from '@/utils/audit';
import styles from './Admin.module.css';

type StatusFilter = 'all' | ContactMessageStatus;

type Feedback =
  | { type: 'success'; message: string }
  | { type: 'error'; message: string };

const STATUS_LABELS: Record<ContactMessageStatus, string> = {
  pendiente: 'Pendiente',
  respondido: 'Respondido',
};

const dateFormatter = new Intl.DateTimeFormat('es-CL', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const formatDate = (value?: string) => {
  if (!value) return '—';
  try {
    return dateFormatter.format(new Date(value));
  } catch (error) {
    console.warn('No se pudo formatear la fecha', error);
    return value;
  }
};

const buildMailtoHref = (message: Pick<ContactMessage, 'email' | 'asunto'>) => {
  const subject = `Re: ${message.asunto}`;
  return `mailto:${encodeURIComponent(message.email)}?subject=${encodeURIComponent(subject)}`;
};

const Mensajes: React.FC = () => {
  const [messages, setMessages] = useState<ContactMessage[]>(() =>
    loadMessages()
  );
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [responseDraft, setResponseDraft] = useState('');
  const [feedback, setFeedback] = useState<Feedback>();
  const [isSaving, setIsSaving] = useState(false);
  const auditActor = useAuditActor();

  const logMessageEvent = useCallback(
    (
      action: 'updated' | 'responded' | 'status-changed',
      message: ContactMessage,
      summary: string,
      metadata?: unknown
    ) => {
      recordAuditEvent({
        action,
        summary,
        entity: {
          type: 'mensaje',
          id: message.id,
          name: message.email,
          context: message.asunto,
        },
        metadata,
        actor: auditActor,
      });
    },
    [auditActor]
  );

  useEffect(() => {
    const unsubscribe = subscribeToMessages(() => {
      setMessages(loadMessages());
    });
    return () => {
      unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onStorage = (event: StorageEvent) => {
      if (event.key === MESSAGE_STORAGE_KEYS.key) {
        setMessages(loadMessages());
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const filteredMessages = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return messages.filter((message) => {
      if (statusFilter !== 'all' && message.status !== statusFilter) {
        return false;
      }
      if (!needle) return true;
      const haystack = [
        message.nombre,
        message.email,
        message.asunto,
        message.mensaje,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [messages, query, statusFilter]);

  const totals = useMemo(() => {
    const pendientes = messages.filter(
      (message) => message.status === 'pendiente'
    ).length;
    const respondidos = messages.filter(
      (message) => message.status === 'respondido'
    ).length;
    return {
      total: messages.length,
      pendientes,
      respondidos,
    };
  }, [messages]);

  const selectedMessage = useMemo(() => {
    return messages.find((message) => message.id === selectedId) ?? null;
  }, [messages, selectedId]);

  useEffect(() => {
    if (!selectedMessage) {
      setResponseDraft('');
      return;
    }
    setResponseDraft(selectedMessage.respuesta ?? '');
  }, [selectedMessage]);

  const handleCloseDetail = useCallback(() => {
    setSelectedId(null);
    setResponseDraft('');
    setFeedback(undefined);
  }, []);

  useEffect(() => {
    if (!selectedMessage) return;
    if (typeof document === 'undefined') return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        handleCloseDetail();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [handleCloseDetail, selectedMessage]);

  useEffect(() => {
    if (selectedId && !selectedMessage) {
      setSelectedId(null);
      setResponseDraft('');
    }
  }, [selectedId, selectedMessage]);

  const handleQueryChange = (event: ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
  };

  const handleStatusChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value as StatusFilter;
    setStatusFilter(value);
  };

  const handleClearFilters = () => {
    setQuery('');
    setStatusFilter('all');
  };

  const handleOpenDetail = (id: string) => {
    setSelectedId(id);
    setFeedback(undefined);
  };

  const refreshMessages = () => {
    setMessages(loadMessages());
  };

  const handleSaveDraft = () => {
    if (!selectedMessage) return;
    const trimmed = responseDraft.trim();
    const current = (selectedMessage.respuesta ?? '').trim();
    if (trimmed === current) {
      setFeedback({
        type: 'error',
        message: 'No hay cambios para guardar en la respuesta.',
      });
      return;
    }

    setIsSaving(true);
    setFeedback(undefined);
    try {
      const updated = updateMessage(selectedMessage.id, (message) => ({
        ...message,
        respuesta: trimmed,
      }));
      if (!updated) {
        throw new Error('Mensaje no encontrado');
      }
      setResponseDraft(trimmed);
      refreshMessages();
      setFeedback({
        type: 'success',
        message: 'Respuesta guardada en el registro del mensaje.',
      });
      logMessageEvent(
        'updated',
        updated,
        `Respuesta actualizada para "${updated.asunto}"`,
        {
          longitudRespuesta: trimmed.length,
        }
      );
    } catch (error) {
      console.error('No se pudo guardar la respuesta del mensaje', error);
      setFeedback({
        type: 'error',
        message: 'No pudimos guardar la respuesta. Intenta nuevamente.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleMarkResponded = () => {
    if (!selectedMessage) return;
    const trimmed = responseDraft.trim();

    setIsSaving(true);
    setFeedback(undefined);
    try {
      const updated = updateMessage(selectedMessage.id, (message) => ({
        ...message,
        respuesta: trimmed,
        status: 'respondido',
      }));
      if (!updated) {
        throw new Error('Mensaje no encontrado');
      }
      setResponseDraft(trimmed);
      refreshMessages();
      setFeedback({
        type: 'success',
        message: 'Mensaje marcado como respondido.',
      });
      logMessageEvent(
        'responded',
        updated,
        `Mensaje "${updated.asunto}" marcado como respondido`,
        {
          respuesta: trimmed || null,
        }
      );
      if (statusFilter === 'pendiente') {
        handleCloseDetail();
      }
    } catch (error) {
      console.error('No se pudo marcar el mensaje como respondido', error);
      setFeedback({
        type: 'error',
        message: 'No pudimos actualizar el estado. Intenta nuevamente.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleMarkPending = () => {
    if (!selectedMessage) return;

    setIsSaving(true);
    setFeedback(undefined);
    try {
      const updated = updateMessageStatus(selectedMessage.id, 'pendiente');
      if (!updated) {
        throw new Error('Mensaje no encontrado');
      }
      refreshMessages();
      setFeedback({
        type: 'success',
        message: 'El mensaje volvió al estado pendiente.',
      });
      logMessageEvent(
        'status-changed',
        updated,
        `Mensaje "${updated.asunto}" regresó a pendiente`
      );
      if (statusFilter === 'respondido') {
        handleCloseDetail();
      }
    } catch (error) {
      console.error('No se pudo revertir el estado del mensaje', error);
      setFeedback({
        type: 'error',
        message: 'No pudimos actualizar el estado. Intenta nuevamente.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const isDraftDirty = selectedMessage
    ? responseDraft.trim() !== (selectedMessage.respuesta ?? '').trim()
    : false;

  return (
    <div className="container">
      <div className={styles.page}>
        <header className={styles.header}>
          <h1 className={styles.title}>Mensajes de contacto</h1>
          <p className={styles.subtitle}>
            Gestiona las consultas enviadas desde el formulario público. Marca
            los mensajes respondidos y registra notas internas para el equipo.
          </p>
        </header>

        {feedback && (
          <div
            className={
              feedback.type === 'success'
                ? styles.statusBanner
                : styles.statusBannerError
            }
            role="status"
            aria-live="polite"
          >
            {feedback.message}
          </div>
        )}

        <section className={styles.sectionCard}>
          <div className={styles.controlsBar}>
            <div className={styles.filtersForm}>
              <input
                type="search"
                value={query}
                onChange={handleQueryChange}
                placeholder="Buscar por nombre, correo o asunto"
                className={styles.searchInput}
                aria-label="Buscar mensajes"
              />

              <select
                value={statusFilter}
                onChange={handleStatusChange}
                className={styles.selectInput}
                aria-label="Filtrar por estado"
              >
                <option value="all">Todos los estados</option>
                <option value="pendiente">Pendientes</option>
                <option value="respondido">Respondidos</option>
              </select>

              <button
                type="button"
                className={styles.tableActionButton}
                onClick={handleClearFilters}
              >
                Limpiar filtros
              </button>
            </div>

            <div className={styles.resultsSummary}>
              <span>
                Mostrando <strong>{filteredMessages.length}</strong> de{' '}
                {totals.total} mensajes
              </span>
              <span>
                Pendientes: <strong>{totals.pendientes}</strong>
              </span>
              <span>
                Respondidos: <strong>{totals.respondidos}</strong>
              </span>
            </div>
          </div>

          {messages.length === 0 ? (
            <div className={styles.emptyState}>
              <strong>Aún no hay mensajes registrados.</strong>
              <span>
                Invita a la comunidad a usar el formulario de contacto para ver
                sus consultas en esta sección.
              </span>
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className={styles.emptyResults}>
              <strong>Sin resultados con los filtros actuales.</strong>
              <span>Prueba con otro término de búsqueda o estado.</span>
            </div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">Recibido</th>
                    <th scope="col">Nombre</th>
                    <th scope="col">Correo</th>
                    <th scope="col">Asunto</th>
                    <th scope="col">Estado</th>
                    <th scope="col" className="visually-hidden">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMessages.map((message) => {
                    const badgeClass =
                      message.status === 'respondido'
                        ? `${styles.statusBadge} ${styles.statusBadgeHealthy}`
                        : `${styles.statusBadge} ${styles.statusBadgeCritical}`;

                    return (
                      <tr key={message.id}>
                        <td>{formatDate(message.createdAt)}</td>
                        <td>{message.nombre}</td>
                        <td>
                          <a href={buildMailtoHref(message)}>{message.email}</a>
                        </td>
                        <td>{message.asunto}</td>
                        <td>
                          <span className={badgeClass}>
                            {STATUS_LABELS[message.status]}
                          </span>
                        </td>
                        <td className={styles.tableActions}>
                          <button
                            type="button"
                            className={styles.tableActionButton}
                            onClick={() => handleOpenDetail(message.id)}
                          >
                            Ver detalle
                          </button>
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

      {selectedMessage && (
        <div
          className={styles.detailOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="mensaje-detalle-titulo"
        >
          <div className={styles.detailDialog}>
            <header className={styles.detailHeader}>
              <div>
                <h2 id="mensaje-detalle-titulo" className={styles.detailTitle}>
                  {selectedMessage.asunto}
                </h2>
                <div className={styles.detailHeaderMeta}>
                  <span>{selectedMessage.nombre}</span>
                  <a href={buildMailtoHref(selectedMessage)}>
                    {selectedMessage.email}
                  </a>
                </div>
              </div>

              <div>
                <span
                  className={
                    selectedMessage.status === 'respondido'
                      ? `${styles.statusBadge} ${styles.statusBadgeHealthy} ${styles.detailStatusBadge}`
                      : `${styles.statusBadge} ${styles.statusBadgeCritical} ${styles.detailStatusBadge}`
                  }
                >
                  {STATUS_LABELS[selectedMessage.status]}
                </span>
                <button
                  type="button"
                  className={styles.detailCloseButton}
                  onClick={handleCloseDetail}
                  aria-label="Cerrar detalle"
                >
                  ✕
                </button>
              </div>
            </header>

            <div className={styles.detailBody}>
              <div className={styles.detailSection}>
                <span className={styles.detailLabel}>Mensaje</span>
                <div className={styles.detailMessageBox}>
                  {selectedMessage.mensaje}
                </div>
              </div>

              <div className={styles.detailSection}>
                <span className={styles.detailLabel}>Respuesta interna</span>
                <textarea
                  className={styles.detailTextarea}
                  value={responseDraft}
                  onChange={(event) => setResponseDraft(event.target.value)}
                  placeholder="Escribe una nota interna o tu respuesta enviada"
                />
              </div>
            </div>

            <footer className={styles.detailFooter}>
              <div className={styles.detailTimestamps}>
                <div>Recibido: {formatDate(selectedMessage.createdAt)}</div>
                {selectedMessage.updatedAt && (
                  <div>
                    Actualizado: {formatDate(selectedMessage.updatedAt)}
                  </div>
                )}
              </div>

              <div className={styles.detailActions}>
                <button
                  type="button"
                  className={styles.tableActionButton}
                  onClick={handleSaveDraft}
                  disabled={isSaving || !isDraftDirty}
                >
                  Guardar nota
                </button>

                {selectedMessage.status === 'respondido' ? (
                  <button
                    type="button"
                    className={`${styles.tableActionButton} ${styles.tableActionButtonWarning}`}
                    onClick={handleMarkPending}
                    disabled={isSaving}
                  >
                    Marcar pendiente
                  </button>
                ) : (
                  <button
                    type="button"
                    className={`${styles.tableActionButton} ${styles.tableActionButtonSuccess}`}
                    onClick={handleMarkResponded}
                    disabled={isSaving}
                  >
                    Marcar respondido
                  </button>
                )}
              </div>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

export default Mensajes;
