import { apiDelete, apiGet, apiPost } from '@/services/apiClient';
import type { AuditEvent, AuditSeverity } from '@/types';

export type AuditEventDto = {
  id: number | string;
  actor?: string | null;
  action?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  summary?: string | null;
  severity?: string | null;
  metadata?: unknown;
  createdAt?: string | null;
};

export type FetchAuditEventsParams = {
  action?: string;
  entityType?: string;
  from?: string;
  to?: string;
  limit?: number;
};

export type CreateAuditEventPayload = {
  action: string;
  entityType?: string;
  entityId?: string;
  summary: string;
  severity?:
    | AuditSeverity
    | Uppercase<AuditSeverity>
    | Lowercase<AuditSeverity>;
  metadata?: unknown;
};

export const fetchAuditEvents = async (
  params: FetchAuditEventsParams = {}
): Promise<AuditEventDto[]> => {
  const searchParams = new URLSearchParams();

  if (params.action) {
    searchParams.set('action', params.action);
  }
  if (params.entityType) {
    searchParams.set('entityType', params.entityType);
  }
  if (params.from) {
    searchParams.set('from', params.from);
  }
  if (params.to) {
    searchParams.set('to', params.to);
  }
  if (typeof params.limit === 'number') {
    searchParams.set('limit', String(params.limit));
  }

  const query = searchParams.toString();
  const endpoint = `/audit${query ? `?${query}` : ''}`;
  return apiGet<AuditEventDto[]>(endpoint, { auth: true });
};

export const createAuditEvent = async (
  payload: CreateAuditEventPayload
): Promise<void> => {
  await apiPost<void>('/audit', payload, { auth: true });
};

export const purgeAuditEvents = async (): Promise<void> => {
  await apiDelete<void>('/audit', { auth: true });
};

const toLowerSeverity = (
  severity?: string | null
): AuditSeverity | undefined => {
  if (!severity) {
    return undefined;
  }
  const normalized = severity.toLowerCase();
  if (
    normalized === 'low' ||
    normalized === 'medium' ||
    normalized === 'high'
  ) {
    return normalized as AuditSeverity;
  }
  return undefined;
};

const parseMetadata = (metadata: unknown): unknown => {
  if (metadata == null) {
    return undefined;
  }

  if (typeof metadata === 'string') {
    const trimmed = metadata.trim();
    if (!trimmed) {
      return undefined;
    }
    try {
      return JSON.parse(trimmed);
    } catch {
      return trimmed;
    }
  }

  return metadata;
};

const resolveAuditActor = (rawActor?: string | null): AuditEvent['actor'] => {
  const fallback: AuditEvent['actor'] = {
    id: 'system',
    name: 'Sistema',
    email: 'system@levelup.local',
  };

  if (!rawActor) {
    return fallback;
  }

  const trimmed = rawActor.trim();
  if (!trimmed) {
    return fallback;
  }

  if (/^0+$/.test(trimmed)) {
    return fallback;
  }

  const match = trimmed.match(/^([^()]+?)\s*\(([^()]+)\)$/);
  if (match) {
    const run = match[1]?.trim();
    const email = match[2]?.trim();
    return {
      id: run && run.length > 0 ? run : (email ?? fallback.id),
      name: trimmed,
      email: email && email.length > 0 ? email : undefined,
    } satisfies AuditEvent['actor'];
  }

  if (trimmed.includes('@')) {
    return {
      id: trimmed,
      name: trimmed,
      email: trimmed,
    } satisfies AuditEvent['actor'];
  }

  return {
    id: trimmed,
    name: trimmed,
  } satisfies AuditEvent['actor'];
};

export const mapAuditDtoToEvent = (dto: AuditEventDto): AuditEvent => {
  const severity = toLowerSeverity(dto.severity ?? undefined);
  const fallbackId =
    dto.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    id: String(fallbackId),
    timestamp: dto.createdAt ?? new Date().toISOString(),
    action: dto.action ?? 'UNKNOWN',
    summary: dto.summary ?? '',
    metadata: parseMetadata(dto.metadata),
    severity,
    actor: resolveAuditActor(dto.actor),
    entity: {
      type: dto.entityType ?? 'sistema',
      id: dto.entityId ?? undefined,
      context: dto.entityId ?? undefined,
      name: dto.entityId ?? undefined,
    },
  } satisfies AuditEvent;
};
