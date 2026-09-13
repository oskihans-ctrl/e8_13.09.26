import { UserPerks } from '../types';

export type AchievementCategory = 'tasks' | 'arena' | 'matura' | 'streak' | 'levels';

export interface AchievementTier {
  tier: number;
  tierName: string;
  target: number;
  rewardCoins: number;
  rewardTokens: number; // Arena Mastery Tokens
  rewardXp: number;
  rewardPerkDesc?: string;
  perkEffect?: {
    xpBoostPercent?: number;
    coinBoostPercent?: number;
    streakFreezes?: number;
    arenaShields?: number;
    arenaTokenBonusPercent?: number;
    temporaryXpBoostCharges?: number;
  };
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  iconName: string;
  accentColor: string;
  bgGradient: string;
  unit: string;
  tiers: AchievementTier[];
  getValue: (ctx: AchievementContext) => number;
}

export interface AchievementContext {
  completedTasksCount: number;
  arenaWins: number;
  arenaRating: number;
  streakDays: number;
  maturaAttempts: number;
  maturaBestScore: number;
  level: number;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_step',
    name: 'Pierwszy Krok',
    description: 'Rozwiąż swoje pierwsze zadanie z bazy Egzaminu Ósmoklasisty.',
    category: 'tasks',
    iconName: 'Sparkles',
    accentColor: 'text-sky-400',
    bgGradient: 'from-sky-500/20 to-blue-500/20',
    unit: 'zadanie',
    getValue: (ctx) => Math.min(1, ctx.completedTasksCount),
    tiers: [
      {
        tier: 1,
        tierName: 'Debiutant E8',
        target: 1,
        rewardCoins: 60,
        rewardTokens: 15,
        rewardXp: 80,
        rewardPerkDesc: '1x Tarcza Serii (Streak Freeze)',
        perkEffect: { streakFreezes: 1 }
      }
    ]
  },
  {
    id: 'powers_master',
    name: 'Mistrz Działu 1',
    description: 'Opanuj liczby i działania z Działu 1 E8.',
    category: 'tasks',
    iconName: 'Trophy',
    accentColor: 'text-cyan-400',
    bgGradient: 'from-cyan-500/20 to-blue-500/20',
    unit: 'zadań',
    getValue: (ctx) => Math.min(8, ctx.completedTasksCount),
    tiers: [
      {
        tier: 1,
        tierName: 'Adept Potęg',
        target: 3,
        rewardCoins: 75,
        rewardTokens: 20,
        rewardXp: 120,
        rewardPerkDesc: '+5% XP z Działu 1',
        perkEffect: { xpBoostPercent: 5 }
      },
      {
        tier: 2,
        tierName: 'Mistrz Działu 1',
        target: 8,
        rewardCoins: 200,
        rewardTokens: 50,
        rewardXp: 350,
        rewardPerkDesc: '1x Tarcza Serii & +10% Monet',
        perkEffect: { streakFreezes: 1, coinBoostPercent: 10 }
      }
    ]
  },
  {
    id: 'streak_3_days',
    name: 'Seria 3 Dni',
    description: 'Utrzymuj nieprzerwaną, codzienną serię nauki przez 3 dni z rzędu.',
    category: 'streak',
    iconName: 'Flame',
    accentColor: 'text-orange-400',
    bgGradient: 'from-orange-500/20 to-red-500/20',
    unit: 'dni',
    getValue: (ctx) => ctx.streakDays,
    tiers: [
      {
        tier: 1,
        tierName: 'Żelazny Płomień',
        target: 3,
        rewardCoins: 100,
        rewardTokens: 25,
        rewardXp: 150,
        rewardPerkDesc: '1x Tarcza Serii (Streak Freeze)',
        perkEffect: { streakFreezes: 1 }
      }
    ]
  },
  {
    id: 'flawless_exam',
    name: 'Bezbłędny Sprawdzian',
    description: 'Uzyskaj 100% poprawnych odpowiedzi w sprawdzianie lub wygraj pojedynek bezbłędnie.',
    category: 'matura',
    iconName: 'CheckCircle2',
    accentColor: 'text-emerald-400',
    bgGradient: 'from-emerald-500/20 to-teal-500/20',
    unit: 'test',
    getValue: (ctx) => (ctx.maturaBestScore >= 100 || ctx.arenaWins >= 1 ? 1 : 0),
    tiers: [
      {
        tier: 1,
        tierName: 'Bezbłędny Wynik',
        target: 1,
        rewardCoins: 120,
        rewardTokens: 30,
        rewardXp: 200,
        rewardPerkDesc: '+10% Monet z zadań',
        perkEffect: { coinBoostPercent: 10 }
      }
    ]
  },
  {
    id: 'tasks_master',
    name: 'Mistrz Zadań E8',
    description: 'Rozwiązuj zadania z bazy egzaminacyjnej ósmoklasisty.',
    category: 'tasks',
    iconName: 'CheckCircle2',
    accentColor: 'text-blue-400',
    bgGradient: 'from-blue-500/20 to-indigo-500/20',
    unit: 'zadań',
    getValue: (ctx) => ctx.completedTasksCount,
    tiers: [
      {
        tier: 1,
        tierName: 'Początkujący',
        target: 5,
        rewardCoins: 75,
        rewardTokens: 10,
        rewardXp: 100,
        rewardPerkDesc: '1x Tarcza Serii (Streak Freeze)',
        perkEffect: { streakFreezes: 1 }
      },
      {
        tier: 2,
        tierName: 'Praktyk',
        target: 15,
        rewardCoins: 150,
        rewardTokens: 25,
        rewardXp: 250,
        rewardPerkDesc: '+5% stały bonus XP do wszystkich zadań',
        perkEffect: { xpBoostPercent: 5 }
      },
      {
        tier: 3,
        tierName: 'Weteran',
        target: 35,
        rewardCoins: 300,
        rewardTokens: 50,
        rewardXp: 500,
        rewardPerkDesc: '1x Tarcza ELO na Arenę',
        perkEffect: { arenaShields: 1 }
      },
      {
        tier: 4,
        tierName: 'Ekspert',
        target: 75,
        rewardCoins: 600,
        rewardTokens: 100,
        rewardXp: 1000,
        rewardPerkDesc: '+10% stały bonus XP i +10% do monet',
        perkEffect: { xpBoostPercent: 10, coinBoostPercent: 10 }
      },
      {
        tier: 5,
        tierName: 'Arcymistrz E8',
        target: 150,
        rewardCoins: 1500,
        rewardTokens: 250,
        rewardXp: 2500,
        rewardPerkDesc: 'Złoty Mnożnik: +15% XP & +20% Żetonów Areny',
        perkEffect: { xpBoostPercent: 15, arenaTokenBonusPercent: 20, streakFreezes: 2 }
      }
    ]
  },
  {
    id: 'arena_warrior',
    name: 'Gladiator Areny',
    description: 'Wygrywaj błyskawiczne pojedynki 1v1 w Arenie wiedzy.',
    category: 'arena',
    iconName: 'Swords',
    accentColor: 'text-red-400',
    bgGradient: 'from-red-500/20 to-orange-500/20',
    unit: 'wygranych',
    getValue: (ctx) => ctx.arenaWins,
    tiers: [
      {
        tier: 1,
        tierName: 'Pretendent',
        target: 1,
        rewardCoins: 50,
        rewardTokens: 15,
        rewardXp: 80,
        rewardPerkDesc: '1x Tarcza ELO (chroni przed stratą rankingu)',
        perkEffect: { arenaShields: 1 }
      },
      {
        tier: 2,
        tierName: 'Szermierz',
        target: 5,
        rewardCoins: 120,
        rewardTokens: 35,
        rewardXp: 200,
        rewardPerkDesc: '+15% więcej Żetonów Mistrzostwa za każdą wygraną',
        perkEffect: { arenaTokenBonusPercent: 15 }
      },
      {
        tier: 3,
        tierName: 'Pogromca',
        target: 15,
        rewardCoins: 300,
        rewardTokens: 80,
        rewardXp: 450,
        rewardPerkDesc: '2x Tarcza ELO na Arenę',
        perkEffect: { arenaShields: 2 }
      },
      {
        tier: 4,
        tierName: 'Czempion Areny',
        target: 30,
        rewardCoins: 700,
        rewardTokens: 180,
        rewardXp: 1200,
        rewardPerkDesc: '+25% Żetonów Areny & Tytuł Czempiona',
        perkEffect: { arenaTokenBonusPercent: 25, xpBoostPercent: 10 }
      }
    ]
  },
  {
    id: 'arena_rating',
    name: 'Wspinaczka Rankingowa',
    description: 'Zdobywaj wyższe punkty ratingu ELO w pojedynkach Areny.',
    category: 'arena',
    iconName: 'Trophy',
    accentColor: 'text-cyan-400',
    bgGradient: 'from-cyan-500/20 to-blue-500/20',
    unit: 'ELO',
    getValue: (ctx) => ctx.arenaRating,
    tiers: [
      {
        tier: 1,
        tierName: 'Brązowa Ranga',
        target: 1050,
        rewardCoins: 60,
        rewardTokens: 20,
        rewardXp: 100,
        rewardPerkDesc: '1x Tarcza ELO Areny',
        perkEffect: { arenaShields: 1 }
      },
      {
        tier: 2,
        tierName: 'Srebrna Ranga',
        target: 1100,
        rewardCoins: 150,
        rewardTokens: 45,
        rewardXp: 250,
        rewardPerkDesc: '+10% Monet z zadań',
        perkEffect: { coinBoostPercent: 10 }
      },
      {
        tier: 3,
        tierName: 'Złota Ranga',
        target: 1200,
        rewardCoins: 400,
        rewardTokens: 100,
        rewardXp: 600,
        rewardPerkDesc: '1x Tarcza Serii & 2x Tarcza ELO',
        perkEffect: { streakFreezes: 1, arenaShields: 2 }
      },
      {
        tier: 4,
        tierName: 'Mistrzowska Ranga',
        target: 1350,
        rewardCoins: 1000,
        rewardTokens: 250,
        rewardXp: 1500,
        rewardPerkDesc: 'Prestiżowy Mnożnik: +15% XP i +15% Monet',
        perkEffect: { xpBoostPercent: 15, coinBoostPercent: 15 }
      }
    ]
  },
  {
    id: 'matura_specialist',
    name: 'Symulator Matury',
    description: 'Podejmuj próby egzaminacyjne w Symulatorze Matury.',
    category: 'matura',
    iconName: 'GraduationCap',
    accentColor: 'text-purple-400',
    bgGradient: 'from-purple-500/20 to-pink-500/20',
    unit: 'arkuszy',
    getValue: (ctx) => ctx.maturaAttempts,
    tiers: [
      {
        tier: 1,
        tierName: 'Pierwsze Podejście',
        target: 1,
        rewardCoins: 50,
        rewardTokens: 15,
        rewardXp: 100,
        rewardPerkDesc: '1x Tarcza Serii (Streak Freeze)',
        perkEffect: { streakFreezes: 1 }
      },
      {
        tier: 2,
        tierName: 'Egzaminowany',
        target: 3,
        rewardCoins: 150,
        rewardTokens: 40,
        rewardXp: 300,
        rewardPerkDesc: '+10% bonus XP z Symulatora',
        perkEffect: { xpBoostPercent: 10 }
      },
      {
        tier: 3,
        tierName: 'Maturzysta z Klasą',
        target: 8,
        rewardCoins: 400,
        rewardTokens: 100,
        rewardXp: 800,
        rewardPerkDesc: 'Doładowanie: Podwójne XP na 5 zadań',
        perkEffect: { temporaryXpBoostCharges: 5, streakFreezes: 1 }
      }
    ]
  },
  {
    id: 'streak_keeper',
    name: 'Płomień Wytrwałości',
    description: 'Utrzymuj codzienną serię nauki i rozwiązuj regularnie zadania.',
    category: 'streak',
    iconName: 'Flame',
    accentColor: 'text-orange-400',
    bgGradient: 'from-orange-500/20 to-sky-500/20',
    unit: 'dni',
    getValue: (ctx) => Math.max(1, ctx.streakDays),
    tiers: [
      {
        tier: 1,
        tierName: 'Iskra',
        target: 3,
        rewardCoins: 40,
        rewardTokens: 10,
        rewardXp: 80,
        rewardPerkDesc: '1x Tarcza Serii w ekwipunku',
        perkEffect: { streakFreezes: 1 }
      },
      {
        tier: 2,
        tierName: 'Ogień',
        target: 7,
        rewardCoins: 150,
        rewardTokens: 35,
        rewardXp: 250,
        rewardPerkDesc: '+10% do monet i kolejna Tarcza Serii',
        perkEffect: { coinBoostPercent: 10, streakFreezes: 1 }
      },
      {
        tier: 3,
        tierName: 'Żar Kampusu',
        target: 14,
        rewardCoins: 350,
        rewardTokens: 80,
        rewardXp: 600,
        rewardPerkDesc: '2x Tarcza Serii & Tarcza ELO Areny',
        perkEffect: { streakFreezes: 2, arenaShields: 1 }
      },
      {
        tier: 4,
        tierName: 'Żelazna Dyscyplina',
        target: 30,
        rewardCoins: 800,
        rewardTokens: 200,
        rewardXp: 1500,
        rewardPerkDesc: 'Maksymalny bonus wytrwałości: +15% XP & 3x Tarcza Serii',
        perkEffect: { xpBoostPercent: 15, streakFreezes: 3 }
      }
    ]
  },
  {
    id: 'level_ascent',
    name: 'Poziom Mistrza',
    description: 'Zbieraj punkty doświadczenia i podnoś poziom swojego konta.',
    category: 'levels',
    iconName: 'Sparkles',
    accentColor: 'text-emerald-400',
    bgGradient: 'from-emerald-500/20 to-teal-500/20',
    unit: 'lvl',
    getValue: (ctx) => ctx.level,
    tiers: [
      {
        tier: 1,
        tierName: 'Adept',
        target: 2,
        rewardCoins: 50,
        rewardTokens: 15,
        rewardXp: 50,
        rewardPerkDesc: 'Pierwszy krok na ścieżce mistrzostwa',
        perkEffect: { streakFreezes: 1 }
      },
      {
        tier: 2,
        tierName: 'Student',
        target: 5,
        rewardCoins: 200,
        rewardTokens: 50,
        rewardXp: 200,
        rewardPerkDesc: '+10% XP i 1x Tarcza ELO Areny',
        perkEffect: { xpBoostPercent: 10, arenaShields: 1 }
      },
      {
        tier: 3,
        tierName: 'Profesor',
        target: 10,
        rewardCoins: 600,
        rewardTokens: 150,
        rewardXp: 500,
        rewardPerkDesc: '+15% Monet & +15% XP & 2x Tarcza Serii',
        perkEffect: { xpBoostPercent: 15, coinBoostPercent: 15, streakFreezes: 2 }
      }
    ]
  }
];

