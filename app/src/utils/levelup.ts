import { normalizeCorreo, normalizeRun } from '@/utils/users';

const STATS_STORAGE_KEY = 'levelup-user-stats';
export const STATS_UPDATED_EVENT = 'levelup:user-stats-updated';

const CONFIG = {
  REFERIDO_USA_CODIGO: 100,
  REFERENTE_GANA: 100,
  COMPRA_POR_1000: 1,
  TORNEO_PARTICIPACION: 50,
  TORNEO_PODIO: 200,
  REF_PREFIX: 'LUG-',
} as const;

type LevelUpExp = {
  torneos: number;
  compras: number;
  referidos: number;
};

type LevelUpReferralUser = {
  email: string;
  date: string;
};

export type LevelUpReferralDto = LevelUpReferralUser;

export type LevelUpUserStats = {
  points: number;
  exp: LevelUpExp;
  referralCode: string;
  referredBy?: string;
  referidos?: {
    count: number;
    users: LevelUpReferralUser[];
  };
  updatedAt?: string;
};

type LevelUpStatsRecord = Record<string, LevelUpUserStats>;

export type LevelUpStatsEventDetail = {
  runs: string[];
};

type ReferralApplyResult =
  | {
      ok: true;
      newUserPoints: number;
      referrerPoints: number;
      refRun: string;
    }
  | {
      ok: false;
      reason:
        | 'invalid-run'
        | 'no-code'
        | 'code-not-found'
        | 'self-ref'
        | 'already-referred';
    };

export type PurchasePointsResult = {
  ok: true;
  pointsAdded: number;
  totalPoints: number;
};

type TournamentExpResult = {
  ok: true;
  pointsAdded: number;
};

const safeParse = <T>(raw: string | null, fallback: T): T => {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch (error) {
    console.warn('No se pudieron parsear estadísticas LevelUp', error);
    return fallback;
  }
};

const getWindow = (): Window | undefined =>
  typeof window === 'undefined' ? undefined : window;

const cloneStats = (stats: LevelUpStatsRecord): LevelUpStatsRecord =>
  Object.entries(stats).reduce<LevelUpStatsRecord>((acc, [key, value]) => {
    acc[key] = {
      ...value,
      exp: { ...value.exp },
      referidos: value.referidos
        ? {
            count: value.referidos.count,
            users: value.referidos.users.map((user) => ({ ...user })),
          }
        : undefined,
    };
    return acc;
  }, {});

const loadStats = (): LevelUpStatsRecord => {
  const win = getWindow();
  if (!win) return {};
  const raw = win.localStorage.getItem(STATS_STORAGE_KEY);
  const parsed = safeParse<unknown>(raw, {});
  if (!parsed || typeof parsed !== 'object') return {};
  return Object.entries(parsed).reduce<LevelUpStatsRecord>(
    (acc, [run, value]) => {
      if (!run || typeof run !== 'string') {
        return acc;
      }
      const normalizedRun = normalizeRun(run);
      if (!normalizedRun) {
        return acc;
      }
      const stats = sanitizeStats(value);
      if (!stats) {
        return acc;
      }
      acc[normalizedRun] = stats;
      return acc;
    },
    {}
  );
};

const sanitizeStats = (candidate: unknown): LevelUpUserStats | null => {
  if (!candidate || typeof candidate !== 'object') {
    return null;
  }
  const partial = candidate as Partial<LevelUpUserStats>;
  const points = Number.isFinite(partial.points) ? Number(partial.points) : 0;
  const exp = sanitizeExp(partial.exp);
  const referralCode =
    typeof partial.referralCode === 'string' && partial.referralCode
      ? partial.referralCode.trim().toUpperCase()
      : '';
  const referidos = sanitizeReferidos(partial.referidos);
  const referredBy = partial.referredBy
    ? normalizeRun(partial.referredBy)
    : undefined;

  return {
    points,
    exp,
    referralCode,
    referidos,
    referredBy,
    updatedAt: partial.updatedAt,
  };
};

const sanitizeExp = (candidate: unknown): LevelUpExp => {
  if (!candidate || typeof candidate !== 'object') {
    return { torneos: 0, compras: 0, referidos: 0 };
  }
  const exp = candidate as Partial<LevelUpExp>;
  return {
    torneos: Number.isFinite(exp.torneos) ? Number(exp.torneos) : 0,
    compras: Number.isFinite(exp.compras) ? Number(exp.compras) : 0,
    referidos: Number.isFinite(exp.referidos) ? Number(exp.referidos) : 0,
  };
};

