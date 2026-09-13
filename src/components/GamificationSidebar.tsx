import React, { useState, useEffect, useMemo } from 'react';
import { Flame, Clock, Trophy, Sparkles, Check, ArrowRight, Target, Swords, FileText, Zap, Coins, Gift } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserState } from '../types';
import { getMilestoneStreakDays, getTodayDateString, triggerHaptic, playSuccessSound } from '../utils';
import confetti from 'canvas-confetti';

interface GamificationSidebarProps {
  userState?: UserState;
  completedTasks?: string[];
  onNavigate?: (tab: string, subTab?: string) => void;
  onUpdateUserState?: (updater: (prev: UserState) => UserState) => void;
  saveUserData?: (state: UserState) => void;
}

export const GamificationSidebar: React.FC<GamificationSidebarProps> = ({
  userState,
  completedTasks = [],
  onNavigate,
  onUpdateUserState,
  saveUserData
}) => {
  const streakDays = userState?.streakDays || 0;
  const todayStr = getTodayDateString();
  const todayTasksCompleted = userState?.dailyTaskCounts?.[todayStr] || 0;
  const currentProgress = Math.min(5, todayTasksCompleted);

  // 7-day streak track
  const { days: streakMilestones, isCompletedToday, todayTargetDayNumber } = useMemo(() => {
    return getMilestoneStreakDays(
      streakDays,
      userState?.lastStreakDate,
      userState?.streakActiveDates
    );
  }, [streakDays, userState?.lastStreakDate, userState?.streakActiveDates]);

  // Live countdown to midnight reset
  const [secondsUntilReset, setSecondsUntilReset] = useState<string>('00:00:00');
  const [timeUntilResetShort, setTimeUntilResetShort] = useState<string>('');

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      const diffMs = Math.max(0, midnight.getTime() - now.getTime());
      
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diffMs % (1000 * 60)) / 1000);

      setTimeUntilResetShort(`${hours}h ${mins.toString().padStart(2, '0')}m`);
      setSecondsUntilReset(
        `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      );
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  // Daily Mission Tiers
  const DAILY_TIERS = useMemo(() => [
    { id: 1, target: 1, title: 'Rozgrzewka', shortReward: '+10 Monet', coins: 10, xp: 0, icon: <Coins size={11} /> },
    { id: 2, target: 3, title: 'Trening E8', shortReward: '+20 Monet +15 XP', coins: 20, xp: 15, icon: <Zap size={11} /> },
    { id: 3, target: 5, title: 'Skrzynia Dnia', shortReward: '+50 Monet +30 XP', coins: 50, xp: 30, icon: <Gift size={11} />, bonusType: 'freeze' as const }
  ], []);

  const [claimedTiers, setClaimedTiers] = useState<number[]>(() => {
    try {
      if (userState?.dailyQuestsClaimed?.[todayStr] && Array.isArray(userState.dailyQuestsClaimed[todayStr])) {
        return userState.dailyQuestsClaimed[todayStr];
      }
      const stored = localStorage.getItem(`matura_quest_daily_tiers_claimed_${todayStr}`);
      if (stored) return JSON.parse(stored);
      return [];
    } catch {
      return [];
    }
  });

  const [floatingReward, setFloatingReward] = useState<{ text: string; id: number } | null>(null);

  const claimableTier = useMemo(() => {
    return DAILY_TIERS.find(t => todayTasksCompleted >= t.target && !claimedTiers.includes(t.id)) || null;
  }, [DAILY_TIERS, todayTasksCompleted, claimedTiers]);

  const isAllTiersCompleted = useMemo(() => {
    return DAILY_TIERS.every(t => claimedTiers.includes(t.id));
  }, [DAILY_TIERS, claimedTiers]);

  const nextTargetTier = useMemo(() => {
    return DAILY_TIERS.find(t => todayTasksCompleted < t.target) || DAILY_TIERS[DAILY_TIERS.length - 1];
  }, [DAILY_TIERS, todayTasksCompleted]);

  const tasksToNextTier = Math.max(0, nextTargetTier.target - todayTasksCompleted);

  const handleClaimTier = (tier: typeof DAILY_TIERS[0]) => {
    if (claimedTiers.includes(tier.id)) return;
    if (todayTasksCompleted < tier.target) return;

    triggerHaptic('success');
    playSuccessSound();

    try {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.5 },
        colors: ['#F59E0B', '#00C2FF', '#10B981', '#FFD700']
      });
    } catch {}

    const updatedClaimed = [...claimedTiers, tier.id];
    setClaimedTiers(updatedClaimed);

    try {
      localStorage.setItem(`matura_quest_daily_tiers_claimed_${todayStr}`, JSON.stringify(updatedClaimed));
    } catch {}

    setFloatingReward({
      text: tier.shortReward,
      id: Date.now()
    });
    setTimeout(() => setFloatingReward(null), 2000);

    if (onUpdateUserState) {
      onUpdateUserState(prev => {
        const updatedPerks = { ...(prev.perks || {
          xpBoostPercent: 0,
          coinBoostPercent: 0,
          streakFreezes: 0,
          arenaShields: 0,
          arenaTokenBonusPercent: 0,
          temporaryXpBoostCharges: 0
        }) };

        if (tier.bonusType === 'freeze') {
          updatedPerks.streakFreezes = (updatedPerks.streakFreezes || 0) + 1;
        }

        const nextState: UserState = {
          ...prev,
          coins: (prev.coins || 0) + tier.coins,
          xp: (prev.xp || 0) + tier.xp,
          perks: updatedPerks,
          dailyQuestsClaimed: {
            ...(prev.dailyQuestsClaimed || {}),
            [todayStr]: updatedClaimed
          }
        };
        saveUserData?.(nextState);
        return nextState;
      });
    }
  };

  // League details
  const rating = userState?.arenaRating || 1000;
  let leagueName = 'Brązowa';
  let leagueColor = 'text-amber-500';
  if (rating >= 1800) { leagueName = 'Diamentowa'; leagueColor = 'text-cyan-400'; }
  else if (rating >= 1500) { leagueName = 'Platynowa'; leagueColor = 'text-teal-300'; }
  else if (rating >= 1300) { leagueName = 'Złota'; leagueColor = 'text-yellow-400'; }
  else if (rating >= 1100) { leagueName = 'Srebrna'; leagueColor = 'text-gray-300'; }

  return (
    <aside 
      aria-label="Panel boczny grywalizacji"
      className="hidden lg:flex flex-col gap-5 w-full sticky top-20 self-start"
    >
      {/* 1. STREAK WIDGET (Seria Dni) */}
      <div className="bg-gradient-to-br from-[#141A23] to-[#0B0E14] border border-[#F97316]/30 rounded-3xl p-5 relative overflow-hidden shadow-[0_4px_24px_rgba(249,115,22,0.12)]">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#F97316]/15 rounded-full blur-[35px] pointer-events-none -translate-y-1/2 translate-x-1/4" />
        
        <div className="flex items-center justify-between mb-3 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-black text-[#F97316] text-xl tracking-tight">
                {streakDays} {streakDays === 1 ? 'Dzień' : 'Dni'}
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#F97316] bg-[#F97316]/10 px-2 py-0.5 rounded-full border border-[#F97316]/20">
                Seria
              </span>
            </div>
            <p className="text-[#8B8D98] text-[11px] leading-tight mt-1">
              {isCompletedToday 
                ? 'Cel na dziś zaliczony! Płomień płonie.' 
                : `Rozwiąż zadanie, aby zaliczyć Dzień ${todayTargetDayNumber}!`}
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#F97316] to-[#C2410C] flex items-center justify-center shadow-[0_0_16px_rgba(249,115,22,0.4)] border border-white/20 shrink-0">
            <Flame size={22} className="text-white fill-white animate-pulse" />
          </div>
        </div>

        {/* 7-dniowa ścieżka serii */}
        <div className="grid grid-cols-7 gap-1.5 pt-3 border-t border-white/5 relative z-10">
          {streakMilestones.map(m => (
            <div key={m.dayNumber} className="flex flex-col items-center gap-1">
              <div 
                className={`w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-black transition-all ${
                  m.isCompleted 
                    ? 'bg-[#F97316] text-white shadow-[0_0_10px_rgba(249,115,22,0.5)] border border-white/20' 
                    : m.isTargetToday
                      ? 'border-2 border-dashed border-[#F97316] text-[#F97316] bg-[#F97316]/15 animate-pulse'
                      : 'bg-white/5 border border-white/5 text-[#8B8D98]'
                }`}
                title={m.fullLabel}
              >
                {m.isCompleted ? (
                  <Check size={14} strokeWidth={3} />
                ) : m.isTargetToday ? (
                  <Flame size={14} className="fill-[#F97316]" />
                ) : (
                  <span>{m.dayNumber}</span>
                )}
              </div>
              <span className={`text-[9px] font-bold ${m.isCompleted ? 'text-[#F97316]' : m.isTargetToday ? 'text-white' : 'text-[#8B8D98]'}`}>
                {m.shortLabel}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 2. WYZWANIE DNIA (Daily Missions) Z ZEGAREM */}
      <div className="bg-gradient-to-br from-[#121824] via-[#0E131C] to-[#0A0E15] border border-[#00C2FF]/30 rounded-3xl p-5 relative overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
        <AnimatePresence>
          {floatingReward && (
            <motion.div
              key={floatingReward.id}
              initial={{ y: 0, opacity: 1, scale: 0.8 }}
              animate={{ y: -30, opacity: 0, scale: 1.2 }}
              exit={{ opacity: 0 }}
              className="absolute top-3 right-4 z-30 bg-sky-400 text-black font-black text-xs px-3 py-1 rounded-full shadow-[0_0_15px_rgba(14,165,233,0.9)]"
            >
              {floatingReward.text}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between mb-3 relative z-10">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#00E5FF] bg-[#00E5FF]/10 border border-[#00E5FF]/30 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-[0_0_10px_rgba(0,229,255,0.15)]">
              <Sparkles size={10} />
              <span>WYZWANIE DNIA</span>
            </span>
          </div>
          <div className="flex items-center gap-1 font-mono text-[11px] text-sky-300 bg-sky-500/10 px-2.5 py-0.5 rounded-full border border-sky-500/20">
            <Clock size={11} className="text-sky-400" />
            <span>{secondsUntilReset}</span>
          </div>
        </div>

        {/* Progress header */}
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-xs font-bold text-white">
            Postęp zadań: <span className="text-[#00E5FF] font-black">{currentProgress}</span> / 5
          </span>
          <span className="text-[11px] text-[#8B8D98]">
            {isAllTiersCompleted ? 'Wszystko odebrane' : `Do celu: ${tasksToNextTier}`}
          </span>
        </div>

        {/* Progress line with nodes */}
        <div className="relative w-full my-3 px-2">
          <div className="w-full bg-[#182232] h-2 rounded-full overflow-hidden border border-white/5">
            <div 
              className="h-full bg-gradient-to-r from-[#00C2FF] via-[#38BDF8] to-sky-400 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(0,194,255,0.4)]"
              style={{ width: `${Math.min(100, Math.round((currentProgress / 5) * 100))}%` }}
            />
          </div>

          {DAILY_TIERS.map(tier => {
            const percent = (tier.target / 5) * 100;
            const isClaimed = claimedTiers.includes(tier.id);
            const isUnlocked = todayTasksCompleted >= tier.target;
            const isClaimable = isUnlocked && !isClaimed;

            return (
              <div 
                key={tier.id}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10"
                style={{ left: `calc(${percent}% + ${percent === 20 ? '4px' : percent === 100 ? '-4px' : '0px'})` }}
              >
                <button
                  disabled={!isClaimable}
                  onClick={() => isClaimable && handleClaimTier(tier)}
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] transition-all border-2 ${
                    isClaimed
                      ? 'bg-emerald-500 border-emerald-400 text-white'
                      : isClaimable
                        ? 'bg-gradient-to-br from-sky-400 to-blue-500 border-white text-white shadow-[0_0_12px_rgba(14,165,233,0.8)] scale-110 animate-bounce cursor-pointer'
                        : isUnlocked
                          ? 'bg-[#00C2FF] border-white text-black'
                          : 'bg-[#151D2A] border-white/20 text-[#6B7280]'
                  }`}
                  title={`${tier.title}: ${tier.shortReward}`}
                >
                  {isClaimed ? <Check size={11} strokeWidth={3} /> : tier.icon}
                </button>
              </div>
            );
          })}
        </div>

        {/* Action button */}
        <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2">
          <div className="text-[11px] font-semibold text-white/90 truncate flex-1">
            {claimableTier ? (
              <span className="text-sky-300 font-black">Nagroda gotowa do odebrania!</span>
            ) : tasksToNextTier > 0 ? (
              <span>Cel: <strong className="text-white">{nextTargetTier.title}</strong></span>
            ) : (
              <span className="text-emerald-400">Komplet nagród odebrany</span>
            )}
          </div>

          {claimableTier ? (
            <button
              onClick={() => handleClaimTier(claimableTier)}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-400 to-blue-500 text-white font-black text-xs flex items-center gap-1 shadow-[0_0_14px_rgba(14,165,233,0.6)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <span>ODBIERZ</span>
            </button>
          ) : (
            <button
              onClick={() => onNavigate?.('nauka')}
              className="px-3 py-1.5 rounded-xl bg-[#00C2FF] hover:bg-[#38BDF8] text-[#080C12] font-black text-xs flex items-center gap-1 shadow-[0_0_10px_rgba(0,194,255,0.3)] active:scale-95 transition-all cursor-pointer"
            >
              <span>TRENUJ</span>
              <ArrowRight size={12} strokeWidth={3} />
            </button>
          )}
        </div>
      </div>

      {/* 3. SKRÓT DO POWTÓREK & STATYSTYK */}
      <div className="bg-[#141A23] border border-white/10 rounded-3xl p-5 flex flex-col gap-3.5 shadow-lg">
        <span className="text-[10px] font-black uppercase text-[#8B8D98] tracking-widest flex items-center gap-1.5">
          <Zap size={13} className="text-[#00E5FF]" />
          <span>Szybkie Moduły</span>
        </span>

        <button
          onClick={() => onNavigate?.('simulator')}
          className="w-full flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-[#00E5FF]/30 transition-all text-left group cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center border border-purple-500/30 group-hover:scale-105 transition-transform">
              <FileText size={18} />
            </div>
            <div>
              <div className="font-display font-bold text-white text-xs">Arkusze Egzaminacyjne</div>
              <div className="text-[10px] text-[#8B8D98]">Egzamin Ósmoklasisty CKE</div>
            </div>
          </div>
          <ArrowRight size={14} className="text-[#8B8D98] group-hover:text-white group-hover:translate-x-1 transition-all" />
        </button>

        <button
          onClick={() => onNavigate?.('arena')}
          className="w-full flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-sky-500/30 transition-all text-left group cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center border border-sky-500/30 group-hover:scale-105 transition-transform">
              <Swords size={18} />
            </div>
            <div>
              <div className="font-display font-bold text-white text-xs">Arena & Pojedynki</div>
              <div className="text-[10px] text-[#8B8D98]">Rating {rating} • {leagueName}</div>
            </div>
          </div>
          <ArrowRight size={14} className="text-[#8B8D98] group-hover:text-white group-hover:translate-x-1 transition-all" />
        </button>

        <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-[#8B8D98] px-1">
          <span>Zrobione zadania maturalne:</span>
          <strong className="text-white font-black text-xs">{completedTasks.length}</strong>
        </div>
      </div>
    </aside>
  );
};
