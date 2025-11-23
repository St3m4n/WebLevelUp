import type {
  AuditAction,
  AuditActor,
  AuditEntityRef,
  AuditEvent,
  AuditSeverity,
} from '@/types';
import {
  createAuditEvent,
  fetchAuditEvents,
  mapAuditDtoToEvent,
  purgeAuditEvents,
  type FetchAuditEventsParams,
} from '@/services/auditService';

const AUDIT_UPDATED_EVENT = 'levelup:audit-log-updated';

const isBrowser = typeof window !== 'undefined';

const emitAuditUpdated = () => {
  if (!isBrowser) {
    return;
  }
  window.dispatchEvent(new CustomEvent(AUDIT_UPDATED_EVENT));
};

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

const generateAuditId = () => {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `AUD-${Date.now()}-${random}`;
};

const toApiSeverity = (severity?: AuditSeverity): 'LOW' | 'MEDIUM' | 'HIGH' => {
  const normalized = (severity ?? 'low').toLowerCase();
  if (normalized === 'medium') {
    return 'MEDIUM';
  }
  if (normalized === 'high') {
    return 'HIGH';
  }
  return 'LOW';
};

type LoadAuditEventsOptions = FetchAuditEventsParams;

export type RecordAuditEventInput<TMetadata = unknown> = {
  action: AuditAction;
  summary: string;
  entity: AuditEntityRef;
  metadata?: TMetadata;
  severity?: AuditSeverity;
  actor?: Partial<AuditActor>;
  timestamp?: string;
};

export const recordAuditEvent = async <TMetadata = unknown>(
  input: RecordAuditEventInput<TMetadata>
): Promise<AuditEvent<TMetadata>> => {
  const timestamp = input.timestamp ?? new Date().toISOString();
  const actor = buildActor(input.actor);
  const event: AuditEvent<TMetadata> = {
    id: generateAuditId(),
    timestamp,
    action: input.action,
    summary: input.summary,
    metadata: input.metadata,
    severity: input.severity ?? 'low',
    actor,
    entity: {
      type: input.entity.type,
      id: input.entity.id,
      name: input.entity.name,
      context: input.entity.context,
    },
  };

  try {
    await createAuditEvent({
      action: input.action,
      entityType: input.entity.type,
      entityId: input.entity.id ?? input.entity.context,
      summary: input.summary,
      severity: toApiSeverity(input.severity),
      metadata: input.metadata,
    });
    emitAuditUpdated();
  } catch (error) {
    console.warn('[audit] No se pudo registrar el evento', error);
  }

  return event;
};

export const loadAuditEvents = async (
  options: LoadAuditEventsOptions = {}
): Promise<AuditEvent[]> => {
  try {
    const dtos = await fetchAuditEvents(options);
    return dtos
      .map((dto) => mapAuditDtoToEvent(dto))
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      .slice(0, options.limit ?? dtos.length);
  } catch (error) {
    console.warn('[audit] No se pudieron cargar los eventos', error);
    return [];
  }
};

export const clearAuditEvents = async () => {
  try {
    await purgeAuditEvents();
    emitAuditUpdated();
  } catch (error) {
    console.warn('[audit] No se pudo limpiar el registro', error);
    throw error;
  }
};

export const subscribeToAuditLog = (listener: () => void) => {
  if (!isBrowser) {
    return () => undefined;
  }

  const handler = () => listener();
  window.addEventListener(AUDIT_UPDATED_EVENT, handler);

  return () => {
    window.removeEventListener(AUDIT_UPDATED_EVENT, handler);
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
  event: AUDIT_UPDATED_EVENT,
  mode: 'remote' as const,
};
