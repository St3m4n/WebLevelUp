import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/services/auditService', async () => {
  const actual = await vi.importActual<
    typeof import('@/services/auditService')
  >('@/services/auditService');
  return {
    ...actual,
    fetchAuditEvents: vi.fn(),
    createAuditEvent: vi.fn(),
    purgeAuditEvents: vi.fn(),
  };
});

import {
  createAuditEvent,
  fetchAuditEvents,
  purgeAuditEvents,
} from '@/services/auditService';
import { clearAuditEvents, loadAuditEvents, recordAuditEvent } from '../audit';

const mockedCreate = createAuditEvent as vi.MockedFunction<
  typeof createAuditEvent
>;
const mockedFetch = fetchAuditEvents as vi.MockedFunction<
  typeof fetchAuditEvents
>;
const mockedPurge = purgeAuditEvents as vi.MockedFunction<
  typeof purgeAuditEvents
>;

describe('audit utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('envía eventos a la API y emite notificación', async () => {
    mockedCreate.mockResolvedValue(undefined);
    const listener = vi.fn();
    window.addEventListener('levelup:audit-log-updated', listener);

    const event = await recordAuditEvent({
      action: 'created',
      summary: 'Producto creado',
      entity: { type: 'producto', id: 'SKU-123' },
      metadata: { stock: 10 },
    });

    expect(mockedCreate).toHaveBeenCalledWith({
      action: 'created',
      entityType: 'producto',
      entityId: 'SKU-123',
      summary: 'Producto creado',
      severity: 'LOW',
      metadata: { stock: 10 },
    });
    expect(event.actor.name).toBe('Sistema');
    expect(listener).toHaveBeenCalled();

    window.removeEventListener('levelup:audit-log-updated', listener);
  });

  it('carga eventos remotos y aplica ordenamiento descendente', async () => {
    mockedFetch.mockResolvedValue([
      {
        id: 1,
        actor: '12.345.678-9 (admin@levelup.com)',
        action: 'USER_UPDATE',
        entityType: 'Usuario',
        entityId: '42',
        summary: 'Actualización del usuario',
        severity: 'MEDIUM',
        metadata: '{"field":"correo"}',
        createdAt: '2025-11-22T10:00:00',
      },
      {
        id: 2,
        actor: 'admin@levelup.com',
        action: 'USER_CREATE',
        entityType: 'Usuario',
        entityId: '41',
        summary: 'Alta de usuario',
        severity: 'LOW',
        metadata: null,
        createdAt: '2025-11-23T12:15:00',
      },
      {
        id: 3,
        actor: '00000000',
        action: 'SYSTEM_EVENT',
        entityType: 'Sistema',
        entityId: null,
        summary: 'Evento de sistema',
        severity: 'HIGH',
        metadata: null,
        createdAt: '2025-11-20T08:00:00',
      },
    ]);

    const events = await loadAuditEvents({ limit: 10 });

    expect(mockedFetch).toHaveBeenCalledWith({ limit: 10 });
    expect(events).toHaveLength(3);
    expect(events[0]?.summary).toBe('Alta de usuario');
    expect(events[0]?.metadata).toBeUndefined();
    expect(events[1]?.metadata).toEqual({ field: 'correo' });
    expect(events[0]?.actor.id).toBe('admin@levelup.com');
    expect(events[0]?.actor.email).toBe('admin@levelup.com');
    expect(events[0]?.actor.name).toBe('admin@levelup.com');
    expect(events[1]?.actor.id).toBe('12.345.678-9');
    expect(events[1]?.actor.email).toBe('admin@levelup.com');
    expect(events[1]?.actor.name).toBe('12.345.678-9 (admin@levelup.com)');
    expect(events[2]?.actor.id).toBe('system');
    expect(events[2]?.actor.name).toBe('Sistema');
    expect(events[2]?.actor.email).toBe('system@levelup.local');
  });

  it('limpia la bitácora mediante la API y notifica', async () => {
    mockedPurge.mockResolvedValue(undefined);
    const listener = vi.fn();
    window.addEventListener('levelup:audit-log-updated', listener);

    await clearAuditEvents();

    expect(mockedPurge).toHaveBeenCalled();
    expect(listener).toHaveBeenCalled();

    window.removeEventListener('levelup:audit-log-updated', listener);
  });

  it('propaga errores al limpiar la bitácora', async () => {
    mockedPurge.mockRejectedValue(new Error('forbidden'));

    await expect(clearAuditEvents()).rejects.toThrow('forbidden');
  });
});
