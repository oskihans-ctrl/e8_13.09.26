import { useState } from 'react';
import { UserState } from '../types';
import { User, Flame, Coins, Sparkles, X, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { triggerHaptic } from '../utils';
import { JasneLogo } from './JasneLogo';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  state: UserState;
  onProfileClick?: () => void;
  currentTab?: string;
}

export function Header({ state, onProfileClick }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const [showXpTooltip, setShowXpTooltip] = useState(false);
  const currentXpInLevel = state.xp % 1000;
  const xpPercent = Math.min(100, Math.max(0, (currentXpInLevel / 1000) * 100));

  const toggleXpTooltip = () => {
    triggerHaptic('light');
    setShowXpTooltip(prev => !prev);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/98 dark:bg-[#090D16]/98 backdrop-blur-xl border-b border-slate-300 dark:border-slate-800 px-4 sm:px-6 py-2.5 flex items-center justify-between relative shadow-[0_4px_16px_rgba(15,23,42,0.08)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] transition-colors duration-200">
      {/* LEWA STRONA: Gracz, Poziom, Ranga & Pasek XP */}
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        {/* Na mobile (gdzie nie ma paska bocznego): czyste oficjalne logo w skrajnym lewym rogu bez sztucznej ramki */}
        <div className="md:hidden flex items-center pr-2.5 border-r border-slate-200 dark:border-slate-800 shrink-0">
          <JasneLogo variant="horizontal" size="xs" showBadge={false} />
        </div>

        <button 
          onClick={onProfileClick}
          aria-label="Otwórz profil gracza"
          className="relative group shrink-0 transition-transform duration-150 active:scale-[0.96] cursor-pointer"
        >
          {/* Avatar z eleganckim obramowaniem i cieniem */}
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 p-0.5 group-hover:border-amber-400 shadow-xs transition-all">
            <div className="w-full h-full bg-slate-50 dark:bg-[#0F172A] rounded-full flex items-center justify-center overflow-hidden">
              <User size={18} className="text-slate-700 dark:text-slate-200 group-hover:text-amber-500 transition-colors" />
            </div>
          </div>
          {/* Badge z poziomem - Zgodny z WCAG AA (ciemny tusz na żółci) */}
          <div className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-950 text-[9px] font-black px-1.5 py-0.2 rounded-full border-2 border-white dark:border-[#090D16] leading-tight tracking-tight shadow-xs">
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
            <span className="font-display font-bold text-slate-900 dark:text-white text-xs tracking-wide group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors flex items-center gap-1">
              <span>LVL {state.level}</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">• Gracz</span>
            </span>
          </div>

          {/* Pasek postępu XP */}
          <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden relative border border-slate-300/60 dark:border-slate-700 shadow-inner">
            <div 
              className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full shadow-xs"
              style={{
                width: `${xpPercent}%`,
                transition: 'width 0.6s cubic-bezier(0.65, 0, 0.35, 1)'
              }}
            />
          </div>
        </div>
      </div>

      {/* PRAWA STRONA: Skarbiec podręczny + Przełącznik Motywu */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Wskaźnik 1: Płomień Passy (Streak - semantyczny pomarańcz) */}
        <div 
          className="flex items-center gap-1.5 bg-white dark:bg-slate-850 border border-orange-200 dark:border-orange-500/30 px-2.5 py-1 rounded-full shadow-xs"
          title={`Aktualna seria: ${state.streakDays || 0} dni z rzędu`}
        >
          <Flame size={14} className="text-orange-500 fill-orange-500" />
          <span className="font-display font-bold text-orange-600 dark:text-orange-400 text-xs leading-none">
            {state.streakDays || 0}
          </span>
        </div>

        {/* Wskaźnik 2: Monety (Bursztyn) */}
        <div 
          className="flex items-center gap-1.5 bg-white dark:bg-slate-850 border border-amber-200 dark:border-amber-500/30 px-2.5 py-1 rounded-full shadow-xs"
          title={`Monety: ${state.coins}`}
        >
          <Coins size={14} className="text-amber-500" />
          <span className="font-display font-bold text-slate-800 dark:text-slate-100 text-xs leading-none">
            {state.coins.toLocaleString('pl-PL')}
          </span>
        </div>

        {/* Przełącznik Motywu (Light Mode / Dark Mode) */}
        <button
          onClick={() => {
            triggerHaptic('light');
            toggleTheme();
          }}
          className="btn-depth-secondary p-1.5 sm:p-2 rounded-xl flex items-center justify-center cursor-pointer"
          title={theme === 'dark' ? 'Przełącz na Jasny motyw (Domyślny)' : 'Przełącz na Tryb nocny'}
          aria-label="Przełącznik motywu"
        >
          {theme === 'dark' ? (
            <Sun size={16} className="text-amber-400" />
          ) : (
            <Moon size={16} className="text-slate-700" />
          )}
        </button>
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
              className="absolute top-[52px] left-4 z-50 bg-white dark:bg-[#131B29] border border-slate-200 dark:border-slate-700 p-3.5 rounded-2xl shadow-xl w-60"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <Sparkles size={12} /> Postęp Poziomu {state.level}
                </span>
                <button 
                  onClick={() => setShowXpTooltip(false)}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-0.5 rounded-md"
                >
                  <X size={13} />
                </button>
              </div>
              <div className="flex items-baseline justify-between text-xs mb-1.5">
                <span className="text-slate-900 dark:text-white font-bold">{currentXpInLevel} / 1000 XP</span>
                <span className="text-slate-500 text-[10px]">{Math.round(xpPercent)}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-2">
                <div 
                  className="h-full bg-amber-500 rounded-full" 
                  style={{ width: `${xpPercent}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug">
                Brakuje jeszcze <strong className="text-slate-900 dark:text-white font-semibold">{1000 - currentXpInLevel} XP</strong> do Poziomu {state.level + 1}.
              </p>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
