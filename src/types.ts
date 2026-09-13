export interface UserPerks {
  xpBoostPercent: number; // e.g. 15 = +15% XP from tasks and matura
  coinBoostPercent: number; // e.g. 10 = +10% coins
  streakFreezes: number; // count of streak freezes (protects streak & rust)
  arenaShields: number; // count of ELO loss protection shields in Arena
  arenaTokenBonusPercent: number; // extra tokens on Arena win
  temporaryXpBoostCharges?: number; // 2x XP for next N tasks
}

export interface UserState {
  xp: number;
  coins: number;
  gems: number;
  masteryTokens?: number; // Arena Mastery Tokens
  arenaRating?: number; // Current ELO rating
  arenaWins?: number; // Total Arena wins
  streakDays: number; // Active streak count - single source of truth
  lastStreakDate?: string; // YYYY-MM-DD of last completed task
  streakActiveDates?: string[]; // Array of YYYY-MM-DD strings for completed days
  dailyTaskCounts?: Record<string, number>; // YYYY-MM-DD -> tasks completed count
  dailyQuestsClaimed?: Record<string, number[]>; // YYYY-MM-DD -> array of claimed tier IDs [1, 2, 3]
  maturaAttempts?: number; // Finished matura exam attempts
  maturaBestScore?: number; // Best score percentage in matura
  level: number;
  campusRust: number; // 0-100%
  lastActive: number;
  claimedAchievements?: Record<string, number>; // achievementId -> highest claimed tier (1-5)
  perks?: UserPerks;
  timeSpentTotalSeconds?: number; // Total active study time in seconds
  weeklyTimeSpentMinutes?: number; // Active study minutes this week (resets Monday 00:00)
  lastWeekKey?: string; // e.g. "2025-W10"
  hasCompletedOnboarding?: boolean;
  onboardingPreferences?: {
    targetExam: 'matura_2025' | 'poprawka' | 'e8';
    targetScore: '30' | '70' | '100';
    dailyMinutes: 5 | 10 | 15;
  };
}

export interface WorkedExampleStep {
  step_num: number;
  label?: string;
  explanation: string;
  latex?: string;
}

export interface WorkedExample {
  problem: string;
  step1?: string;
  step2?: string;
  steps?: WorkedExampleStep[];
  result?: string;
}

export interface LessonTheoryPill {
  lessonId?: string;
  title?: string;
  concept_essence?: string;
  matura_context?: string;
  core_formulas?: string;
  formula_notes?: string;
  coreFormulaLatex?: string;
  worked_example?: WorkedExample;
  exam_trap?: string;
  intuition?: string;
  keyTakeaway?: string;
  trapAlert?: string;
  summary?: string;
}

export type TabState = 'dashboard' | 'nauka' | 'arena' | 'profile' | 'simulator';

export type TaskType = 'SINGLE_CHOICE' | 'MULTI_CHOICE' | 'NUMERIC_INPUT' | 'OPEN_PROOF' | 'theory';
export type CkeTaskType = TaskType;

export interface TaskOption {
  id: string; // e.g. "A", "B", "C", "D"
  content_latex: string; // e.g. "$3^5$"
  is_correct: boolean;
}

export interface TaskSolutionStep {
  step_num: number;
  description: string;
  latex?: string;
}

export interface TaskHints {
  level_1: string;
  level_2: string;
  ai_tutor_prompt: string;
}

export interface MathTaskItem {
  id: string;
  type: TaskType;
  source?: string; // e.g. "CKE Egzamin Ósmoklasisty • Zadanie 1"
  cke_source?: string; // backwards compatibility
  title: string;
  topic: string;
  instruction: string;
  math_statement: string; // LaTeX expression with $...$ delimiters
  question?: string; // backwards compatibility fallback
  options?: TaskOption[];
  required_selections_count?: number;
  numeric_correct_answer?: string | number;
  numeric_unit?: string;
  hints: TaskHints;
  official_solution_steps: TaskSolutionStep[];
  officialKey?: string; // backwards compatibility
  maxPoints?: number;
  xp?: number;
  difficulty?: string;
  time?: string;
}
