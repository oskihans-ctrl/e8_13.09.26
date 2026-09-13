import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserState } from '../types';
import { 
  Settings, 
  LogOut, 
  Bell, 
  Shield, 
  Paintbrush, 
  ChevronRight, 
  User, 
  LogIn, 
  Flame, 
  Trophy, 
  Sparkles, 
  Crown, 
  CheckCircle2, 
  Swords, 
  Zap,
  ShoppingBag,
  Target
} from 'lucide-react';
import { logout, auth, loginWithGoogle } from '../lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { AchievementsSection } from './AchievementsSection';
import { PerksVaultSection } from './PerksVaultSection';
import { ShopItem, countTotalClaimable } from '../data/achievements';
import { triggerHaptic, getLocalDateString } from '../utils';

interface ProfileViewProps {
  userState: UserState;
  completedTasks?: string[];
  onClaimAchievement?: (achievementId: string, tier: number) => void;
  onBuyShopItem?: (item: ShopItem, currency: 'tokens' | 'coins') => boolean;
  onUseStreakFreeze?: () => void;
  onOpenAuthModal?: () => void;
  onOpenOnboarding?: () => void;
  initialTab?: 'overview' | 'achievements' | 'perks';
}

type ProfileTab = 'achievements' | 'perks' | 'overview';