const sanitizeReferidos = (
  candidate: unknown
): LevelUpUserStats['referidos'] => {
  if (!candidate || typeof candidate !== 'object') {
    return { count: 0, users: [] };
  }
  const partial = candidate as Partial<LevelUpUserStats['referidos']>;
  const users = Array.isArray(partial?.users)
    ? (partial.users
        .map((entry) => sanitizeReferralUser(entry))
        .filter(Boolean) as LevelUpReferralUser[])
    : [];
  const count = Number.isFinite(partial?.count)
    ? Number(partial?.count)
    : users.length;
  return {
    count,
    users,
  };
};

const sanitizeReferralUser = (
  candidate: unknown
): LevelUpReferralUser | null => {
  if (!candidate || typeof candidate !== 'object') {
    return null;
  }
  const partial = candidate as Partial<LevelUpReferralUser>;
  const email =
    typeof partial.email === 'string' ? partial.email.trim().toLowerCase() : '';
  if (!email) return null;
  const date =
    typeof partial.date === 'string' && partial.date ? partial.date : '';
  return { email, date };
};

const persistStats = (stats: LevelUpStatsRecord, runs: string[]) => {
  const win = getWindow();
  if (!win) return;
  try {
    win.localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
    const detail: LevelUpStatsEventDetail = {
      runs: runs.map((run) => normalizeRun(run)).filter(Boolean),
    };
    win.dispatchEvent(new CustomEvent(STATS_UPDATED_EVENT, { detail }));
  } catch (error) {
    console.warn('No se pudieron persistir estadísticas LevelUp', error);
  }
};

const generateReferralCode = (): string => {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let index = 0; index < 6; index += 1) {
    const randomIndex = Math.floor(Math.random() * alphabet.length);
    code += alphabet[randomIndex];
  }
  return `${CONFIG.REF_PREFIX}${code}`;
};

const ensureStatsForRun = (
  runKey: string,
  stats: LevelUpStatsRecord
): { stats: LevelUpStatsRecord; created: boolean } => {
  const existing = stats[runKey];
  if (existing) {
    const sanitized = sanitizeStats(existing);
    const needsReferralCode = !sanitized?.referralCode;
    if (sanitized) {
      stats[runKey] = {
        ...sanitized,
        referralCode: needsReferralCode
          ? generateReferralCode()
          : sanitized.referralCode,
        referidos: sanitized.referidos ?? { count: 0, users: [] },
      };
      return {
        stats,
        created: needsReferralCode,
      };
    }
  }

  stats[runKey] = {
    points: 0,
    exp: { torneos: 0, compras: 0, referidos: 0 },
    referralCode: generateReferralCode(),
    referidos: { count: 0, users: [] },
    updatedAt: new Date().toISOString(),
  };
  return { stats, created: true };
};

const setStatsForRun = (
  runKey: string,
  nextStats: LevelUpUserStats,
  currentStats: LevelUpStatsRecord
): LevelUpStatsRecord => {
  const updated = cloneStats(currentStats);
  updated[runKey] = {
    ...nextStats,
    exp: { ...nextStats.exp },
    referidos: nextStats.referidos
      ? {
          count: nextStats.referidos.count,
          users: nextStats.referidos.users.map((user) => ({ ...user })),
        }
      : { count: 0, users: [] },
    referralCode: nextStats.referralCode || generateReferralCode(),
    updatedAt: new Date().toISOString(),
  };
  return updated;
};

const getStatsRecordWithEnsuredRun = (
  run: string
): { runKey: string; stats: LevelUpStatsRecord; created: boolean } => {
  const runKey = normalizeRun(run);
  if (!runKey) {
    return { runKey: '', stats: {}, created: false };
  }
  const stats = loadStats();
  const updated = ensureStatsForRun(runKey, stats);
  if (updated.created) {
    persistStats(updated.stats, [runKey]);
  }
  return { runKey, stats: updated.stats, created: updated.created };
};

const updateStats = (
  run: string,
  updater: (stats: LevelUpUserStats) => LevelUpUserStats
): LevelUpUserStats => {
  const { runKey, stats } = getStatsRecordWithEnsuredRun(run);
  if (!runKey) {
    return {
      points: 0,
      exp: { torneos: 0, compras: 0, referidos: 0 },
      referralCode: '',
      referidos: { count: 0, users: [] },
    };
  }
  const current = stats[runKey] ?? {
    points: 0,
    exp: { torneos: 0, compras: 0, referidos: 0 },
    referralCode: generateReferralCode(),
    referidos: { count: 0, users: [] },
  };
  const next = updater(current);
  const nextRecord = setStatsForRun(runKey, next, stats);
  persistStats(nextRecord, [runKey]);
  return nextRecord[runKey];
};

