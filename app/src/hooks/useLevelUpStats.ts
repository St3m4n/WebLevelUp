import { useMemo } from 'react';

import { useAuth } from '@/context/AuthContext';
import { computeLevelProgressFromExp, getTotalExp } from '@/utils/levelup';
import type { LevelUpUserStats } from '@/utils/levelup';

type LevelUpState = {
  stats: LevelUpUserStats | null;
  totalExp: number;
  level: number;
  progressPct: number;
  nextLevelExp: number;
  currentExpIntoLevel: number;
};

const initialState: LevelUpState = {
  stats: null,
  totalExp: 0,
  level: 1,
  progressPct: 0,
  nextLevelExp: 0,
  currentExpIntoLevel: 0,
};

export const useLevelUpStats = (): LevelUpState => {
  const { user } = useAuth();

  return useMemo(() => {
    if (!user || !user.levelUpStats) {
      return initialState;
    }

    const stats = user.levelUpStats;

    // Normalize referidos if it comes as an array from the API
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const referidosRaw = stats.referidos as any;
    const referidosNormalized = Array.isArray(referidosRaw)
      ? { count: referidosRaw.length, users: referidosRaw }
      : (stats.referidos ?? { count: 0, users: [] });

    const normalizedStats = { ...stats, referidos: referidosNormalized };

    const totalExp = getTotalExp(normalizedStats.exp);
    const progress = computeLevelProgressFromExp(totalExp);

    return {
      stats: normalizedStats,
      totalExp,
      level: progress.level,
      progressPct: progress.pct,
      nextLevelExp: progress.nextReq,
      currentExpIntoLevel: progress.into,
    };
  }, [user]);
};
