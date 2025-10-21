import { useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/context/AuthContext';
import {
  computeLevelProgressFromExp,
  ensureReferralCode,
  ensureUserStats,
  getTotalExp,
  getUserStats,
  subscribeToLevelUpStats,
} from '@/utils/levelup';
import type {
  LevelUpStatsEventDetail,
  LevelUpUserStats,
} from '@/utils/levelup';
import { normalizeRun } from '@/utils/users';

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

const shouldRefresh = (
  detail: LevelUpStatsEventDetail | null,
  runKey: string
): boolean => {
  if (!detail || !Array.isArray(detail.runs) || detail.runs.length === 0) {
    return true;
  }
  return detail.runs.some((run) => normalizeRun(run) === runKey);
};

export const useLevelUpStats = (): LevelUpState => {
  const { user } = useAuth();
  const [state, setState] = useState<LevelUpState>(initialState);

  useEffect(() => {
    if (!user) {
      setState(initialState);
      return;
    }
    const runKey = normalizeRun(user.run);
    if (!runKey) {
      setState(initialState);
      return;
    }

    ensureUserStats(runKey);
    ensureReferralCode(runKey);

    const loadStats = () => {
      const stats = getUserStats(runKey);
      const totalExp = getTotalExp(stats.exp);
      const progress = computeLevelProgressFromExp(totalExp);
      setState({
        stats,
        totalExp,
        level: progress.level,
        progressPct: progress.pct,
        nextLevelExp: progress.nextReq,
        currentExpIntoLevel: progress.into,
      });
    };

    loadStats();

    const unsubscribe = subscribeToLevelUpStats((detail) => {
      if (!runKey) return;
      if (shouldRefresh(detail, runKey)) {
        loadStats();
      }
    });

    return () => {
      unsubscribe?.();
    };
  }, [user]);

  return useMemo(() => state, [state]);
};