const formatReferralEmail = (email: string | undefined): string => {
  if (!email) return '';
  return normalizeCorreo(email);
};

export const ensureUserStats = (run: string): LevelUpUserStats => {
  const { runKey } = getStatsRecordWithEnsuredRun(run);
  if (!runKey) {
    return {
      points: 0,
      exp: { torneos: 0, compras: 0, referidos: 0 },
      referralCode: '',
      referidos: { count: 0, users: [] },
    };
  }
  const stats = loadStats();
  return (
    stats[runKey] ?? {
      points: 0,
      exp: { torneos: 0, compras: 0, referidos: 0 },
      referralCode: generateReferralCode(),
      referidos: { count: 0, users: [] },
    }
  );
};

export const ensureReferralCode = (run: string): string => {
  const { runKey, stats } = getStatsRecordWithEnsuredRun(run);
  if (!runKey) return '';
  const current = stats[runKey];
  if (current.referralCode) {
    return current.referralCode;
  }
  const generated = generateReferralCode();
  const next = {
    ...current,
    referralCode: generated,
  };
  const nextRecord = setStatsForRun(runKey, next, stats);
  persistStats(nextRecord, [runKey]);
  return generated;
};

export const getUserStats = (run: string): LevelUpUserStats => {
  const runKey = normalizeRun(run);
  if (!runKey) {
    return {
      points: 0,
      exp: { torneos: 0, compras: 0, referidos: 0 },
      referralCode: '',
      referidos: { count: 0, users: [] },
    };
  }
  const stats = loadStats();
  if (!stats[runKey]) {
    const ensured = ensureUserStats(runKey);
    return ensured;
  }
  return stats[runKey];
};

export const applyReferralOnRegistration = ({
  newUserRun,
  newUserEmail,
  referralCode,
}: {
  newUserRun: string;
  newUserEmail?: string;
  referralCode?: string;
}): ReferralApplyResult => {
  const runKey = normalizeRun(newUserRun);
  if (!runKey) return { ok: false, reason: 'invalid-run' };
  const code = referralCode?.trim().toUpperCase() ?? '';
  if (!code) return { ok: false, reason: 'no-code' };

  const stats = loadStats();
  const ensured = ensureStatsForRun(runKey, stats);
  const currentNew = ensured.stats[runKey];
  if (currentNew.referredBy) {
    return { ok: false, reason: 'already-referred' };
  }

  const ownerEntry = Object.entries(ensured.stats).find(([, value]) => {
    return value.referralCode === code;
  });
  if (!ownerEntry) {
    return { ok: false, reason: 'code-not-found' };
  }
  const [ownerRun, ownerStats] = ownerEntry;
  if (ownerRun === runKey) {
    return { ok: false, reason: 'self-ref' };
  }

  const now = new Date().toISOString();
  const newUserStats: LevelUpUserStats = {
    ...currentNew,
    points: currentNew.points + CONFIG.REFERIDO_USA_CODIGO,
    exp: { ...currentNew.exp },
    referredBy: ownerRun,
    referidos: currentNew.referidos ?? { count: 0, users: [] },
    updatedAt: now,
  };

  const ownerReferidosUsers = ownerStats.referidos?.users ?? [];
  const ownerReferidosCount =
    ownerStats.referidos?.count ?? ownerReferidosUsers.length;
  const normalizedEmail = formatReferralEmail(newUserEmail);
  const alreadyListed = normalizedEmail
    ? ownerReferidosUsers.some(
        (entry) => entry.email.toLowerCase() === normalizedEmail
      )
    : false;
  const newReferidosUsers = alreadyListed
    ? ownerReferidosUsers.map((entry) => ({ ...entry }))
    : ([
        ...ownerReferidosUsers.map((entry) => ({ ...entry })),
        normalizedEmail ? { email: normalizedEmail, date: now } : undefined,
      ].filter(Boolean) as LevelUpReferralUser[]);
  const ownerStatsNext: LevelUpUserStats = {
    ...ownerStats,
    points: ownerStats.points + CONFIG.REFERENTE_GANA,
    exp: {
      torneos: ownerStats.exp?.torneos ?? 0,
      compras: ownerStats.exp?.compras ?? 0,
      referidos: (ownerStats.exp?.referidos ?? 0) + 1,
    },
    referidos: {
      count: alreadyListed ? ownerReferidosCount : ownerReferidosCount + 1,
      users: newReferidosUsers,
    },
    updatedAt: now,
  };

  const nextRecord = cloneStats(ensured.stats);
  nextRecord[runKey] = newUserStats;
  nextRecord[ownerRun] = ownerStatsNext;
  persistStats(nextRecord, [runKey, ownerRun]);

  return {
    ok: true,
    newUserPoints: CONFIG.REFERIDO_USA_CODIGO,
    referrerPoints: CONFIG.REFERENTE_GANA,
    refRun: ownerRun,
  };
};

