import { useState, useMemo } from 'react';
import { 
  Trophy, 
  Crown, 
  User, 
  Sparkles, 
  Flame, 
  Target, 
  ChevronRight, 
  LogOut, 
  LogIn
} from 'lucide-react';
import { motion } from 'motion/react';
import { UserState } from '../types';
import { ACHIEVEMENTS, AchievementContext, countTotalClaimable, ShopItem } from '../data/achievements';
import { AchievementsSection } from './AchievementsSection';
import { PerksVaultSection } from './PerksVaultSection';
import { auth, loginWithGoogle, logout } from '../lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { triggerHaptic, getLocalDateString } from '../utils';

interface ProfileViewProps {
  userState: UserState;
  completedTasks: string[];
  streakDays?: number;
  onClaimAchievement: (achievementId: string, tierNumber: number) => void;
  onBuyShopItem: (item: ShopItem, currency: 'tokens' | 'coins') => boolean;
  onUseStreakFreeze: () => void;
  onOpenOnboarding?: () => void;
  onOpenAuthModal?: () => void;
  initialTab?: 'overview' | 'achievements' | 'perks';
}

export function ProfileView({
  userState,
  completedTasks,
  streakDays,
  onClaimAchievement,
  onBuyShopItem,
  onUseStreakFreeze,
  onOpenOnboarding,
  onOpenAuthModal,
  initialTab = 'overview'
}: ProfileViewProps) {
  const [user] = useAuthState(auth);
  const [activeTab, setActiveTab] = useState<'overview' | 'achievements' | 'perks'>(initialTab);

  const achievementContext: AchievementContext = useMemo(() => ({
    completedTasksCount: completedTasks.length,
    arenaWins: userState.arenaWins || 0,
    arenaRating: userState.arenaRating || 1000,
    streakDays: streakDays ?? (userState.streakDays || 0),
    maturaAttempts: userState.maturaAttempts || 0,
    maturaBestScore: userState.maturaBestScore || 0,
    level: userState.level || 1
  }), [completedTasks.length, userState, streakDays]);

  const claimedAchievementsMap: Record<string, number> = useMemo(() => {
    return (userState.claimedAchievements as unknown as Record<string, number>) || {};
  }, [userState.claimedAchievements]);

  // Compute claimable achievements count for badge
  const claimableCount = useMemo(() => {
    return countTotalClaimable(achievementContext, claimedAchievementsMap);
  }, [achievementContext, claimedAchievementsMap]);

  const activityDays = useMemo(() => {
    const today = new Date();
    const todayStr = getLocalDateString(today);
    const dayNames = ['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So'];
    const days = [];

    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = getLocalDateString(d);
      const isToday = i === 0;

      let count = userState?.dailyTaskCounts?.[dateStr] || 0;

      if (isToday && count === 0 && completedTasks.length > 0) {
        count = completedTasks.length;
      }

      if (count === 0 && userState?.streakActiveDates?.includes(dateStr)) {
        count = 1;
      }

      days.push({
        date: d,
        dateStr,
        dayName: dayNames[d.getDay()],
        count,
        isToday
      });
    }
    return days;
  }, [userState?.dailyTaskCounts, userState?.streakActiveDates, completedTasks.length]);

  const maxActivityCount = useMemo(() => {
    return Math.max(5, ...activityDays.map(d => d.count));
  }, [activityDays]);

  const todayActivityCount = useMemo(() => {
    const todayItem = activityDays.find(d => d.isToday);
    return todayItem ? todayItem.count : 0;
  }, [activityDays]);

  const handleAuthAction = async () => {
    try {
      if (user) {
        await logout();
        triggerHaptic('light');
      } else {
        if (onOpenAuthModal) {
          onOpenAuthModal();
        } else {
          await loginWithGoogle();
        }
        triggerHaptic('medium');
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex flex-col p-4 sm:p-6 pb-24 max-w-xl mx-auto w-full">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        {/* Top Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Centrum Ucznia</h1>
          
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-amber-800 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full flex items-center gap-1 shadow-xs">
              <Crown size={12} /> {userState.masteryTokens || 0} Żetonów
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 p-1 rounded-xl flex items-center gap-1 mb-6 shadow-inner">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('overview');
            }}
            className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'overview'
                ? 'btn-depth-secondary text-slate-900 dark:text-white'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <User size={14} />
            <span>Profil</span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('achievements');
            }}
            className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 relative cursor-pointer ${
              activeTab === 'achievements'
                ? 'btn-depth-secondary text-slate-900 dark:text-white'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Trophy size={14} />
            <span>Odznaki</span>
            {claimableCount > 0 && (
              <span className="w-4 h-4 bg-amber-500 text-slate-950 text-[9px] font-bold rounded-full flex items-center justify-center shadow-xs">
                {claimableCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('perks');
            }}
            className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'perks'
                ? 'btn-depth-secondary text-slate-900 dark:text-white'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles size={14} />
            <span>Skarbiec</span>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'achievements' && (
          <AchievementsSection
            context={achievementContext}
            claimedAchievements={claimedAchievementsMap}
            onClaimTier={onClaimAchievement}
          />
        )}

        {activeTab === 'perks' && (
          <PerksVaultSection
            userState={userState}
            onBuyItem={onBuyShopItem}
            onUseStreakFreeze={onUseStreakFreeze}
          />
        )}

        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Profile Summary Card */}
            <div className="depth-card rounded-2xl p-6 flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center mb-4">
                <User size={28} />
              </div>
              
              <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white mb-0.5">
                {user ? (user.displayName || 'Uczeń') : 'Gość (Tryb Lokalny)'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {user ? user.email : 'Postępy są bezpiecznie zapisywane w tej przeglądarce'}
              </p>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 w-full gap-2.5 mt-6">
                <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex flex-col items-center justify-center text-center shadow-2xs">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider mb-1 text-center leading-none">Poziom</span>
                  <span className="text-lg font-display font-bold text-slate-900 dark:text-white text-center leading-none">{userState.level || 1}</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex flex-col items-center justify-center text-center shadow-2xs">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider mb-1 text-center leading-none">Zadania</span>
                  <span className="text-lg font-display font-bold text-amber-700 dark:text-amber-400 text-center leading-none">{completedTasks.length}</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex flex-col items-center justify-center text-center shadow-2xs">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider mb-1 text-center leading-none">Seria Dni</span>
                  <span className="text-lg font-display font-bold text-amber-600 dark:text-amber-400 flex items-center justify-center text-center gap-1 leading-none">
                    <Flame size={16} className="fill-amber-500" /> {streakDays}
                  </span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex flex-col items-center justify-center text-center shadow-2xs">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider mb-1 text-center leading-none">ELO Areny</span>
                  <span className="text-lg font-display font-bold text-slate-900 dark:text-white text-center leading-none">{userState.arenaRating || 1000}</span>
                </div>
              </div>
            </div>

            {/* Dynamic Activity Chart (14 Dni Aktywności) */}
            <div className="depth-card rounded-2xl p-5 sm:p-6 overflow-hidden">
              <div className="flex justify-between items-end mb-4">
                <div className="flex flex-col">
                  <span className="text-2xl font-display font-bold text-slate-900 dark:text-white mb-0.5">
                    {completedTasks.length}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Rozwiązanych zadań ogółem</span>
                </div>
                <div className="inline-flex items-center justify-center text-center leading-none gap-1.5 bg-amber-500/10 text-amber-800 dark:text-amber-400 px-3 py-1.5 rounded-full border border-amber-500/30 shadow-2xs">
                  <Flame size={14} className="fill-amber-500" />
                  <span className="text-xs font-bold text-center leading-none">
                    Dziś: {todayActivityCount} {todayActivityCount === 1 ? 'zadanie' : 'zadań'}
                  </span>
                </div>
              </div>

              {/* Subtitle / Legend */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                <span>Historia aktywności (ostatnie 14 dni)</span>
                <span className="text-amber-700 dark:text-amber-400 font-medium">Ukończone zadania</span>
              </div>
              
              {/* 14-Day Bars Container */}
              <div className="flex items-end justify-between gap-1 sm:gap-1.5 h-28 pt-3 pb-1">
                {activityDays.map((d) => {
                  const hasTasks = d.count > 0;
                  const heightPct = hasTasks 
                    ? Math.max(22, Math.min(100, Math.round((d.count / maxActivityCount) * 100)))
                    : 10;

                  return (
                    <div 
                      key={d.dateStr} 
                      className="flex-1 group flex flex-col items-center justify-end h-full relative cursor-pointer min-w-0"
                      title={`${d.date.toLocaleDateString('pl-PL')}: ${d.count} zadań`}
                    >
                      {/* Tooltip on hover */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-7 bg-slate-900 text-white text-[9px] font-bold py-0.5 px-1.5 rounded-md pointer-events-none whitespace-nowrap z-20 shadow-md">
                        {d.count} {d.count === 1 ? 'zadanie' : 'zadań'}
                      </div>

                      {hasTasks && (
                        <span className={`text-[8px] sm:text-[9px] font-bold mb-1 leading-none ${d.isToday ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`}>
                          {d.count}
                        </span>
                      )}

                      {/* Bar / Point */}
                      <div 
                        className={`w-full rounded-t-md transition-all duration-200 ${
                          hasTasks
                            ? d.isToday
                              ? 'bg-amber-500'
                              : 'bg-amber-600/60 dark:bg-amber-500/70 group-hover:bg-amber-500'
                            : 'bg-slate-100 dark:bg-slate-800 group-hover:bg-slate-200 dark:group-hover:bg-slate-700'
                        }`}
                        style={{ height: `${heightPct}%` }}
                      />

                      {/* Day Label */}
                      <span className={`text-[8px] sm:text-[9px] font-bold mt-1.5 leading-none truncate max-w-full ${d.isToday ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`}>
                        {d.isToday ? 'Dziś' : d.dayName}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions & Settings */}
            <div className="depth-card rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
              {onOpenOnboarding && (
                <button 
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    onOpenOnboarding();
                  }}
                  className="w-full p-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-700 dark:text-amber-400 shrink-0 border border-amber-500/20">
                    <Target size={18} />
                  </div>
                  <div className="flex flex-col items-start flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">Twój Cel Maturalny</span>
                      <span className="text-[10px] bg-amber-500/15 text-amber-800 dark:text-amber-400 font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                        {userState?.onboardingPreferences?.targetScore ? `${userState.onboardingPreferences.targetScore}%` : 'Ustaw'}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-full">
                      {userState?.onboardingPreferences 
                        ? `${userState.onboardingPreferences.targetExam === 'e8' ? 'Egzamin Ósmoklasisty' : 'Matura CKE'} • ${userState.onboardingPreferences.dailyMinutes} min dziennie`
                        : 'Zmień docelowy wynik i dzienny czas nauki'}
                    </span>
                  </div>
                  <ChevronRight size={18} className="text-slate-400 shrink-0" />
                </button>
              )}

              <button 
                type="button"
                onClick={() => setActiveTab('achievements')}
                className="w-full p-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 border border-amber-500/20">
                  <Trophy size={18} />
                </div>
                <div className="flex flex-col items-start flex-1">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">System Odznak</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Odbieraj nagrody i trofea za postępy</span>
                </div>
                <ChevronRight size={18} className="text-slate-400" />
              </button>

              <button 
                type="button"
                onClick={() => setActiveTab('perks')}
                className="w-full p-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-700 dark:text-amber-400 shrink-0 border border-amber-500/20">
                  <Sparkles size={18} />
                </div>
                <div className="flex flex-col items-start flex-1">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">Skarbiec & Bonusy</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Zarządzaj tarczami i bonusami XP</span>
                </div>
                <ChevronRight size={18} className="text-slate-400" />
              </button>

              <button 
                type="button"
                onClick={handleAuthAction}
                className="w-full p-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left cursor-pointer"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${user ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40' : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'}`}>
                  {user ? <LogOut size={18} /> : <LogIn size={18} />}
                </div>
                <div className="flex flex-col items-start flex-1">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{user ? 'Wyloguj się' : 'Zaloguj się kontem Google'}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">{user ? 'Zakończ sesję na tym urządzeniu' : 'Zapisz serię i odznaki w chmurze'}</span>
                </div>
                <ChevronRight size={18} className="text-slate-400" />
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default ProfileView;