export interface AchievementProgressInfo {
  achievement: Achievement;
  currentValue: number;
  claimedTier: number; // 0 if none claimed
  activeTierIndex: number;
  activeTier: AchievementTier | null;
  isFullyCompleted: boolean;
  canClaim: boolean;
  progressPercent: number;
}

export function getAchievementProgress(
  achievement: Achievement,
  context: AchievementContext,
  claimedAchievements: Record<string, number> = {}
): AchievementProgressInfo {
  const currentValue = achievement.getValue(context);
  const claimedTier = claimedAchievements[achievement.id] || 0;

  // Next tier to complete / claim
  const activeTier = achievement.tiers.find(t => t.tier === claimedTier + 1) || null;
  const isFullyCompleted = claimedTier >= achievement.tiers[achievement.tiers.length - 1].tier;

  let canClaim = false;
  let progressPercent = 0;

  if (activeTier) {
    canClaim = currentValue >= activeTier.target;
    // Calculate progress towards active tier
    const prevTarget = claimedTier > 0 
      ? achievement.tiers.find(t => t.tier === claimedTier)?.target || 0 
      : 0;
    
    const range = activeTier.target - prevTarget;
    const currentInRange = Math.max(0, currentValue - prevTarget);
    progressPercent = range > 0 ? Math.min(100, Math.floor((currentInRange / range) * 100)) : 100;
  } else if (isFullyCompleted) {
    progressPercent = 100;
  }

  const activeTierIndex = activeTier ? activeTier.tier - 1 : achievement.tiers.length - 1;

  return {
    achievement,
    currentValue,
    claimedTier,
    activeTierIndex,
    activeTier,
    isFullyCompleted,
    canClaim,
    progressPercent
  };
}