export const addPurchasePoints = ({
  run,
  totalCLP,
}: {
  run: string;
  totalCLP: number;
}): PurchasePointsResult => {
  const total = Math.max(0, Math.floor(Number(totalCLP) || 0));
  const runKey = normalizeRun(run);
  if (!runKey) {
    return { ok: true, pointsAdded: 0, totalPoints: 0 };
  }
  const pointsToAdd = Math.floor(total / 1000) * CONFIG.COMPRA_POR_1000;
  const next = updateStats(runKey, (current) => {
    const nextPoints = current.points + pointsToAdd;
    return {
      ...current,
      points: nextPoints,
      exp: {
        ...current.exp,
        compras: (current.exp?.compras ?? 0) + pointsToAdd,
      },
    };
  });
  return { ok: true, pointsAdded: pointsToAdd, totalPoints: next.points };
};

export const addTournamentExp = ({
  run,
  podium = false,
}: {
  run: string;
  podium?: boolean;
}): TournamentExpResult => {
  const runKey = normalizeRun(run);
  if (!runKey) {
    return { ok: true, pointsAdded: 0 };
  }
  const base = CONFIG.TORNEO_PARTICIPACION;
  const add = podium ? base + CONFIG.TORNEO_PODIO : base;
  updateStats(runKey, (current) => {
    return {
      ...current,
      points: current.points + add,
      exp: {
        ...current.exp,
        torneos: (current.exp?.torneos ?? 0) + add,
      },
    };
  });
  return { ok: true, pointsAdded: add };
};

export const expRequiredForLevel = (level: number): number => {
  const levelNum = Math.max(1, Math.floor(level || 1));
  return Math.max(1, Math.floor(50 * Math.pow(levelNum, 1.5)));
};

export const computeLevelProgressFromExp = (
  totalExp: number
): { level: number; into: number; nextReq: number; pct: number } => {
  let level = 1;
  let expLeft = Math.max(0, Math.floor(Number(totalExp) || 0));
  let nextReq = expRequiredForLevel(level);
  let guard = 0;
  while (expLeft >= nextReq && guard < 100000) {
    expLeft -= nextReq;
    level += 1;
    nextReq = expRequiredForLevel(level);
    guard += 1;
  }
  const pct = nextReq > 0 ? Math.floor((expLeft / nextReq) * 100) : 0;
  return {
    level,
    into: expLeft,
    nextReq,
    pct: Math.max(0, Math.min(100, pct)),
  };
};

export const getTotalExp = (exp?: LevelUpExp): number => {
  if (!exp) return 0;
  return (exp.torneos ?? 0) + (exp.compras ?? 0) + (exp.referidos ?? 0);
};

export const subscribeToLevelUpStats = (
  callback: (detail: LevelUpStatsEventDetail | null) => void
): (() => void) | undefined => {
  const win = getWindow();
  if (!win) return undefined;

  const handleEvent = (event: Event) => {
    if (event instanceof CustomEvent) {
      const detail = (event as CustomEvent<LevelUpStatsEventDetail>).detail;
      callback(detail ?? null);
      return;
    }
    callback(null);
  };

  const handleStorage = (event: StorageEvent) => {
    if (event.key === STATS_STORAGE_KEY) {
      callback(null);
    }
  };

  win.addEventListener(STATS_UPDATED_EVENT, handleEvent as EventListener);
  win.addEventListener('storage', handleStorage);

  return () => {
    win.removeEventListener(STATS_UPDATED_EVENT, handleEvent as EventListener);
    win.removeEventListener('storage', handleStorage);
  };
};

export const LevelUpConfig = CONFIG;
