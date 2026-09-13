/**
 * Cloud Firestore Schema Definition & Single-Document State Management
 * 
 * Optimized for:
 * 1. Zero unnecessary database reads (curriculum cached locally, single meta check).
 * 2. Single-Document User State (all profile, stats, streak, progress, dailyQuest in users/{userId}).
 * 3. Exactly one atomic write per lesson completion.
 * 4. Offline persistence resilience.
 */

export interface SystemMeta {
  curriculumVersion: string; // e.g. "2.0.0"
  systemName?: string;
  updatedAt?: string;
  minAppVersion?: string;
}

export interface UserProfileSection {
  displayName: string;
  email: string;
  avatarUrl?: string;
  createdAt: number;
}

export interface UserStatsSection {
  level: number;
  xp: number;
  coins: number;
  gems: number;
  masteryTokens: number;
  arenaRating: number;
  arenaWins: number;
  totalTasksCompleted: number;
  timeSpentTotalSeconds?: number;
  weeklyTimeSpentMinutes?: number;
}

export interface UserStreakSection {
  currentDays: number;
  lastActiveDate?: string; // YYYY-MM-DD
  streakActiveDates: string[]; // YYYY-MM-DD[]
  activityHistory: Record<string, number>; // YYYY-MM-DD -> tasks count (last 14 days)
}

export interface LessonProgressItem {
  status: 'COMPLETED' | 'IN_PROGRESS';
  accuracy: number; // 0 - 100
  xpEarned: number;
  completedAt: string; // ISO 8601
}

export interface UserProgressSection {
  unlockedTopics: number[];
  completedTasks: string[];
  taskStars: Record<string, number>;
  completedLessons: Record<string, LessonProgressItem>;
}

export interface UserDailyQuestSection {
  date: string; // YYYY-MM-DD
  taskDescription: string;
  target: number;
  progress: number;
  isClaimed: boolean;
  rewardCoins: number;
  rewardXp: number;
}

export interface FirestoreUserDocument {
  profile: UserProfileSection;
  stats: UserStatsSection;
  streak: UserStreakSection;
  progress: UserProgressSection;
  dailyQuest: UserDailyQuestSection;

  // Flattened convenience fields for backward compatibility & direct access
  xp: number;
  coins: number;
  gems: number;
  level: number;
  campusRust: number;
  lastActive: number;
  arenaRating: number;
  arenaWins: number;
  masteryTokens: number;
  streakDays: number;
  lastStreakDate?: string;
  streakActiveDates?: string[];
  dailyTaskCounts?: Record<string, number>;
  claimedAchievements?: Record<string, number>;
  perks?: {
    xpBoostPercent: number;
    coinBoostPercent: number;
    streakFreezes: number;
    arenaShields: number;
    arenaTokenBonusPercent: number;
    temporaryXpBoostCharges?: number;
  };
  timeSpentTotalSeconds?: number;
  weeklyTimeSpentMinutes?: number;
  lastWeekKey?: string;
  maturaAttempts?: number;
  maturaBestScore?: number;
  hasCompletedOnboarding?: boolean;
  onboardingPreferences?: {
    targetExam: 'matura_2025' | 'poprawka' | 'e8';
    targetScore: '30' | '70' | '100';
    dailyMinutes: 5 | 10 | 15;
  };
}

/**
 * Calculates current ISO week key like "2025-W10"
 */