export function countTotalClaimable(
  context: AchievementContext,
  claimedAchievements: Record<string, number> = {}
): number {
  return ACHIEVEMENTS.reduce((count, ach) => {
    const progress = getAchievementProgress(ach, context, claimedAchievements);
    return progress.canClaim ? count + 1 : count;
  }, 0);
}

// Perks Vault / Shop items purchasable with Mastery Tokens & Coins
export interface ShopItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  tokenPrice: number; // in Mastery Tokens
  coinPrice: number; // alternative or additional in Coins
  category: 'boost' | 'shield' | 'streak';
  effectType: 'streakFreeze' | 'arenaShield' | 'xpDouble' | 'coinBooster';
  amount: number;
}

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'streak_freeze',
    name: 'Tarcza Serii (Streak Freeze)',
    description: 'Chroni Twój licznik dni nauki przed przerwaniem i natychmiast usuwa rdzę (Campus Rust).',
    icon: 'Shield',
    tokenPrice: 35,
    coinPrice: 200,
    category: 'streak',
    effectType: 'streakFreeze',
    amount: 1
  },
  {
    id: 'arena_shield',
    name: 'Tarcza ELO Areny',
    description: 'Chroni przed utratą -15 punktów ELO przy kolejnej porażce w pojedynku 1v1 na Arenie.',
    icon: 'ShieldCheck',
    tokenPrice: 50,
    coinPrice: 350,
    category: 'shield',
    effectType: 'arenaShield',
    amount: 1
  },
  {
    id: 'xp_double',
    name: 'Doładowanie 2x XP (3 zadania)',
    description: 'Podwaja zdobywane punkty doświadczenia z kolejnych 3 rozwiązanych zadań.',
    icon: 'Zap',
    tokenPrice: 40,
    coinPrice: 250,
    category: 'boost',
    effectType: 'xpDouble',
    amount: 3
  },
  {
    id: 'champion_avatar',
    name: 'Złoty Awatar Mistrza',
    description: 'Prestiżowy awatar z koroną i lśniącą aurą mistrzowską, wyróżniający Twój profil w grze.',
    icon: 'Crown',
    tokenPrice: 60,
    coinPrice: 500,
    category: 'boost',
    effectType: 'coinBooster',
    amount: 1
  }
];
