/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { UserState, TabState, UserPerks } from './types';
import { DashboardView } from './components/DashboardView';
import { LearnView } from './components/LearnView';
import { ArenaView } from './components/ArenaView';
import { MaturaSimulatorView } from './components/MaturaSimulatorView';
import { ProfileView } from './components/ProfileView';
import { Navigation } from './components/Navigation';
import { Header } from './components/Header';
import { TaskView } from './components/TaskView';
import { SessionRunner } from './components/SessionRunner';
import { RewardPopup } from './components/RewardPopup';
import { auth, db, loginWithGoogle } from './lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight, LogIn, User } from 'lucide-react';
import { OnboardingOverlay, OnboardingPreferences } from './components/OnboardingOverlay';
import { ProPopup } from './components/ProPopup';
import { AuthModal } from './components/AuthModal';
import { ACHIEVEMENTS, ShopItem } from './data/achievements';
import { triggerHaptic, calculateStreakOnTaskCompletion, getTodayDateString } from './utils';
import { buildFirestoreUserPayload } from './schema_firestore';
import { checkSystemMetaVersion } from './lib/curriculumSync';
import { handleFirestoreError, OperationType } from './lib/firestoreErrors';

import { LoadingScreen } from './components/Loading';

function getCurrentIsoWeekKey(): string {
  const d = new Date();
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${date.getUTCFullYear()}-W${weekNo.toString().padStart(2, '0')}`;
}

export default function App() {
  const [user, loading] = useAuthState(auth);
  const [completedTasks, setCompletedTasks] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('matura_quest_completed_tasks');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [taskStars, setTaskStars] = useState<Record<string, number>>(() => {
    try {
      const stored = localStorage.getItem('matura_quest_task_stars');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Rule 1: Check system/meta version once upon startup (cached, 0 extra reads if up to date)
  useEffect(() => {
    checkSystemMetaVersion().catch(err => console.info("Curriculum meta check:", err));
  }, []);
  const [currentTab, setCurrentTab] = useState<TabState>('dashboard');

  // Reset scroll position to top when navigating between tabs
  useEffect(() => {
    const mainContainer = document.getElementById('main-scroll-container');
    if (mainContainer) {
      mainContainer.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [currentTab]);
  const [activeTask, setActiveTask] = useState<boolean>(false);
  const [activeTaskData, setActiveTaskData] = useState<any>(null);
  const [reward, setReward] = useState<{ 
    xp: number; 
    coins: number; 
    tokens?: number; 
    levelUp?: number; 
    title?: string; 
    description?: string; 
    bonusNote?: string 
  } | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showGuestPrompt, setShowGuestPrompt] = useState(false);
  const [showProPopup, setShowProPopup] = useState(false);
  const [isSubjectSheetOpen, setIsSubjectSheetOpen] = useState(false);
  const [profileInitialTab, setProfileInitialTab] = useState<'overview' | 'achievements' | 'perks'>('overview');
  
  const [userState, setUserState] = useState<UserState>({
    xp: 0,
    coins: 0,
    gems: 0,
    level: 1,
    campusRust: 0,
    lastActive: Date.now(),
    arenaRating: 1000,
    arenaWins: 0,
    masteryTokens: 0,
    streakDays: 0,
    streakActiveDates: [],
    dailyTaskCounts: {},
    claimedAchievements: {},
    timeSpentTotalSeconds: 0,
    weeklyTimeSpentMinutes: 0,
    lastWeekKey: getCurrentIsoWeekKey(),
    perks: {
      xpBoostPercent: 0,
      coinBoostPercent: 0,
      streakFreezes: 0,
      arenaShields: 0,
      arenaTokenBonusPercent: 0,
      temporaryXpBoostCharges: 0,
    },
    maturaAttempts: 0
  });

  useEffect(() => {
    let unsubscribe = () => {};
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      unsubscribe = onSnapshot(userRef, async (snap) => {
        if (snap.exists()) {
          const data = snap.data() as any;

          // Rule 2: Single-Document User State (users/{userId})
          const stats = data.stats || {};
          const streak = data.streak || {};
          const progress = data.progress || {};

          // Populate completed tasks and stars from single document
          const loadedCompleted = progress.completedTasks || data.completedTasks || [];
          const loadedStars = progress.taskStars || data.taskStars || {};
          
          setCompletedTasks(loadedCompleted);
          setTaskStars(loadedStars);
          try {
            localStorage.setItem("matura_quest_completed_tasks", JSON.stringify(loadedCompleted));
            localStorage.setItem("matura_quest_task_stars", JSON.stringify(loadedStars));
          } catch {}

          setUserState(prev => ({
            ...prev,
            ...data,
            xp: stats.xp ?? data.xp ?? prev.xp,
            coins: stats.coins ?? data.coins ?? prev.coins,
            gems: stats.gems ?? data.gems ?? prev.gems,
            level: stats.level ?? data.level ?? prev.level,
            arenaRating: stats.arenaRating ?? data.arenaRating ?? prev.arenaRating,
            arenaWins: stats.arenaWins ?? data.arenaWins ?? prev.arenaWins,
            masteryTokens: stats.masteryTokens ?? data.masteryTokens ?? prev.masteryTokens,
            streakDays: streak.currentDays ?? data.streakDays ?? prev.streakDays,
            lastStreakDate: streak.lastActiveDate ?? data.lastStreakDate ?? prev.lastStreakDate,
            streakActiveDates: streak.streakActiveDates ?? data.streakActiveDates ?? prev.streakActiveDates,
            dailyTaskCounts: streak.activityHistory ?? data.dailyTaskCounts ?? prev.dailyTaskCounts ?? {},
            timeSpentTotalSeconds: stats.timeSpentTotalSeconds ?? data.timeSpentTotalSeconds ?? prev.timeSpentTotalSeconds ?? 0,
            weeklyTimeSpentMinutes: stats.weeklyTimeSpentMinutes ?? data.weeklyTimeSpentMinutes ?? prev.weeklyTimeSpentMinutes ?? 0,
            lastWeekKey: stats.lastWeekKey ?? data.lastWeekKey ?? prev.lastWeekKey ?? getCurrentIsoWeekKey(),
            perks: {
              xpBoostPercent: 0,
              coinBoostPercent: 0,
              streakFreezes: 0,
              arenaShields: 0,
              arenaTokenBonusPercent: 0,
              temporaryXpBoostCharges: 0,
              ...(data.perks || {})
            },
            claimedAchievements: data.claimedAchievements || {}
          }));

          if (!data.hasCompletedOnboarding) {
            setIsNewUser(true);
          }
        } else {
          // New User Setup - initialize in Single-Document format
          let guestData: Partial<UserState> = {};
          try {
            const savedGuest = localStorage.getItem('matura_quest_guest_user');
            if (savedGuest) guestData = JSON.parse(savedGuest);
          } catch (e) {}

          let localCompleted: string[] = [];
          let localStars: Record<string, number> = {};
          try {
            const storedC = localStorage.getItem('matura_quest_completed_tasks');
            const storedS = localStorage.getItem('matura_quest_task_stars');
            if (storedC) localCompleted = JSON.parse(storedC);
            if (storedS) localStars = JSON.parse(storedS);
          } catch {}

          const newState: UserState = {
            xp: guestData.xp || 0,
            coins: Math.max(100, guestData.coins || 100),
            gems: Math.max(5, guestData.gems || 5),
            level: guestData.level || 1,
            campusRust: 0,
            lastActive: Date.now(),
            arenaRating: guestData.arenaRating || 1000,
            arenaWins: guestData.arenaWins || 0,
            masteryTokens: guestData.masteryTokens || 0,
            streakDays: guestData.streakDays || 0,
            lastStreakDate: guestData.lastStreakDate || undefined,
            streakActiveDates: guestData.streakActiveDates || [],
            dailyTaskCounts: guestData.dailyTaskCounts || {},
            claimedAchievements: guestData.claimedAchievements || {},
            lastWeekKey: guestData.lastWeekKey || getCurrentIsoWeekKey(),
            timeSpentTotalSeconds: guestData.timeSpentTotalSeconds || 0,
            weeklyTimeSpentMinutes: guestData.weeklyTimeSpentMinutes || 0,
            hasCompletedOnboarding: guestData.hasCompletedOnboarding ?? true,
            onboardingPreferences: guestData.onboardingPreferences,
            perks: {
              xpBoostPercent: 0,
              coinBoostPercent: 0,
              streakFreezes: 0,
              arenaShields: 0,
              arenaTokenBonusPercent: 0,
              temporaryXpBoostCharges: 0,
              ...(guestData.perks || {})
            },
            maturaAttempts: guestData.maturaAttempts || 0,
            maturaBestScore: guestData.maturaBestScore || 0
          };

          const singleDocPayload = buildFirestoreUserPayload(
            newState,
            localCompleted,
            localStars,
            {},
            user
          );

          await setDoc(userRef, singleDocPayload, { merge: true });
          setUserState(newState);
          setCompletedTasks(localCompleted);
          setTaskStars(localStars);
          setIsNewUser(true);
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
      });
    } else if (!loading) {
      // Guest mode initialization from localStorage
      const savedGuest = localStorage.getItem('matura_quest_guest_user');
      if (savedGuest) {
        try {
          const parsed = JSON.parse(savedGuest);
          setUserState(prev => ({
            ...prev,
            ...parsed,
            streakDays: typeof parsed.streakDays === 'number' ? parsed.streakDays : (prev.streakDays || 0),
            streakActiveDates: Array.isArray(parsed.streakActiveDates) ? parsed.streakActiveDates : (prev.streakActiveDates || []),
            lastStreakDate: parsed.lastStreakDate || prev.lastStreakDate,
            perks: {
              xpBoostPercent: 0,
              coinBoostPercent: 0,
              streakFreezes: 0,
              arenaShields: 0,
              arenaTokenBonusPercent: 0,
              temporaryXpBoostCharges: 0,
              ...(parsed.perks || {})
            },
            claimedAchievements: parsed.claimedAchievements || {}
          }));
        } catch (e) {
          console.error("Failed to parse guest state:", e);
        }
      } else {
        setUserState({
          xp: 0,
          coins: 50,
          gems: 5,
          level: 1,
          campusRust: 0,
          lastActive: Date.now(),
          arenaRating: 1000,
          arenaWins: 0,
          masteryTokens: 0,
          streakDays: 0,
          streakActiveDates: [],
          claimedAchievements: {},
          perks: {
            xpBoostPercent: 0,
            coinBoostPercent: 0,
            streakFreezes: 0,
            arenaShields: 0,
            arenaTokenBonusPercent: 0,
            temporaryXpBoostCharges: 0,
          },
          maturaAttempts: 0
        });
      }

      // Check if user has already completed onboarding
      const guestOnboardingCompleted = localStorage.getItem('matura_quest_onboarding_completed') === 'true';
      if (!guestOnboardingCompleted) {
        setTimeout(() => setShowGuestPrompt(true), 600);
      }
    }
    return () => unsubscribe();
  }, [user, loading]);

  const handleOnboardingComplete = async (prefs: OnboardingPreferences, shouldOpenAuth: boolean = false) => {
    triggerHaptic('success');
    const todayStr = getTodayDateString();

    const currentStreakDates = userState.streakActiveDates || [];
    const updatedStreakDates = currentStreakDates.includes(todayStr)
      ? currentStreakDates
      : [...currentStreakDates, todayStr];

    const currentDailyCounts = userState.dailyTaskCounts || {};
    const updatedDailyCounts = {
      ...currentDailyCounts,
      [todayStr]: (currentDailyCounts[todayStr] || 0) + 1
    };

    const updatedState: UserState = {
      ...userState,
      xp: (userState.xp || 0) + 15,
      coins: (userState.coins || 0) + 20,
      streakDays: Math.max(1, userState.streakDays || 1),
      lastStreakDate: todayStr,
      streakActiveDates: updatedStreakDates,
      dailyTaskCounts: updatedDailyCounts,
      hasCompletedOnboarding: true,
      onboardingPreferences: prefs
    };

    setUserState(updatedState);
    await saveUserData(updatedState);

    try {
      localStorage.setItem('matura_quest_onboarding_completed', 'true');
      localStorage.setItem('matura_quest_onboarding_prefs', JSON.stringify(prefs));
    } catch (e) {}

    setShowGuestPrompt(false);
    setIsNewUser(false);
    setCurrentTab('nauka');

    setReward({
      xp: 15,
      coins: 20,
      title: 'Plan Nauki Uruchomiony!',
      bonusNote: 'Dzień 1 Serii rozpalony! Powodzenia w Dziale 1.'
    });

    if (shouldOpenAuth) {
      setTimeout(() => setShowAuthModal(true), 400);
    }
  };

  const saveUserData = async (newState: UserState) => {
    if (user) {
      try {
        const userRef = doc(db, 'users', user.uid);
        const payload = buildFirestoreUserPayload(
          newState,
          completedTasks,
          taskStars,
          (userState as any).completedLessons || {},
          user
        );
        await setDoc(userRef, payload, { merge: true });
      } catch (err) {
        console.error("Failed to save user data to Firestore:", err);
      }
    } else {
      try {
        localStorage.setItem('matura_quest_guest_user', JSON.stringify(newState));
      } catch (e) {
        console.error("Failed to save guest state to localStorage:", e);
      }
    }
  };

  const handleStartTask = (task?: any, lessonTasks?: any[], lessonTitle?: string, nextLesson?: any) => {
    try {
      const stored = localStorage.getItem('matura_quest_last_viewed');
      const parsed = stored ? JSON.parse(stored) : {};
      localStorage.setItem('matura_quest_last_viewed', JSON.stringify({
        ...parsed,
        viewState: 'lessons'
      }));
    } catch {}

    setActiveTaskData({
      ...(task || {}),
      lessonTasks: lessonTasks || task?.lessonTasks || (task ? [task] : []),
      lessonTitle: lessonTitle || task?.lessonTitle || task?.topic || 'Lekcja',
      nextLesson: nextLesson || task?.nextLesson
    });
    setActiveTask(true);
  };

  const handleCancelTask = () => {
    setActiveTask(false);
    setActiveTaskData(null);
  };

  // Rule 3: Single atomic write per lesson completion (No write-bombing, 0 writes during questions)
  const handleCompleteTask = async (
    taskIds?: string | string[],
    stars: number = 3,
    earnedXp: number = 30,
    earnedCoins: number = 10,
    nextLesson?: any,
    sessionDurationSeconds: number = 0
  ) => {
    const idsToAdd = Array.isArray(taskIds) 
      ? taskIds 
      : (taskIds ? [taskIds] : []);

    let currentCompleted = [...completedTasks];
    let newTaskStars = { ...taskStars };

    idsToAdd.forEach(id => {
      if (!currentCompleted.includes(id)) {
        currentCompleted.push(id);
      }
      newTaskStars[id] = Math.max(newTaskStars[id] || 0, stars);
    });

    if (idsToAdd.length > 0) {
      setCompletedTasks(currentCompleted);
      setTaskStars(newTaskStars);
      try {
        localStorage.setItem("matura_quest_completed_tasks", JSON.stringify(currentCompleted));
        localStorage.setItem("matura_quest_task_stars", JSON.stringify(newTaskStars));
      } catch (e) {
        console.error("Error saving local cache progress:", e);
      }
    }
    
    const todayStr = getTodayDateString();

    // Determine lesson key (e.g. "1.1") from lessonTitle
    const lessonTitle = activeTaskData?.lessonTitle || '';
    const match = lessonTitle.match(/Lekcja\s+([\d.]+)/i);
    const lessonKey = match ? match[1] : (activeTaskData?.lessonId || '1.1');

    setUserState(prev => {
      const isDoubleXp = (prev.perks?.temporaryXpBoostCharges || 0) > 0;
      const xpBoostPct = prev.perks?.xpBoostPercent || 0;
      const baseXp = isDoubleXp ? earnedXp * 2 : earnedXp;
      const xpGained = Math.round(baseXp * (1 + xpBoostPct / 100));

      const coinBoostPct = prev.perks?.coinBoostPercent || 0;
      const coinsGained = Math.round(earnedCoins * (1 + coinBoostPct / 100));

      const newXp = prev.xp + xpGained;
      const newLevel = Math.floor(newXp / 1000) + 1;

      const newCharges = isDoubleXp 
        ? Math.max(0, (prev.perks?.temporaryXpBoostCharges || 1) - 1) 
        : (prev.perks?.temporaryXpBoostCharges || 0);

      const streakCalc = calculateStreakOnTaskCompletion(
        prev.streakDays || 0,
        prev.lastStreakDate,
        prev.streakActiveDates || []
      );

      const tasksCompletedCount = idsToAdd.length || 1;
      const updatedDailyCounts = {
        ...(prev.dailyTaskCounts || {}),
        [todayStr]: ((prev.dailyTaskCounts || {})[todayStr] || 0) + tasksCompletedCount
      };

      const existingCompletedLessons = (prev as any).progress?.completedLessons || (prev as any).completedLessons || {};
      const updatedCompletedLessons = {
        ...existingCompletedLessons,
        [lessonKey]: {
          status: 'COMPLETED' as const,
          accuracy: 100,
          xpEarned: xpGained,
          completedAt: new Date().toISOString()
        }
      };

      // Active Time Tracking Engine: total seconds + weekly minutes with Monday 00:00 reset
      const currentWeekKey = getCurrentIsoWeekKey();
      const isNewWeek = prev.lastWeekKey && prev.lastWeekKey !== currentWeekKey;
      const baseWeeklyMinutes = isNewWeek ? 0 : (prev.weeklyTimeSpentMinutes || 0);
      const addedMinutes = Math.max(0, Math.round(sessionDurationSeconds / 60));
      const updatedWeeklyMinutes = baseWeeklyMinutes + addedMinutes;
      const updatedTotalSeconds = (prev.timeSpentTotalSeconds || 0) + sessionDurationSeconds;

      const newState: UserState = {
        ...prev,
        xp: newXp,
        coins: prev.coins + coinsGained,
        level: newLevel,
        streakDays: streakCalc.newStreakDays,
        lastStreakDate: streakCalc.newLastStreakDate,
        streakActiveDates: streakCalc.newStreakActiveDates,
        dailyTaskCounts: updatedDailyCounts,
        campusRust: Math.max(0, prev.campusRust - 15),
        lastActive: Date.now(),
        timeSpentTotalSeconds: updatedTotalSeconds,
        weeklyTimeSpentMinutes: updatedWeeklyMinutes,
        lastWeekKey: currentWeekKey,
        perks: {
          ...prev.perks!,
          temporaryXpBoostCharges: newCharges
        }
      };

      // Rule 3: EXACTLY ONE atomic write per completed lesson to users/{userId}
      const singleDocPayload = buildFirestoreUserPayload(
        newState,
        currentCompleted,
        newTaskStars,
        updatedCompletedLessons,
        user
      );

      if (user) {
        const userRef = doc(db, 'users', user.uid);
        setDoc(userRef, singleDocPayload, { merge: true }).catch(err => {
          console.warn("Offline or sync deferred to local Firestore cache:", err);
        });
      } else {
        localStorage.setItem('matura_quest_guest_user', JSON.stringify(singleDocPayload));
      }

      return {
        ...newState,
        ...singleDocPayload
      };
    });

    if (nextLesson) {
      handleStartTask(
        nextLesson, 
        nextLesson.lessonTasks || [nextLesson], 
        nextLesson.lessonTitle || nextLesson.title || 'Kolejna Lekcja', 
        nextLesson.nextLesson
      );
    } else {
      setActiveTask(false);
      setActiveTaskData(null);
      setCurrentTab('nauka');
    }
  };

  const handleMaturaReward = (baseXp: number, baseCoins: number) => {
    setUserState(prev => {
      const xpBoostPct = prev.perks?.xpBoostPercent || 0;
      const xpGained = Math.round(baseXp * (1 + xpBoostPct / 100));

      const coinBoostPct = prev.perks?.coinBoostPercent || 0;
      const coinsGained = Math.round(baseCoins * (1 + coinBoostPct / 100));

      const newXp = prev.xp + xpGained;
      const prevLevel = prev.level;
      const newLevel = Math.floor(newXp / 1000) + 1;
      const isLevelUp = newLevel > prevLevel;

      const bonusLabels: string[] = [];
      if (xpBoostPct > 0) bonusLabels.push(`+${xpBoostPct}% XP z Odznak`);
      if (coinBoostPct > 0) bonusLabels.push(`+${coinBoostPct}% Monet`);

      setReward({
        xp: xpGained,
        coins: coinsGained,
        levelUp: isLevelUp ? newLevel : undefined,
        bonusNote: bonusLabels.length > 0 ? bonusLabels.join(' • ') : undefined
      });

      const newState = {
        ...prev,
        xp: newXp,
        coins: prev.coins + coinsGained,
        level: newLevel,
        maturaAttempts: (prev.maturaAttempts || 0) + 1,
        campusRust: Math.max(0, prev.campusRust - 25),
        lastActive: Date.now()
      };
      saveUserData(newState);
      return newState;
    });
  };

  const handleClaimAchievement = (achievementId: string, tierNumber: number) => {
    const ach = ACHIEVEMENTS.find(a => a.id === achievementId);
    if (!ach) return;
    const tier = ach.tiers.find(t => t.tier === tierNumber);
    if (!tier) return;

    setUserState(prev => {
      const currentClaimed = prev.claimedAchievements?.[achievementId] || 0;
      if (currentClaimed >= tierNumber) return prev;

      const rewardXp = tier.rewardXp || 0;
      const rewardCoins = tier.rewardCoins || 0;
      const rewardTokens = tier.rewardTokens || 0;

      const newXp = prev.xp + rewardXp;
      const newCoins = prev.coins + rewardCoins;
      const newTokens = (prev.masteryTokens || 0) + rewardTokens;

      const prevLevel = prev.level;
      const newLevel = Math.floor(newXp / 1000) + 1;
      const isLevelUp = newLevel > prevLevel;

      const perk = tier.perkEffect;
      const updatedPerks: UserPerks = {
        xpBoostPercent: (prev.perks?.xpBoostPercent || 0) + (perk?.xpBoostPercent || 0),
        coinBoostPercent: (prev.perks?.coinBoostPercent || 0) + (perk?.coinBoostPercent || 0),
        streakFreezes: (prev.perks?.streakFreezes || 0) + (perk?.streakFreezes || 0),
        arenaShields: (prev.perks?.arenaShields || 0) + (perk?.arenaShields || 0),
        arenaTokenBonusPercent: (prev.perks?.arenaTokenBonusPercent || 0) + (perk?.arenaTokenBonusPercent || 0),
        temporaryXpBoostCharges: (prev.perks?.temporaryXpBoostCharges || 0) + (perk?.temporaryXpBoostCharges || 0),
      };

      const updatedClaimed = {
        ...(prev.claimedAchievements || {}),
        [achievementId]: tierNumber
      };

      const newState: UserState = {
        ...prev,
        xp: newXp,
        coins: newCoins,
        masteryTokens: newTokens,
        level: newLevel,
        perks: updatedPerks,
        claimedAchievements: updatedClaimed
      };

      setReward({
        xp: rewardXp,
        coins: rewardCoins,
        tokens: rewardTokens,
        levelUp: isLevelUp ? newLevel : undefined,
        title: `Odznaka: ${ach.name}!`,
        description: `Odebrano nagrody za poziom ${tierNumber} oraz stały bonus do konta!`
      });

      triggerHaptic('success');
      saveUserData(newState);
      return newState;
    });
  };

  const handleBuyShopItem = (item: ShopItem, currency: 'tokens' | 'coins'): boolean => {
    let success = false;
    setUserState(prev => {
      if (currency === 'tokens') {
        if ((prev.masteryTokens || 0) < item.tokenPrice) return prev;
      } else {
        if (prev.coins < item.coinPrice) return prev;
      }

      success = true;
      const newTokens = currency === 'tokens' ? (prev.masteryTokens || 0) - item.tokenPrice : (prev.masteryTokens || 0);
      const newCoins = currency === 'coins' ? prev.coins - item.coinPrice : prev.coins;

      const updatedPerks: UserPerks = {
        xpBoostPercent: prev.perks?.xpBoostPercent || 0,
        coinBoostPercent: prev.perks?.coinBoostPercent || 0,
        streakFreezes: (prev.perks?.streakFreezes || 0) + (item.effectType === 'streakFreeze' ? item.amount : 0),
        arenaShields: (prev.perks?.arenaShields || 0) + (item.effectType === 'arenaShield' ? item.amount : 0),
        arenaTokenBonusPercent: prev.perks?.arenaTokenBonusPercent || 0,
        temporaryXpBoostCharges: (prev.perks?.temporaryXpBoostCharges || 0) + (item.effectType === 'xpDouble' ? item.amount : 0),
      };

      const newState: UserState = {
        ...prev,
        masteryTokens: newTokens,
        coins: newCoins,
        perks: updatedPerks
      };

      triggerHaptic('heavy');
      saveUserData(newState);
      return newState;
    });
    return success;
  };

  const handleUseStreakFreeze = () => {
    setUserState(prev => {
      if ((prev.perks?.streakFreezes || 0) <= 0) return prev;
      const newState: UserState = {
        ...prev,
        campusRust: 0,
        perks: {
          ...prev.perks!,
          streakFreezes: Math.max(0, (prev.perks?.streakFreezes || 1) - 1)
        }
      };
      triggerHaptic('success');
      saveUserData(newState);
      return newState;
    });
  };

  if (loading) {
    return <LoadingScreen message="Autoryzacja..." />;
  }

  const handleLoginClick = () => {
    triggerHaptic('light');
    setShowAuthModal(true);
  };

  const isGuest = !user;
  const guestHasProgress = isGuest && userState.xp > 0;

  return (
    <div className="min-h-screen w-full bg-[#0B0E14] text-slate-100 font-sans flex flex-col md:flex-row overflow-x-hidden selection:bg-blue-500/30">
      {/* 1. NAWIGACJA (DLA DESKTOPU I TABLETU: LEWY PANEL BOCZNY; DLA MOBILNYCH: DOLNY DOCK) */}
      {!activeTask && (
        <Navigation currentTab={currentTab} setTab={setCurrentTab} />
      )}

      {/* 2. GŁÓWNY OBSZAR APLIKACJI (PRZESTRONNY DLA PC/DESKTOPU) */}
      <div className="flex-1 flex flex-col min-h-screen md:h-screen overflow-hidden relative w-full min-w-0">
        {!activeTask && (
          <Header state={userState} onProfileClick={() => setCurrentTab('profile')} currentTab={currentTab} />
        )}
        
        {isGuest && !activeTask && !showGuestPrompt && (
          <div className="bg-gradient-to-r from-blue-900/40 via-indigo-900/40 to-blue-900/40 border-b border-blue-500/20 px-4 sm:px-6 py-2.5 flex items-center justify-between shrink-0 z-30 relative shadow-lg">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
                <span className="text-white text-xs font-bold uppercase tracking-wider">Tryb Demo</span>
              </div>
              <span className="text-blue-200/70 text-[10px] sm:text-xs mt-0.5 ml-4">Zaloguj się, aby zapisać postępy w chmurze</span>
            </div>
            <button 
              onClick={handleLoginClick} 
              className="flex items-center gap-1.5 text-xs bg-blue-500 hover:bg-blue-400 text-white px-3.5 py-1.5 rounded-lg font-bold transition-all shadow-[0_0_15px_rgba(59,130,246,0.4)] hover:scale-105 active:scale-95 cursor-pointer"
            >
              <LogIn size={14} /> Zaloguj
            </button>
          </div>
        )}
        
        <main 
          id="main-scroll-container"
          className={`flex-1 ${
            activeTask 
              ? 'overflow-hidden flex flex-col justify-start items-stretch' 
              : 'overflow-y-auto overflow-x-hidden overscroll-y-contain touch-pan-y no-scrollbar pb-24 md:pb-6'
          } relative z-10 w-full`} 
          style={{ 
            height: '100vh',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-y'
          }}
        >
          {activeTask ? (
            activeTaskData?.isSession ? (
              <SessionRunner 
                sessionData={activeTaskData} 
                userState={userState} 
                onCompleteSession={handleCompleteTask} 
                onCancelSession={handleCancelTask} 
              />
            ) : (
              <TaskView 
                key={activeTaskData?.id || activeTaskData?.lessonTitle || activeTaskData?.title || 'active-task'}
                taskData={activeTaskData} 
                userState={userState} 
                onCompleteTask={handleCompleteTask} 
                onCancelTask={handleCancelTask} 
              />
            )
          ) : (
            <>
              {currentTab === 'dashboard' && (
                <DashboardView 
                  onNavigate={(tab, subTab) => {
                    setCurrentTab(tab as TabState);
                    if (subTab) setProfileInitialTab(subTab as any);
                  }} 
                  userState={userState}
                  completedTasks={completedTasks}
                  onStartTask={handleStartTask}
                  onUpdateUserState={setUserState}
                  saveUserData={saveUserData}
                />
              )}
              {currentTab === 'nauka' && (
                <LearnView 
                  onStartTask={handleStartTask} 
                  onCompleteTask={handleCompleteTask}
                  isGuest={isGuest} 
                  onLoginRequest={handleLoginClick}
                  onProRequest={() => setShowProPopup(true)}
                  completedTasks={completedTasks}
                  taskStars={taskStars}
                  onBackToDashboard={() => setCurrentTab('dashboard')}
                  onSheetToggle={setIsSubjectSheetOpen}
                />
              )}
              {currentTab === 'simulator' && <MaturaSimulatorView onEarnReward={handleMaturaReward} />}
              {currentTab === 'arena' && (
                <ArenaView 
                  userState={userState} 
                  onUpdateUserState={setUserState} 
                  saveUserData={saveUserData} 
                />
              )}
              {currentTab === 'profile' && (
                <ProfileView 
                  userState={userState} 
                  completedTasks={completedTasks}
                  onClaimAchievement={handleClaimAchievement}
                  onBuyShopItem={handleBuyShopItem}
                  onUseStreakFreeze={handleUseStreakFreeze}
                  onOpenAuthModal={() => setShowAuthModal(true)}
                  onOpenOnboarding={() => setShowGuestPrompt(true)}
                  initialTab={profileInitialTab}
                />
              )}
            </>
          )}
        </main>
      </div>

      <AnimatePresence>
        {(showGuestPrompt || isNewUser) && (
          <OnboardingOverlay 
            onClose={() => {
              setShowGuestPrompt(false);
              setIsNewUser(false);
            }}
            onNavigate={setCurrentTab}
            onComplete={handleOnboardingComplete}
            onOpenAuthModal={() => setShowAuthModal(true)}
            hasProgress={guestHasProgress}
            onLogin={handleLoginClick}
          />
        )}
      </AnimatePresence>

      <RewardPopup reward={reward} onClose={() => setReward(null)} />
      <ProPopup isOpen={showProPopup} onClose={() => setShowProPopup(false)} />
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
}