export function getCurrentIsoWeekKey(): string {
  const d = new Date();
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${date.getUTCFullYear()}-W${weekNo.toString().padStart(2, '0')}`;
}

/**
 * Deeply sanitizes object for Firestore by omitting any fields that have `undefined` value.
 */
export function removeUndefinedFields<T extends Record<string, any>>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => (item && typeof item === 'object' ? removeUndefinedFields(item) : item)) as any;
  }
  const sanitized: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      sanitized[key] = (value !== null && typeof value === 'object' && !(value instanceof Date))
        ? removeUndefinedFields(value)
        : value;
    }
  }
  return sanitized;
}

/**
 * Packs app state into the single Firestore document format.
 */
export function buildFirestoreUserPayload(
  userState: any,
  completedTasks: string[],
  taskStars: Record<string, number>,
  completedLessons: Record<string, LessonProgressItem>,
  authUser?: any
): Partial<FirestoreUserDocument> {
  const todayStr = new Date().toISOString().split('T')[0];
  const dailyCounts = userState.dailyTaskCounts || {};
  const todayTasks = dailyCounts[todayStr] || 0;

  // Build last 14 days activityHistory
  const activityHistory: Record<string, number> = {};
  const today = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dStr = d.toISOString().split('T')[0];
    activityHistory[dStr] = dailyCounts[dStr] || (userState.streakActiveDates?.includes(dStr) ? 1 : 0);
  }

  const profile: UserProfileSection = {
    displayName: authUser?.displayName || userState.profile?.displayName || 'Uczeń',
    email: authUser?.email || userState.profile?.email || '',
    avatarUrl: authUser?.photoURL || userState.profile?.avatarUrl || '',
    createdAt: userState.profile?.createdAt || Date.now()
  };

  const stats: UserStatsSection = {
    level: userState.level || 1,
    xp: userState.xp || 0,
    coins: userState.coins || 0,
    gems: userState.gems || 0,
    masteryTokens: userState.masteryTokens || 0,
    arenaRating: userState.arenaRating || 1000,
    arenaWins: userState.arenaWins || 0,
    totalTasksCompleted: completedTasks.length,
    timeSpentTotalSeconds: userState.timeSpentTotalSeconds || 0,
    weeklyTimeSpentMinutes: userState.weeklyTimeSpentMinutes || 0
  };

  const streak: UserStreakSection = {
    currentDays: userState.streakDays || 0,
    lastActiveDate: userState.lastStreakDate || null,
    streakActiveDates: userState.streakActiveDates || [],
    activityHistory
  };

  const progress: UserProgressSection = {
    unlockedTopics: userState.progress?.unlockedTopics || [0, 1],
    completedTasks: completedTasks,
    taskStars: taskStars,
    completedLessons: completedLessons
  };

  const dailyQuest: UserDailyQuestSection = {
    date: todayStr,
    taskDescription: 'Rozwiąż 3 zadania egzaminacyjne E8',
    target: 3,
    progress: Math.min(3, todayTasks),
    isClaimed: !!userState.dailyQuest?.isClaimed,
    rewardCoins: 20,
    rewardXp: 15
  };

  const rawPayload = {
    profile,
    stats,
    streak,
    progress,
    dailyQuest,

    // Flattened fields for backwards compatibility with all components
    xp: stats.xp,
    coins: stats.coins,
    gems: stats.gems,
    level: stats.level,
    campusRust: userState.campusRust || 0,
    lastActive: Date.now(),
    arenaRating: stats.arenaRating,
    arenaWins: stats.arenaWins,
    masteryTokens: stats.masteryTokens,
    streakDays: streak.currentDays,
    lastStreakDate: userState.lastStreakDate || null,
    streakActiveDates: streak.streakActiveDates,
    dailyTaskCounts: dailyCounts,
    claimedAchievements: userState.claimedAchievements || {},
    perks: userState.perks || {
      xpBoostPercent: 0,
      coinBoostPercent: 0,
      streakFreezes: 0,
      arenaShields: 0,
      arenaTokenBonusPercent: 0,
      temporaryXpBoostCharges: 0
    },
    timeSpentTotalSeconds: stats.timeSpentTotalSeconds,
    weeklyTimeSpentMinutes: stats.weeklyTimeSpentMinutes,
    lastWeekKey: userState.lastWeekKey || getCurrentIsoWeekKey(),
    maturaAttempts: userState.maturaAttempts || 0,
    maturaBestScore: userState.maturaBestScore || 0,
    hasCompletedOnboarding: userState.hasCompletedOnboarding ?? true,
    onboardingPreferences: userState.onboardingPreferences || null
  };

  return removeUndefinedFields(rawPayload);
}
