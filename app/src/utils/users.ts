export type PersistedUserState = {
  deletedAt: string;
};

export const ADMIN_USER_STATES_KEY = 'levelup-admin-user-state';
export const ADMIN_USER_STATES_EVENT = 'levelup:user-states-updated';

export const normalizeRun = (run: string): string =>
  run.replace(/[^0-9kK]/g, '').toUpperCase();

export const normalizeCorreo = (correo: string): string =>
  correo.trim().toLowerCase();

export const loadAdminUserStates = (): Record<string, PersistedUserState> => {
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

export const arePersistedUserStatesEqual = (
  previous: Record<string, PersistedUserState>,
  next: Record<string, PersistedUserState>
): boolean => {
  if (previous === next) return true;
  const prevKeys = Object.keys(previous);
  const nextKeys = Object.keys(next);
  if (prevKeys.length !== nextKeys.length) return false;
  return prevKeys.every((key) => {
    const prevState = previous[key];
    const nextState = next[key];
    if (!prevState && !nextState) return true;
    if (!prevState || !nextState) return false;
    return prevState.deletedAt === nextState.deletedAt;
  });
};
