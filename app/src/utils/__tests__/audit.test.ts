import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearAuditEvents, loadAuditEvents, recordAuditEvent } from '../audit';

describe('audit utilities', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('registra eventos con actor por defecto y los persiste', () => {
    // Guarda un evento con actor vacío para validar que se asigne el actor del sistema.
    const event = recordAuditEvent({
      action: 'updated',
      summary: 'Perfil actualizado',
      entity: { type: 'usuario', id: '123', name: 'Perfil' },
      actor: { id: '', name: '' },
      metadata: { field: 'nombre' },
    });

    expect(event).not.toBeNull();

    // Comprueba que el evento quede almacenado con el resumen y actor esperados.
    const stored = loadAuditEvents();
    expect(stored).toHaveLength(1);
    expect(stored[0]?.summary).toBe('Perfil actualizado');
    expect(stored[0]?.actor.name).toBe('Sistema');
  });

  it('respeta el límite solicitado al cargar eventos', () => {
    // Persiste cuatro eventos con timestamps crecientes.
    for (let index = 0; index < 4; index += 1) {
      recordAuditEvent({
        action: 'created',
        summary: `Evento ${index}`,
        entity: { type: 'usuario', id: `${index}` },
        timestamp: new Date(Date.now() + index * 1000).toISOString(),
      });
    }

    // Al cargar con límite 2 deben devolverse solamente los más recientes.
    const limited = loadAuditEvents({ limit: 2 });
    expect(limited).toHaveLength(2);
    expect(limited[0]?.summary).toBe('Evento 3');
    expect(limited[1]?.summary).toBe('Evento 2');
  });

  it('limpia el registro y notifica a los listeners', () => {
    const listener = vi.fn();
    window.addEventListener('levelup:audit-log-updated', listener);

    // Agrega un evento y luego limpia todo el registro.
    recordAuditEvent({
      action: 'deleted',
      summary: 'Evento a eliminar',
      entity: { type: 'usuario', id: 'abc' },
    });

    clearAuditEvents();

    // Verifica que no haya eventos y que el listener reciba la notificación.
    expect(loadAuditEvents()).toHaveLength(0);
    expect(listener).toHaveBeenCalled();

    window.removeEventListener('levelup:audit-log-updated', listener);
  });
});
