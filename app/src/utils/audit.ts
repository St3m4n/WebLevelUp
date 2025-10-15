import type {
  AuditAction,
  AuditActor,
  AuditEntityRef,
  AuditEvent,
  AuditSeverity,
} from '@/types';

const AUDIT_STORAGE_KEY = 'levelup-audit-log';
const AUDIT_UPDATED_EVENT = 'levelup:audit-log-updated';
const AUDIT_LOG_MAX_ENTRIES = 750;

const isBrowser = typeof window !== 'undefined';

const buildActor = (actor?: Partial<AuditActor>): AuditActor => {
  const id = actor?.id?.trim();
  const name = actor?.name?.trim();
  return {
    id: id && id.length > 0 ? id : 'system',
    name: name && name.length > 0 ? name : 'Sistema',
    email: actor?.email,
    role: actor?.role,
  } satisfies AuditActor;
};

const sanitizeEvent = (candidate: unknown): AuditEvent | null => {
  if (!candidate || typeof candidate !== 'object') {
    return null;
  }

  const raw = candidate as Partial<AuditEvent> & {
    actor?: Partial<AuditActor>;
    entity?: Partial<AuditEntityRef>;
  };

  if (
    typeof raw.id !== 'string' ||
    typeof raw.timestamp !== 'string' ||
    typeof raw.action !== 'string' ||
    typeof raw.summary !== 'string'
  ) {
    return null;
  }

  const actor = buildActor(raw.actor);

  const entity: AuditEntityRef = {
    type: raw.entity?.type ?? 'sistema',
    id: raw.entity?.id,
    name: raw.entity?.name,
    context: raw.entity?.context,
  };

  const severity: AuditSeverity | undefined =
    raw.severity === 'high'
      ? 'high'
      : raw.severity === 'medium'
        ? 'medium'
        : raw.severity === 'low'
          ? 'low'
          : undefined;

  return {
    id: raw.id,
    timestamp: raw.timestamp,
    action: raw.action as AuditAction,
    actor,
    entity,
    summary: raw.summary,
    metadata: raw.metadata,
    severity,
  } satisfies AuditEvent;
};

const readAuditEvents = (): AuditEvent[] => {
  if (!isBrowser) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(AUDIT_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item: unknown) => sanitizeEvent(item))
      .filter((item): item is AuditEvent => Boolean(item))
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
  } catch (error) {
    console.warn(
      '[audit] No se pudieron cargar los eventos registrados',
      error
    );
    return [];
  }
};

const persistAuditEvents = (events: AuditEvent[]) => {
  if (!isBrowser) {
    return;
  }

  try {
    window.localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(events));
    window.dispatchEvent(new CustomEvent(AUDIT_UPDATED_EVENT));
  } catch (error) {
    console.warn('[audit] No se pudieron guardar los eventos', error);
  }
};

const generateAuditId = () => {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `AUD-${Date.now()}-${random}`;
};

export type RecordAuditEventInput<TMetadata = unknown> = {
  action: AuditAction;
  summary: string;
  entity: AuditEntityRef;
  metadata?: TMetadata;
  severity?: AuditSeverity;
  actor?: Partial<AuditActor>;
  timestamp?: string;
};

export const recordAuditEvent = <TMetadata = unknown>(
  input: RecordAuditEventInput<TMetadata>
): AuditEvent<TMetadata> | null => {
  if (!isBrowser) {
    return null;
  }

  const timestamp = input.timestamp ?? new Date().toISOString();
  const event: AuditEvent<TMetadata> = {
    id: generateAuditId(),
    timestamp,
    action: input.action,
    summary: input.summary,
    metadata: input.metadata,
    severity: input.severity,
    actor: buildActor(input.actor),
    entity: {
      type: input.entity.type,
      id: input.entity.id,
      name: input.entity.name,
      context: input.entity.context,
    },
  };

  const current = readAuditEvents();
  const next = [event, ...current].slice(0, AUDIT_LOG_MAX_ENTRIES);
  persistAuditEvents(next);
  return event;
};

export const loadAuditEvents = (options?: { limit?: number }): AuditEvent[] => {
  const events = readAuditEvents();
  if (!options?.limit || options.limit >= events.length) {
    return events;
  }
  return events.slice(0, options.limit);
};

export const clearAuditEvents = () => {
  if (!isBrowser) {
    return;
  }
  try {
    window.localStorage.removeItem(AUDIT_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent(AUDIT_UPDATED_EVENT));
  } catch (error) {
    console.warn('[audit] No se pudo limpiar el registro', error);
  }
};

export const subscribeToAuditLog = (listener: () => void) => {
  if (!isBrowser) {
    return () => undefined;
  }

  const handler = () => listener();
  window.addEventListener(AUDIT_UPDATED_EVENT, handler);
  window.addEventListener('storage', handler);

  return () => {
    window.removeEventListener(AUDIT_UPDATED_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
};

export const createAuditActorFromUser = (user?: {
  run?: string;
  nombre?: string;
  apellidos?: string;
  correo?: string;
  perfil?: string;
}): Partial<AuditActor> | undefined => {
  if (!user?.run || !user?.nombre) {
    return undefined;
  }

  const fullName = [user.nombre, user.apellidos]
    .filter(Boolean)
    .join(' ')
    .trim();

  return {
    id: user.run,
    name: fullName || user.nombre,
    email: user.correo,
    role: user.perfil,
  } satisfies Partial<AuditActor>;
};

export const AUDIT_LOG_KEYS = {
  storage: AUDIT_STORAGE_KEY,
  event: AUDIT_UPDATED_EVENT,
  maxEntries: AUDIT_LOG_MAX_ENTRIES,
};
