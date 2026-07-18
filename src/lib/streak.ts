import { parseISO, differenceInCalendarDays, getISOWeek, getISOWeekYear } from "date-fns";

type StreakInput = {
  currentStreak: number;
  longestStreak: number;
  freezeTokens: number;
  lastReflectionDate: string | null;
  lastFreezeGrantWeek: string | null;
};

export type StreakResult = {
  currentStreak: number;
  longestStreak: number;
  freezeTokens: number;
  lastFreezeGrantWeek: string;
  lastReflectionDate: string;
  usedFreeze: boolean;
  alreadyReflectedToday: boolean;
};

function isoWeekKey(date: Date) {
  return `${getISOWeekYear(date)}-W${getISOWeek(date)}`;
}

/**
 * Applies today's reflection to a user's streak state.
 *
 * Rules:
 * - Consecutive day (gap of 1)  -> streak continues (+1)
 * - One missed day (gap of 2)   -> covered by a freeze token if available,
 *                                   streak still continues (+1)
 * - Bigger gap, or no token     -> streak resets to 1
 * - Every ISO week, the user is granted +1 freeze token (cap of 3)
 */
export function applyReflection(user: StreakInput, todayStr: string): StreakResult {
  const today = parseISO(todayStr);

  if (user.lastReflectionDate === todayStr) {
    return {
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      freezeTokens: user.freezeTokens,
      lastFreezeGrantWeek: user.lastFreezeGrantWeek || isoWeekKey(today),
      lastReflectionDate: todayStr,
      usedFreeze: false,
      alreadyReflectedToday: true,
    };
  }

  let currentStreak: number;
  let freezeTokens = user.freezeTokens;
  let usedFreeze = false;

  if (!user.lastReflectionDate) {
    currentStreak = 1;
  } else {
    const gap = differenceInCalendarDays(today, parseISO(user.lastReflectionDate));
    if (gap === 1) {
      currentStreak = user.currentStreak + 1;
    } else if (gap === 2 && freezeTokens > 0) {
      freezeTokens -= 1;
      currentStreak = user.currentStreak + 1;
      usedFreeze = true;
    } else {
      currentStreak = 1;
    }
  }

  const longestStreak = Math.max(user.longestStreak, currentStreak);

  const weekKey = isoWeekKey(today);
  let lastFreezeGrantWeek = user.lastFreezeGrantWeek || "";
  if (weekKey !== lastFreezeGrantWeek) {
    if (freezeTokens < 3) freezeTokens += 1;
    lastFreezeGrantWeek = weekKey;
  }

  return {
    currentStreak,
    longestStreak,
    freezeTokens,
    lastFreezeGrantWeek,
    lastReflectionDate: todayStr,
    usedFreeze,
    alreadyReflectedToday: false,
  };
}
