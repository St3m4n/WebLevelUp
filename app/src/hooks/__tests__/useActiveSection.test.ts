import { act, renderHook } from '@testing-library/react';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { useActiveSection } from '../useActiveSection';

type ObserverRecord = {
  target?: Element;
  callback: IntersectionObserverCallback;
  observer: IntersectionObserver;
};

describe('useActiveSection', () => {
  const records = new Map<string, ObserverRecord>();
  const sections: HTMLDivElement[] = [];

  beforeAll(() => {
    // Reemplazamos IntersectionObserver para capturar cuándo el hook observa cada sección.
    class MockIntersectionObserver implements IntersectionObserver {
      readonly root: Element | Document | null = null;

      readonly rootMargin: string = '0px';

      readonly thresholds: ReadonlyArray<number> = [0];

      private observerCallback: IntersectionObserverCallback;

      constructor(callback: IntersectionObserverCallback) {
        this.observerCallback = callback;
      }

      observe(target: Element) {
        records.set(target.id, {
          target,
          callback: this.observerCallback,
          observer: this,
        });
      }

      unobserve(target: Element) {
        records.delete(target.id);
      }

      disconnect() {
        records.clear();
      }

      takeRecords(): IntersectionObserverEntry[] {
        return [];
      }
    }

    vi.stubGlobal(
      'IntersectionObserver',
      MockIntersectionObserver as unknown as typeof IntersectionObserver
    );
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  beforeEach(() => {
    records.clear();
    sections.splice(0, sections.length);
    document.body.innerHTML = '';

    // Generamos tres secciones simuladas en el DOM tal como lo haría la página real.
    for (let index = 1; index <= 3; index += 1) {
      const section = document.createElement('div');
      section.id = `section-${index}`;
      document.body.append(section);
      sections.push(section);
    }
  });

  const trigger = (id: string) => {
    const record = records.get(id);
    if (!record?.target) return;

    // Ejecuta manualmente el callback del observer como si la sección hubiese entrado al viewport.
    const entry: IntersectionObserverEntry = {
      time: performance.now(),
      isIntersecting: true,
      intersectionRatio: 1,
      boundingClientRect: record.target.getBoundingClientRect(),
      intersectionRect: record.target.getBoundingClientRect(),
      rootBounds: null,
      target: record.target,
    };

    record.callback([entry], record.observer);
  };

  it('devuelve la primera sección por defecto', () => {
    // Monta el hook con las secciones disponibles para leer el valor inicial.
    const { result } = renderHook(() =>
      useActiveSection({
        sections: sections.map((section) => ({ id: section.id })),
      })
    );

    expect(result.current).toBe('section-1');
  });

  it('actualiza la sección activa al recibir intersecciones', () => {
    // Montamos el hook y confirmamos la sección inicial.
    const { result } = renderHook(() =>
      useActiveSection({
        sections: sections.map((section) => ({ id: section.id })),
      })
    );

    expect(result.current).toBe('section-1');

    // Simulamos intersecciones en orden para verificar que el estado cambie correctamente.
    act(() => {
      trigger('section-2');
    });

    expect(result.current).toBe('section-2');

    act(() => {
      trigger('section-3');
    });

    expect(result.current).toBe('section-3');
  });
});