export function ProfileView({ 
  userState, 
  completedTasks = [],
  onClaimAchievement = () => {},
  onBuyShopItem = () => false,
  onUseStreakFreeze,
  onOpenAuthModal,
  onOpenOnboarding,
  initialTab = 'overview'
}: ProfileViewProps) {
  const [user] = useAuthState(auth);
  const [activeTab, setActiveTab] = useState<ProfileTab>(initialTab);
  const streakDays = userState?.streakDays || 0;

  const claimableCount = useMemo(() => {
    return countTotalClaimable(
      {
        completedTasksCount: completedTasks.length,
        arenaWins: userState.arenaWins || 0,
        arenaRating: userState.arenaRating || 1000,
        streakDays: streakDays,
        maturaAttempts: userState.maturaAttempts || 0,
        maturaBestScore: userState.maturaBestScore || 0,
        level: userState.level || 1
      },
      userState.claimedAchievements || {}
    );
  }, [completedTasks.length, userState, streakDays]);

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

      // If it's today and dailyTaskCounts hasn't recorded yet, attribute current completed tasks to today
      if (isToday && count === 0 && completedTasks.length > 0) {
        count = completedTasks.length;
      }

      // If user had active streak on this date but count was 0, ensure at least 1
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
    <div className="flex flex-col p-4 sm:p-6 pt-6 pb-[140px] max-w-xl mx-auto w-full">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}>
        {/* Top Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-display text-2xl font-bold text-white">Centrum Gracza</h1>
          
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
              <Crown size={12} /> {userState.masteryTokens || 0} Żetonów
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-[#0F172A] border border-slate-800 p-1 rounded-xl flex items-center gap-1 mb-6">
          <button
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('overview');
            }}
            className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs transition-all duration-150 active:scale-[0.97] flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <User size={14} />
            <span>Profil</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('achievements');
            }}
            className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs transition-all duration-150 active:scale-[0.97] flex items-center justify-center gap-1.5 relative cursor-pointer ${
              activeTab === 'achievements'
                ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Trophy size={14} />
            <span>Odznaki</span>
            {claimableCount > 0 && (
              <span className="w-4 h-4 bg-amber-400 text-slate-950 text-[9px] font-bold rounded-full flex items-center justify-center shadow-sm">
                {claimableCount}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('perks');
            }}
            className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs transition-all duration-150 active:scale-[0.97] flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'perks'
                ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles size={14} />
            <span>Skarbiec</span>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'achievements' && (
          <AchievementsSection
            userState={userState}
            completedTasks={completedTasks}
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
            <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-6 flex flex-col items-center shadow-sm">
              <div className="w-16 h-16 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mb-4">
                <User size={28} />
              </div>
              
              <h2 className="font-display text-xl font-bold text-white mb-1">
                {user ? (user.displayName || 'Uczeń') : 'Gość (Tryb Demo)'}
              </h2>
              <p className="text-xs text-slate-400">
                {user ? user.email : 'Postępy zapisywane lokalnie'}
              </p>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 w-full gap-2 mt-6">
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex flex-col items-center">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Poziom</span>
                  <span className="text-lg font-display font-bold text-white">{userState.level || 1}</span>
                </div>
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex flex-col items-center">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Zadania</span>
                  <span className="text-lg font-display font-bold text-sky-400">{completedTasks.length}</span>
                </div>
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex flex-col items-center">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Seria Dni</span>
                  <span className="text-lg font-display font-bold text-amber-400 flex items-center gap-1">
                    <Flame size={16} className="fill-amber-400" /> {streakDays}
                  </span>
                </div>
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex flex-col items-center">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">ELO Areny</span>
                  <span className="text-lg font-display font-bold text-indigo-400">{userState.arenaRating || 1000}</span>
                </div>
              </div>
            </div>

            {/* Dynamic Activity Chart (14 Dni Aktywności) */}
            <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-5 sm:p-6 overflow-hidden shadow-sm">
              <div className="flex justify-between items-end mb-4">
                <div className="flex flex-col">
                  <span className="text-2xl font-display font-bold text-white mb-0.5">
                    {completedTasks.length}
                  </span>
                  <span className="text-xs text-slate-400">Rozwiązanych zadań ogółem</span>
                </div>
                <div className="flex items-center gap-1.5 bg-sky-500/10 text-sky-400 px-3 py-1.5 rounded-full border border-sky-500/20">
                  <Flame size={14} className="fill-sky-400" />
                  <span className="text-xs font-bold">
                    Dziś: {todayActivityCount} {todayActivityCount === 1 ? 'zadanie' : 'zadań'}
                  </span>
                </div>
              </div>

              {/* Subtitle / Legend */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-3 pb-2 border-b border-slate-800">
                <span>Historia aktywności (ostatnie 14 dni)</span>
                <span className="text-sky-400 font-medium">Ukończone zadania</span>
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
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-7 bg-slate-900 text-white text-[9px] font-bold py-0.5 px-1.5 rounded-md border border-slate-700 pointer-events-none whitespace-nowrap z-20 shadow-md">
                        {d.count} {d.count === 1 ? 'zadanie' : 'zadań'}
                      </div>

                      {hasTasks && (
                        <span className={`text-[8px] sm:text-[9px] font-bold mb-1 leading-none ${d.isToday ? 'text-sky-400' : 'text-slate-400'}`}>
                          {d.count}
                        </span>
                      )}

                      {/* Bar / Point */}
                      <div 
                        className={`w-full rounded-t-md transition-all duration-200 ${
                          hasTasks
                            ? d.isToday
                              ? 'bg-sky-400'
                              : 'bg-sky-600/70 group-hover:bg-sky-500'
                            : 'bg-slate-800 group-hover:bg-slate-700'
                        }`}
                        style={{ height: `${heightPct}%` }}
                      />

                      {/* Day Label */}
                      <span className={`text-[8px] sm:text-[9px] font-bold mt-1.5 leading-none truncate max-w-full ${d.isToday ? 'text-sky-400' : 'text-slate-400'}`}>
                        {d.isToday ? 'Dziś' : d.dayName}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions & Settings */}
            <div className="bg-[#0F172A] border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              {onOpenOnboarding && (
                <button 
                  onClick={() => {
                    triggerHaptic('light');
                    onOpenOnboarding();
                  }}
                  className="w-full p-4 flex items-center gap-4 hover:bg-slate-850 transition-colors border-b border-slate-800 text-left cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-400 shrink-0 border border-sky-500/20">
                    <Target size={18} />
                  </div>
                  <div className="flex flex-col items-start flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">Twój Cel i Egzamin</span>
                      <span className="text-[10px] bg-sky-500/15 text-sky-400 font-bold px-2 py-0.5 rounded-full border border-sky-500/30">
                        {userState?.onboardingPreferences?.targetScore ? `${userState.onboardingPreferences.targetScore}%` : 'Ustaw'}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 truncate max-w-full">
                      {userState?.onboardingPreferences 
                        ? `${userState.onboardingPreferences.targetExam === 'e8' || userState.onboardingPreferences.targetExam === 'matura_2025' ? 'Egzamin Ósmoklasisty (E8)' : userState.onboardingPreferences.targetExam === 'poprawka' ? 'Szybka Powtórka' : 'Egzamin Ósmoklasisty'} • ${userState.onboardingPreferences.dailyMinutes} min dziennie`
                        : 'Zmień cel egzaminacyjny i czas nauki'}
                    </span>
                  </div>
                  <ChevronRight size={18} className="text-slate-500 shrink-0" />
                </button>
              )}

              <button 
                onClick={() => setActiveTab('achievements')}
                className="w-full p-4 flex items-center gap-4 hover:bg-slate-850 transition-colors border-b border-slate-800 text-left cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0 border border-amber-500/20">
                  <Trophy size={18} />
                </div>
                <div className="flex flex-col items-start flex-1">
                  <span className="text-sm font-bold text-white">System Odznak</span>
                  <span className="text-xs text-slate-400">Odbieraj nagrody za postępy</span>
                </div>
                <ChevronRight size={18} className="text-slate-500" />
              </button>

              <button 
                onClick={() => setActiveTab('perks')}
                className="w-full p-4 flex items-center gap-4 hover:bg-slate-850 transition-colors border-b border-slate-800 text-left cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0 border border-indigo-500/20">
                  <Sparkles size={18} />
                </div>
                <div className="flex flex-col items-start flex-1">
                  <span className="text-sm font-bold text-white">Skarbiec & Perki</span>
                  <span className="text-xs text-slate-400">Zarządzaj bonusami i tarczami</span>
                </div>
                <ChevronRight size={18} className="text-slate-500" />
              </button>

              <button 
                onClick={handleAuthAction}
                className="w-full p-4 flex items-center gap-4 hover:bg-slate-850 transition-colors text-left cursor-pointer"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${user ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'}`}>
                  {user ? <LogOut size={18} /> : <LogIn size={18} />}
                </div>
                <div className="flex flex-col items-start flex-1">
                  <span className="text-sm font-bold text-white">{user ? 'Wyloguj się' : 'Zaloguj się / Rejestracja'}</span>
                  <span className="text-xs text-slate-400">{user ? 'Zakończ sesję' : 'Zapisz serię i postępy w chmurze'}</span>
                </div>
                <ChevronRight size={18} className="text-slate-500" />
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
