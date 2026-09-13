import { useState } from 'react';
import { UserState } from '../types';
import { User, Flame, Coins, Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { triggerHaptic } from '../utils';
import { JasneLogo } from './JasneLogo';

interface HeaderProps {
  state: UserState;
  onProfileClick?: () => void;
  currentTab?: string;
}

export function Header({ state, onProfileClick }: HeaderProps) {
  const [showXpTooltip, setShowXpTooltip] = useState(false);
  const currentXpInLevel = state.xp % 1000;
  const xpPercent = Math.min(100, Math.max(0, (currentXpInLevel / 1000) * 100));

  const toggleXpTooltip = () => {
    triggerHaptic('light');
    setShowXpTooltip(prev => !prev);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0B0E14]/90 backdrop-blur-2xl border-b border-white/5 px-4 sm:px-6 py-3 flex items-center justify-between relative">
      {/* LEWA STRONA: Gracz, Neonowy Poziom, Ranga & Pasek XP */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Mobile / Tablet Jasne Brand Logo */}
        <div className="lg:hidden flex items-center pr-2 sm:pr-2.5 border-r border-white/10 shrink-0">
          <div className="sm:hidden">
            <JasneLogo variant="icon" size="xs" />
          </div>
          <div className="hidden sm:block">
            <JasneLogo variant="horizontal" size="xs" />
          </div>
        </div>

        <button 
          onClick={onProfileClick}
          aria-label="Otwórz profil gracza"
          className="relative group shrink-0 transition-transform duration-150 active:scale-[0.96]"
        >
          {/* Avatar z eleganckim obramowaniem */}
          <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-slate-700/80 p-0.5 group-hover:border-sky-400/80 transition-colors">
            <div className="w-full h-full bg-[#0F172A] rounded-full flex items-center justify-center overflow-hidden">
              <User size={18} className="text-slate-200 group-hover:text-sky-300 transition-colors" />
            </div>
          </div>
          {/* Badge z poziomem */}
          <div className="absolute -bottom-1 -right-1 bg-sky-500 text-slate-950 text-[9px] font-black px-1.5 py-0.2 rounded-full border-2 border-[#0B0E14] leading-tight tracking-tight">
            L{state.level}
          </div>
        </button>

        {/* Informacje o postępie XP & Klikalny pasek */}
        <div 
          onClick={toggleXpTooltip}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleXpTooltip(); }}
          className="flex flex-col cursor-pointer select-none group min-w-[110px] sm:min-w-[130px]"
          title="Kliknij, aby zobaczyć szczegóły XP"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-display font-bold text-white text-xs tracking-wide group-hover:text-sky-300 transition-colors flex items-center gap-1">
              <span>LVL {state.level}</span>
              <span className="text-[10px] text-slate-400 font-normal">• Gracz</span>
            </span>
          </div>

          {/* Pasek postępu XP */}
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden relative border border-slate-700/60">
            <div 
              className="h-full bg-sky-400 rounded-full"
              style={{
                width: `${xpPercent}%`,
                transition: 'width 0.6s cubic-bezier(0.65, 0, 0.35, 1)'
              }}
            />
          </div>
        </div>
      </div>

      {/* PRAWA STRONA: Skarbiec podręczny (Maksymalnie 2 wskaźniki: Płomień Passy + Główne Monety) */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Wskaźnik 1: Płomień Passy */}
        <div 
          className="flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/30 px-2.5 py-1.5 rounded-full"
          title={`Aktualna seria: ${state.streakDays || 0} dni z rzędu`}
        >
          <Flame size={15} className="text-orange-400 fill-orange-400" />
          <span className="font-display font-bold text-orange-300 text-xs leading-none">
            {state.streakDays || 0}
          </span>
        </div>

        {/* Wskaźnik 2: Główne Monety */}
        <div 
          className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1.5 rounded-full"
          title={`Monety Kampusu: ${state.coins}`}
        >
          <Coins size={14} className="text-amber-400" />
          <span className="font-display font-bold text-slate-100 text-xs leading-none">
            {state.coins.toLocaleString('pl-PL')}
          </span>
        </div>
      </div>

      {/* Floating Tooltip dla dokładnych wartości XP */}
      <AnimatePresence>
        {showXpTooltip && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setShowXpTooltip(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.96 }}
              transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
              className="absolute top-[52px] left-4 z-50 bg-[#141A23] border border-[#00E5FF]/30 p-3.5 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.8),0_0_20px_rgba(0,229,255,0.15)] w-60"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-[#00E5FF] flex items-center gap-1">
                  <Sparkles size={12} /> Postęp Poziomu {state.level}
                </span>
                <button 
                  onClick={() => setShowXpTooltip(false)}
                  className="text-[#8B8D98] hover:text-white p-0.5 rounded-md"
                >
                  <X size={13} />
                </button>
              </div>
              <div className="flex items-baseline justify-between text-xs mb-1.5">
                <span className="text-white font-black">{currentXpInLevel} / 1000 XP</span>
                <span className="text-[#8B8D98] text-[10px]">{Math.round(xpPercent)}%</span>
              </div>
              <div className="w-full h-1.5 bg-[#0B0E14] rounded-full overflow-hidden mb-2">
                <div 
                  className="h-full bg-[#00E5FF] rounded-full shadow-[0_0_8px_#00E5FF]" 
                  style={{ width: `${xpPercent}%` }}
                />
              </div>
              <p className="text-[10px] text-[#9CA3AF] leading-snug">
                Brakuje jeszcze <strong className="text-white">{1000 - currentXpInLevel} XP</strong> do Poziomu {state.level + 1}.
              </p>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
