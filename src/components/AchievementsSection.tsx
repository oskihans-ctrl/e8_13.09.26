import { useState } from 'react';
import { 
  Trophy, 
  Coins, 
  Crown, 
  Gift, 
  Lock, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  Sparkles, 
  Swords, 
  GraduationCap, 
  Flame, 
  Star 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { ACHIEVEMENTS, getAchievementProgress, AchievementContext } from '../data/achievements';
import { triggerHaptic } from '../utils';

interface AchievementsSectionProps {
  context: AchievementContext;
  claimedAchievements?: Record<string, number>;
  onClaimTier: (achievementId: string, tier: number) => void;
}

export function AchievementsSection({
  context,
  claimedAchievements = {},
  onClaimTier
}: AchievementsSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'claimable' | 'tasks' | 'arena' | 'streak' | 'matura'>('all');
  const [expandedAchievementId, setExpandedAchievementId] = useState<string | null>(null);

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
      case 'CheckCircle2': return <CheckCircle2 size={18} />;
      case 'Swords': return <Swords size={18} />;
      case 'Trophy': return <Trophy size={18} />;
      case 'GraduationCap': return <GraduationCap size={18} />;
      case 'Flame': return <Flame size={18} />;
      case 'Sparkles': return <Sparkles size={18} />;
      default: return <Star size={18} />;
    }
  };

  const handleClaim = (achId: string, tierNum: number) => {
    triggerHaptic('heavy');
    confetti({
      particleCount: 60,
      spread: 50,
      origin: { y: 0.7 }
    });
    onClaimTier(achId, tierNum);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Overview Banner */}
      <div className="bg-white dark:bg-[#131B29] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Trophy size={20} className="text-amber-500" />
            </div>
            <div>
              <h2 className="text-base font-display font-bold text-slate-900 dark:text-white leading-tight">Osiągnięcia i Rangi</h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {totalTiersUnlocked} z {totalTiersCount} poziomów odblokowanych
              </span>
            </div>
          </div>
          {totalClaimableCount > 0 && (
            <button
              type="button"
              onClick={() => setSelectedCategory('claimable')}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Gift size={13} />
              {totalClaimableCount} do odebrania
            </button>
          )}
        </div>
        
        {/* Global Progress Bar */}
        <div>
          <div className="flex justify-between text-[11px] font-bold mb-1.5">
            <span className="text-slate-400 uppercase tracking-wider text-[10px]">Postęp kolekcji</span>
            <span className="text-slate-900 dark:text-white font-mono">
              {Math.round((totalTiersUnlocked / Math.max(1, totalTiersCount)) * 100)}%
            </span>
          </div>
          <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-amber-500"
              initial={{ width: 0 }}
              animate={{ width: `${(totalTiersUnlocked / Math.max(1, totalTiersCount)) * 100}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>

      {/* Categories Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        <button
          type="button"
          onClick={() => setSelectedCategory('all')}
          className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
            selectedCategory === 'all'
              ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-xs'
              : 'bg-white dark:bg-[#131B29] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Wszystkie ({achievementsWithProgress.length})
        </button>

        {totalClaimableCount > 0 && (
          <button
            type="button"
            onClick={() => setSelectedCategory('claimable')}
            className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
              selectedCategory === 'claimable'
                ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-xs'
                : 'bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-400 border-amber-300 dark:border-amber-800'
            }`}
          >
            <Sparkles size={12} />
            <span>Do odebrania ({totalClaimableCount})</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setSelectedCategory('tasks')}
          className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
            selectedCategory === 'tasks'
              ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-xs'
              : 'bg-white dark:bg-[#131B29] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Zadania
        </button>

        <button
          type="button"
          onClick={() => setSelectedCategory('arena')}
          className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
            selectedCategory === 'arena'
              ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-xs'
              : 'bg-white dark:bg-[#131B29] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Arena 1v1
        </button>

        <button
          type="button"
          onClick={() => setSelectedCategory('streak')}
          className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
            selectedCategory === 'streak'
              ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-xs'
              : 'bg-white dark:bg-[#131B29] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Dni z rzędu
        </button>

        <button
          type="button"
          onClick={() => setSelectedCategory('matura')}
          className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
            selectedCategory === 'matura'
              ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-xs'
              : 'bg-white dark:bg-[#131B29] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Egzamin CKE
        </button>
      </div>

      {/* Achievements Cards List */}
      <div className="space-y-3">
        {filtered.map(item => {
          const ach = item.achievement;
          const isExpanded = expandedAchievementId === ach.id;
          const nextTier = item.activeTier;
            
          const isEarned = item.claimedTier > 0;
          const isLocked = !isEarned && !item.canClaim;

          return (
            <div
              key={ach.id}
              className={`rounded-2xl transition-all border shadow-xs ${
                item.canClaim 
                  ? 'border-amber-400 dark:border-amber-600 bg-amber-50/40 dark:bg-amber-950/10' 
                  : isEarned
                  ? 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131B29]'
                  : 'border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/30 opacity-75'
              }`}
            >
              <div className="p-4 sm:p-5">
                <div className="flex items-start gap-3.5">
                  {/* Icon */}
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
                    item.isFullyCompleted 
                      ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30'
                      : item.canClaim
                      ? 'bg-amber-500/20 text-amber-900 dark:text-amber-200 border-amber-500/40'
                      : isEarned
                      ? 'bg-slate-100 dark:bg-slate-800 text-amber-600 dark:text-amber-400 border-slate-200 dark:border-slate-700'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}>
                    {isLocked ? <Lock size={18} /> : (isEarned ? <Trophy size={18} /> : getCategoryIcon(ach.iconName))}
                  </div>
                  
                  {/* Title & Desc */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm">{ach.name}</h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                        item.isFullyCompleted 
                          ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30' 
                          : isEarned
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700' 
                          : item.canClaim
                          ? 'bg-amber-500/20 text-amber-900 dark:text-amber-200 border-amber-500/40'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}>
                        {item.isFullyCompleted 
                           ? 'Ukończone ★' 
                           : isEarned 
                           ? `Poziom ${item.claimedTier}` 
                           : 'Do odblokowania'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{ach.description}</p>
                  </div>

                  {/* Expand Toggle */}
                  <button 
                    type="button"
                    onClick={() => setExpandedAchievementId(isExpanded ? null : ach.id)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
                  >
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>

                {/* Condition row for unearned achievements */}
                {isLocked && nextTier && (
                  <div className="mt-3 py-1.5 px-3 bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                      <Lock size={12} className="text-amber-500" />
                      <span>Wymóg: <strong className="text-slate-900 dark:text-white font-bold">{nextTier.target} {ach.unit}</strong></span>
                    </div>
                    <span className="text-[11px] font-bold text-slate-400">
                      Postęp: {item.currentValue} / {nextTier.target}
                    </span>
                  </div>
                )}

                {/* Progress bar & Claim button */}
                {!item.isFullyCompleted && nextTier && (
                  <div className="mt-3">
                    <div className="flex justify-between items-center text-xs mb-1.5">
                      <span className="text-slate-500 dark:text-slate-400">
                        Poziom {nextTier.tier}: <strong className="text-slate-900 dark:text-white font-bold">{nextTier.tierName}</strong>
                      </span>
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-300 text-[11px]">
                        {item.currentValue} / {nextTier.target} {ach.unit}
                      </span>
                    </div>
                    
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-2.5">
                      <div 
                        className="h-full rounded-full transition-all duration-300 bg-amber-500"
                        style={{ width: `${item.progressPercent}%` }}
                      />
                    </div>
                    
                    {/* Rewards Preview */}
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
                        <span className="flex items-center gap-1 text-amber-800 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 text-[11px]">
                          <Coins size={11} /> +{nextTier.rewardCoins}
                        </span>
                        <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 text-[11px]">
                          <Crown size={11} /> +{nextTier.rewardTokens}
                        </span>
                      </div>
                      
                      {item.canClaim && (
                        <button 
                          type="button"
                          onClick={() => handleClaim(ach.id, nextTier.tier)}
                          className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                        >
                          <Gift size={13} />
                          Odbierz
                        </button>
                      )}
                    </div>
                  </div>
                )}
                
                {item.isFullyCompleted && (
                  <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                      <CheckCircle2 size={14} />
                      Wszystkie poziomy zdobyte
                    </div>
                    <span className="font-mono font-bold text-slate-400 text-[11px]">
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
                    className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 p-4 space-y-2"
                  >
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                      Poziomy osiągnięcia:
                    </span>
                    {ach.tiers.map(t => {
                      const isClaimed = t.tier <= item.claimedTier;
                      const isNext = nextTier?.tier === t.tier;
                      return (
                        <div 
                          key={t.tier}
                          className={`p-2.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs transition-all ${
                            isClaimed 
                              ? 'bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-300' 
                              : isNext
                              ? 'bg-amber-50/50 dark:bg-amber-950/10 border-amber-300 dark:border-amber-800/40 text-amber-900 dark:text-amber-200 font-medium'
                              : 'bg-white dark:bg-[#131B29] border-slate-200 dark:border-slate-800 text-slate-400'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs ${
                              isClaimed 
                                ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' 
                                : isNext
                                ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                            }`}>
                              {isClaimed ? '✓' : t.tier}
                            </div>
                            <div>
                              <div className="font-bold flex items-center gap-1.5 text-xs">
                                <span>{t.tierName}</span>
                                <span className="text-[10px] text-slate-400">({t.target} {ach.unit})</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-amber-800 dark:text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-md text-[10px] flex items-center gap-1">
                              +{t.rewardCoins} <Coins size={10}/>
                            </span>
                            <span className="text-slate-600 dark:text-slate-300 font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-[10px] flex items-center gap-1">
                              +{t.rewardTokens} <Crown size={10}/>
                            </span>
                            
                            {isNext && item.canClaim && (
                              <button 
                                type="button"
                                onClick={() => handleClaim(ach.id, t.tier)}
                                className="px-2.5 py-1 bg-amber-500 text-slate-950 font-bold text-[10px] rounded-lg shadow-xs cursor-pointer hover:bg-amber-400 transition-colors"
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
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default AchievementsSection;
