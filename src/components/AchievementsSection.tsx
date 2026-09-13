import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  CheckCircle2, 
  Swords, 
  GraduationCap, 
  Flame, 
  Sparkles, 
  Crown, 
  Coins, 
  Zap, 
  Shield, 
  ShieldCheck, 
  Star, 
  Gift,
  Lock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { 
  ACHIEVEMENTS, 
  Achievement, 
  AchievementCategory, 
  getAchievementProgress, 
  AchievementContext 
} from '../data/achievements';
import { UserState } from '../types';
import confetti from 'canvas-confetti';
import { triggerHaptic } from '../utils';

interface AchievementsSectionProps {
  userState: UserState;
  completedTasks: string[];
  onClaimTier: (achievementId: string, tierNumber: number) => void;
}

export function AchievementsSection({
  userState,
  completedTasks,
  onClaimTier
}: AchievementsSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | 'all' | 'claimable'>('all');
  const [expandedAchievementId, setExpandedAchievementId] = useState<string | null>(null);

  const context: AchievementContext = {
    completedTasksCount: completedTasks.length,
    arenaWins: userState.arenaWins || 0,
    arenaRating: userState.arenaRating || 1000,
    streakDays: userState.streakDays || 0,
    maturaAttempts: userState.maturaAttempts || 0,
    maturaBestScore: userState.maturaBestScore || 0,
    level: userState.level || 1
  };

  const claimedAchievements = userState.claimedAchievements || {};

  // Compute stats
  let totalClaimableCount = 0;
  let totalTiersUnlocked = 0;
  let totalTiersCount = 0;

  const achievementsWithProgress = ACHIEVEMENTS.map(ach => {
    const info = getAchievementProgress(ach, context, claimedAchievements);
    totalTiersCount += ach.tiers.length;
    totalTiersUnlocked += info.claimedTier;
    if (info.canClaim) {
      totalClaimableCount++;
    }
    return info;
  });

  const filtered = achievementsWithProgress.filter(item => {
    if (selectedCategory === 'claimable') return item.canClaim;
    if (selectedCategory === 'all') return true;
    return item.achievement.category === selectedCategory;
  });

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'CheckCircle2': return <CheckCircle2 size={20} />;
      case 'Swords': return <Swords size={20} />;
      case 'Trophy': return <Trophy size={20} />;
      case 'GraduationCap': return <GraduationCap size={20} />;
      case 'Flame': return <Flame size={20} />;
      case 'Sparkles': return <Sparkles size={20} />;
      default: return <Star size={20} />;
    }
  };

  const handleClaim = (achId: string, tierNum: number) => {
    triggerHaptic('heavy');
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.7 }
    });
    onClaimTier(achId, tierNum);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Overview Banner */}
      <div className="bg-[#141A23] border border-white/5 rounded-[24px] p-5 relative shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#0B0E14] border border-[#F59E0B]/30 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <Trophy size={24} className="text-[#F59E0B]" />
            </div>
            <div>
              <h2 className="text-base font-display font-black text-white leading-tight">Centrum Gracza & Odznaki</h2>
              <span className="text-xs text-[#9CA3AF]">
                {totalTiersUnlocked} z {totalTiersCount} rang odblokowanych
              </span>
            </div>
          </div>
          {totalClaimableCount > 0 && (
            <motion.button
              animate={{ 
                scale: [1, 1.05, 1],
                boxShadow: ['0px 0px 0px rgba(16, 185, 129, 0)', '0px 0px 15px rgba(16, 185, 129, 0.5)', '0px 0px 0px rgba(16, 185, 129, 0)']
              }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              onClick={() => setSelectedCategory('claimable')}
              className="bg-gradient-to-r from-emerald-500 to-emerald-400 text-black font-black text-[11px] px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-lg"
            >
              <Gift size={14} />
              {totalClaimableCount} do odebrania!
            </motion.button>
          )}
        </div>
        
        {/* Global Progress Bar */}
        <div className="mb-2">
          <div className="flex justify-between text-[10px] font-bold mb-1.5">
            <span className="text-[#9CA3AF] uppercase tracking-wider">Postęp Kolekcji</span>
            <span className="text-[#00D2FF] font-mono">
              {Math.round((totalTiersUnlocked / Math.max(1, totalTiersCount)) * 100)}%
            </span>
          </div>
          <div className="w-full h-2 bg-white/5 rounded-full shadow-inner">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-[#3B82F6] to-[#00D2FF] shadow-[0_0_10px_rgba(0,210,255,0.5)]"
              initial={{ width: 0 }}
              animate={{ width: `${(totalTiersUnlocked / Math.max(1, totalTiersCount)) * 100}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>

      {/* Categories Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
            selectedCategory === 'all'
              ? 'bg-[#D1D5DB] text-black border-[#D1D5DB] shadow-md'
              : 'bg-[#141A23] text-[#9CA3AF] border-white/5 hover:text-white hover:bg-white/5'
          }`}
        >
          Wszystkie ({achievementsWithProgress.length})
        </button>

        {totalClaimableCount > 0 && (
          <button
            onClick={() => setSelectedCategory('claimable')}
            className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
              selectedCategory === 'claimable'
                ? 'bg-sky-500 text-black border-sky-400 shadow-md'
                : 'bg-sky-500/10 text-sky-400 border-sky-500/30 hover:bg-sky-500/20'
            }`}
          >
            <Sparkles size={13} />
            <span>Do odebrania ({totalClaimableCount})</span>
          </button>
        )}

        <button
          onClick={() => setSelectedCategory('tasks')}
          className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
            selectedCategory === 'tasks'
              ? 'bg-blue-600 text-white border-blue-500 shadow-md'
              : 'bg-[#141A23] text-[#9CA3AF] border-white/5 hover:text-white hover:bg-white/5'
          }`}
        >
          Zadania Egzaminacyjne
        </button>

        <button
          onClick={() => setSelectedCategory('arena')}
          className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
            selectedCategory === 'arena'
              ? 'bg-red-600 text-white border-red-500 shadow-md'
              : 'bg-[#141A23] text-[#9CA3AF] border-white/5 hover:text-white hover:bg-white/5'
          }`}
        >
          Arena 1v1
        </button>

        <button
          onClick={() => setSelectedCategory('streak')}
          className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
            selectedCategory === 'streak'
              ? 'bg-orange-600 text-white border-orange-500 shadow-md'
              : 'bg-[#141A23] text-[#9CA3AF] border-white/5 hover:text-white hover:bg-white/5'
          }`}
        >
          Wytrwałość
        </button>

        <button
          onClick={() => setSelectedCategory('matura')}
          className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
            selectedCategory === 'matura'
              ? 'bg-purple-600 text-white border-purple-500 shadow-md'
              : 'bg-[#141A23] text-[#9CA3AF] border-white/5 hover:text-white hover:bg-white/5'
          }`}
        >
          Symulator
        </button>
      </div>

      {/* Achievements Cards List */}
      <div className="space-y-4">
        {filtered.map(item => {
          const ach = item.achievement;
          const isExpanded = expandedAchievementId === ach.id;
          const nextTier = item.activeTier;
          const prevTier = item.claimedTier > 0 
            ? ach.tiers.find(t => t.tier === item.claimedTier) 
            : null;
            
          const isEarned = item.claimedTier > 0;
          const isLocked = !isEarned && !item.canClaim;

          return (
            <motion.div
              key={ach.id}
              layout
              className={`rounded-[20px] transition-all shadow-md border ${
                item.canClaim 
                  ? 'border-[#10B981]/60 shadow-[0_0_20px_rgba(16,185,129,0.15)] bg-[#10B981]/[0.03]' 
                  : isEarned
                  ? 'border-sky-500/30 bg-[#141A23] shadow-[0_4px_20px_rgba(14,165,233,0.08)]'
                  : 'border-white/5 bg-[#0D121B] opacity-65 grayscale'
              }`}
            >
              <div className="p-5">
                <div className="flex items-start gap-4 mb-3">
                  {/* Icon */}
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 border shadow-inner ${
                    item.isFullyCompleted 
                      ? 'bg-gradient-to-br from-sky-400/20 to-blue-500/30 text-sky-400 border-sky-400/40 shadow-[0_0_15px_rgba(14,165,233,0.3)]'
                      : item.canClaim
                      ? 'bg-gradient-to-br from-[#10B981]/20 to-emerald-600/20 text-[#10B981] border-[#10B981]/40 animate-pulse'
                      : isEarned
                      ? 'bg-gradient-to-br from-sky-500/20 to-blue-600/20 text-sky-400 border-sky-500/30'
                      : 'bg-[#0B0E14] text-[#6B7280] border-white/5 relative'
                  }`}>
                    {isLocked ? <Lock size={22} /> : (isEarned ? <Trophy size={24} className="text-sky-400" /> : getCategoryIcon(ach.iconName))}
                  </div>
                  
                  {/* Title & Desc */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-black text-white text-[15px]">{ach.name}</h3>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md flex items-center gap-1 border ${
                        item.isFullyCompleted 
                          ? 'bg-sky-400/15 text-sky-300 border-sky-400/30' 
                          : isEarned
                          ? 'bg-sky-500/15 text-sky-400 border-sky-500/30' 
                          : item.canClaim
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : 'bg-white/5 text-[#8B8D98] border-white/5'
                      }`}>
                        {item.isFullyCompleted 
                           ? 'Mistrz ★ (Zdobyta ✓)' 
                           : isEarned 
                           ? `Ranga ${item.claimedTier} (Zdobyta ✓)` 
                           : 'Do odblokowania'}
                      </span>
                    </div>
                    <p className="text-[12px] text-[#9CA3AF] leading-snug">{ach.description}</p>
                  </div>

                  {/* Expand Toggle */}
                  <button 
                    onClick={() => setExpandedAchievementId(isExpanded ? null : ach.id)}
                    className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-white hover:bg-white/5 transition-colors shrink-0"
                  >
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                </div>

                {/* Condition row for unearned achievements */}
                {isLocked && nextTier && (
                  <div className="mt-2.5 py-2 px-3 bg-white/[0.03] rounded-xl border border-white/5 flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5 text-white/80">
                      <Lock size={12} className="text-sky-400/70" />
                      <span>Warunek: <strong className="text-white font-bold">{nextTier.target} {ach.unit}</strong></span>
                    </div>
                    <span className="text-[10px] font-bold text-[#8B8D98]">
                      Postęp: {item.currentValue} / {nextTier.target}
                    </span>
                  </div>
                )}

                {/* Progress bar & Claim button */}
                {!item.isFullyCompleted && nextTier && (
                  <div className="mt-4">
                    <div className="flex justify-between items-center text-[11px] mb-2">
                      <span className="text-[#9CA3AF]">
                        Ranga {nextTier.tier}: <strong className="text-white font-bold">{nextTier.tierName}</strong>
                      </span>
                      <span className="font-mono font-bold text-[#D1D5DB]">
                        {item.currentValue} / {nextTier.target} {ach.unit}
                      </span>
                    </div>
                    
                    <div className="w-full h-2 bg-[#0B0E14] rounded-full mb-3 border border-white/5">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          item.canClaim 
                            ? 'bg-gradient-to-r from-[#10B981] to-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]' 
                            : 'bg-gradient-to-r from-[#3B82F6] to-[#00D2FF]'
                        }`}
                        style={{ width: `${item.progressPercent}%` }}
                      />
                    </div>
                    
                    {/* Rewards Preview */}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex flex-wrap items-center gap-2 text-[10px] font-black">
                        <span className="flex items-center gap-1.5 text-[#F59E0B] bg-[#F59E0B]/10 px-2.5 py-1 rounded-md border border-[#F59E0B]/20">
                          <Coins size={12} /> +{nextTier.rewardCoins}
                        </span>
                        <span className="flex items-center gap-1.5 text-[#A855F7] bg-[#A855F7]/10 px-2.5 py-1 rounded-md border border-[#A855F7]/20">
                          <Crown size={12} /> +{nextTier.rewardTokens}
                        </span>
                        {nextTier.rewardPerkDesc && (
                          <span className="flex items-center gap-1 text-[#10B981] bg-[#10B981]/10 px-2.5 py-1 rounded-md border border-[#10B981]/20">
                            {nextTier.rewardPerkDesc}
                          </span>
                        )}
                      </div>
                      
                      {item.canClaim && (
                        <button 
                          onClick={() => handleClaim(ach.id, nextTier.tier)}
                          className="px-4 py-1.5 bg-gradient-to-r from-[#10B981] to-emerald-500 text-black font-black text-[11px] uppercase tracking-wider rounded-lg flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-transform shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                        >
                          <Gift size={14} />
                          Odbierz
                        </button>
                      )}
                    </div>
                  </div>
                )}
                
                {item.isFullyCompleted && (
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                    <div className="flex items-center gap-2 text-[12px] text-[#10B981] font-black">
                      <CheckCircle2 size={16} />
                      Wszystkie rangi zdobyte
                    </div>
                    <span className="text-[12px] font-mono font-black text-[#9CA3AF]">
                      {item.currentValue} {ach.unit}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Collapsible Tier Breakdown */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-white/5 bg-[#0B0E14] p-5 space-y-3"
                  >
                    <span className="text-[10px] uppercase font-black text-[#9CA3AF] tracking-wider block mb-2">
                      Historia rang:
                    </span>
                    {ach.tiers.map(t => {
                      const isClaimed = t.tier <= item.claimedTier;
                      const isNext = nextTier?.tier === t.tier;
                      return (
                        <div 
                          key={t.tier}
                          className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-all ${
                            isClaimed 
                              ? 'bg-[#10B981]/[0.05] border-[#10B981]/20 text-white' 
                              : isNext
                              ? 'bg-[#3B82F6]/[0.05] border-[#3B82F6]/30 text-white'
                              : 'bg-white/[0.02] border-white/5 text-[#9CA3AF] opacity-60'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${
                              isClaimed 
                                ? 'bg-[#10B981]/20 text-[#10B981]' 
                                : isNext
                                ? 'bg-[#3B82F6]/20 text-[#00D2FF]'
                                : 'bg-white/5 text-white/40'
                            }`}>
                              {isClaimed ? '✓' : t.tier}
                            </div>
                            <div>
                              <div className="font-bold flex items-center gap-1.5 text-[13px]">
                                <span>{t.tierName}</span>
                                <span className="text-[10px] text-[#9CA3AF]">({t.target} {ach.unit})</span>
                              </div>
                              {t.rewardPerkDesc && (
                                <div className="text-[11px] text-[#10B981] font-bold mt-0.5">
                                  Nagroda: {t.rewardPerkDesc}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[#F59E0B] font-black bg-[#F59E0B]/10 px-2 py-1 rounded-md text-[10px] flex items-center gap-1">+{t.rewardCoins} <Coins size={10}/></span>
                            <span className="text-[#A855F7] font-black bg-[#A855F7]/10 px-2 py-1 rounded-md text-[10px] flex items-center gap-1">+{t.rewardTokens} <Crown size={10}/></span>
                            
                            {isNext && item.canClaim && (
                              <button 
                                onClick={() => handleClaim(ach.id, t.tier)}
                                className="px-3 py-1.5 bg-[#10B981] text-black font-black text-[10px] rounded-lg shadow-sm uppercase ml-1 hover:scale-105 active:scale-95 transition-transform"
                              >
                                Odbierz
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
