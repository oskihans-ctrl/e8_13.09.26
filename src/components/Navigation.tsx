import React from 'react';
import { LayoutDashboard, GraduationCap, Swords, FileText, User } from 'lucide-react';
import { TabState, UserState } from '../types';
import { triggerHaptic } from '../utils';
import { JasneLogo } from './JasneLogo';

interface NavigationProps {
  currentTab: TabState;
  setTab: (tab: TabState) => void;
  userState?: UserState;
  onProfileClick?: () => void;
}

export function Navigation({ currentTab, setTab, userState, onProfileClick }: NavigationProps) {
  const handleTabChange = (tab: TabState) => {
    if (tab !== currentTab) {
      triggerHaptic('light');
      setTab(tab);
    }
  };

  const navItems = [
    { id: 'dashboard' as TabState, label: 'Dashboard', sublabel: 'Główny panel', icon: LayoutDashboard },
    { id: 'nauka' as TabState, label: 'Nauka', sublabel: 'Plan Nauki CKE', icon: GraduationCap },
    { id: 'simulator' as TabState, label: 'Symulator', sublabel: 'Arkusz egzaminacyjny', icon: FileText },
    { id: 'arena' as TabState, label: 'Arena', sublabel: 'Ranking & ELO', icon: Swords },
    { id: 'profile' as TabState, label: 'Profil', sublabel: 'Skarbiec & Odznaki', icon: User },
  ];

  // League calculation for mini profile
  const rating = userState?.arenaRating || 1000;
  let leagueName = 'Liga Brązowa';
  let leagueColor = 'text-amber-600 dark:text-amber-500';
  if (rating >= 1800) { leagueName = 'Diament'; leagueColor = 'text-sky-600 dark:text-sky-400'; }
  else if (rating >= 1500) { leagueName = 'Platyna'; leagueColor = 'text-teal-600 dark:text-teal-300'; }
  else if (rating >= 1300) { leagueName = 'Złoto'; leagueColor = 'text-amber-500 dark:text-amber-400'; }
  else if (rating >= 1100) { leagueName = 'Srebro'; leagueColor = 'text-slate-500 dark:text-slate-300'; }

  const currentLevel = userState?.level || 1;
  const currentXp = userState?.xp || 0;
  const xpInLevel = currentXp % 1000;
  const xpPct = Math.min(100, Math.round((xpInLevel / 1000) * 100));

  return (
    <>
      {/* =========================================================================
          1. MOBILE: Pływający dolny dock (<768px)
         ========================================================================= */}
      <nav 
        aria-label="Główna nawigacja mobilna"
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 pointer-events-none flex justify-center pb-[max(14px,env(safe-area-inset-bottom))] px-3"
      >
        <div className="pointer-events-auto flex items-center justify-between gap-1 bg-white/98 dark:bg-[#0F172A]/98 backdrop-blur-[16px] border border-slate-300 dark:border-slate-700 p-1.5 rounded-2xl shadow-[0_12px_36px_rgba(15,23,42,0.18)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.6)] w-full max-w-sm">
          {navItems.filter(item => item.id !== 'profile').map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button 
                key={item.id}
                id={`mobile-nav-${item.id}`}
                onClick={() => handleTabChange(item.id)}
                className={`relative flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl transition-all duration-200 select-none cursor-pointer ${
                  isActive 
                    ? 'bg-amber-500/15 dark:bg-slate-800 border-2 border-amber-500/70 dark:border-slate-700 text-amber-950 dark:text-white flex-1 shadow-xs active:scale-[0.97]' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50 active:scale-[0.95] px-3'
                }`}
              >
                <div className={`transition-transform duration-200 ${isActive ? 'scale-105 text-amber-600 dark:text-amber-400' : ''}`}>
                  <Icon size={20} />
                </div>
                {isActive && (
                  <span className="text-[12px] font-bold tracking-wide whitespace-nowrap animate-in fade-in duration-200">
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* =========================================================================
          2. TABLET: Wąski Navigation Rail (768px do 1023px)
         ========================================================================= */}
      <aside 
        aria-label="Pasek nawigacyjny tabletu"
        className="hidden md:flex lg:hidden flex-col items-center justify-between w-20 shrink-0 h-screen sticky top-0 bg-white dark:bg-[#090D16] border-r border-slate-300 dark:border-slate-800 py-5 z-40 select-none pointer-events-auto shadow-[4px_0_24px_rgba(15,23,42,0.08)] transition-colors duration-200"
      >
        {/* Logo Mark - czyste oficjalne logo bez sztucznej ramki */}
        <div className="flex flex-col items-center gap-1.5 pt-1">
          <JasneLogo variant="icon" size="sm" />
          <span className="text-[11px] font-black text-[#FFC700] dark:text-[#FFD000] tracking-tight drop-shadow-[0_1px_2px_rgba(217,119,6,0.2)]">Jasne.</span>
        </div>

        {/* Rail Items */}
        <div className="flex flex-col items-center gap-2.5 w-full px-2">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                id={`rail-nav-${item.id}`}
                onClick={() => {
                  if (item.id === 'profile' && onProfileClick) {
                    onProfileClick();
                  } else {
                    handleTabChange(item.id);
                  }
                }}
                className={`w-full py-2.5 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-all duration-200 group cursor-pointer ${
                  isActive
                    ? 'bg-amber-500/15 dark:bg-slate-800 text-amber-950 dark:text-white border-2 border-amber-500/60 dark:border-slate-700 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/40'
                }`}
                title={item.label}
              >
                <Icon size={20} className={isActive ? 'text-amber-600 dark:text-amber-400' : 'group-hover:scale-110 transition-transform'} />
                <span className="text-[10px] font-bold tracking-tight text-center leading-none truncate max-w-full">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Bottom Profile Thumbnail */}
        <button
          onClick={onProfileClick}
          className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 p-0.5 flex items-center justify-center hover:border-amber-400 shadow-xs transition-colors cursor-pointer"
          title="Twój profil"
        >
          <div className="w-full h-full bg-slate-50 dark:bg-[#0F172A] rounded-full flex items-center justify-center text-slate-700 dark:text-slate-300">
            <User size={18} />
          </div>
        </button>
      </aside>

      {/* =========================================================================
          3. DESKTOP: Pełny stały pasek boczny (Sidebar, 1024px+)
         ========================================================================= */}
      <aside 
        aria-label="Pasek boczny aplikacji"
        className="hidden lg:flex flex-col justify-between w-[270px] shrink-0 h-screen sticky top-0 bg-white dark:bg-[#090D16] border-r border-slate-300 dark:border-slate-800 p-5 z-40 select-none pointer-events-auto shadow-[4px_0_28px_rgba(15,23,42,0.08)] dark:shadow-[4px_0_24px_rgba(0,0,0,0.4)] transition-colors duration-200"
      >
        <div className="flex flex-col gap-7">
          {/* Skrajny lewy górny róg: Czyste oficjalne logo marki Jasne. */}
          <div className="flex flex-col gap-1 px-1">
            <JasneLogo variant="horizontal" size="md" showBadge={false} />
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 pl-0.5 tracking-wide">
              Platforma Egzaminacyjna
            </span>
          </div>

          {/* Lista zakładek */}
          <nav className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold uppercase text-slate-400 dark:text-slate-400 tracking-wider px-3 mb-1">
              Główna Nawigacja
            </span>
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`desktop-sidebar-${item.id}`}
                  onClick={() => {
                    if (item.id === 'profile' && onProfileClick) {
                      onProfileClick();
                    } else {
                      handleTabChange(item.id);
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all duration-200 text-left group cursor-pointer ${
                    isActive
                      ? 'bg-amber-500/10 dark:bg-slate-800 border-2 border-amber-500/50 dark:border-slate-700 text-slate-900 dark:text-white font-bold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-transparent hover:border-slate-300 dark:hover:border-slate-700 font-medium'
                  }`}
                >
                  <div className={`p-2 rounded-lg transition-all ${
                    isActive 
                      ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30' 
                      : 'bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white group-hover:bg-slate-200 dark:group-hover:bg-slate-800'
                  }`}>
                    <Icon size={18} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm leading-tight truncate">
                      {item.label}
                    </span>
                    <span className={`text-[11px] font-normal truncate ${isActive ? 'text-amber-700 dark:text-slate-300' : 'text-slate-500 dark:text-slate-400'}`}>
                      {item.sublabel}
                    </span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Miniatura Profilu na samym dole */}
        <div 
          onClick={onProfileClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onProfileClick?.(); }}
          className="bg-slate-50 dark:bg-[#131B29] hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-xl p-3.5 flex items-center gap-3 transition-all duration-200 cursor-pointer group shadow-xs"
          title="Kliknij, aby otworzyć profil i osiągnięcia"
        >
          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-0.5 group-hover:border-amber-400 transition-colors">
              <div className="w-full h-full bg-slate-100 dark:bg-[#0B0F17] rounded-full flex items-center justify-center">
                <User size={18} className="text-slate-700 dark:text-slate-300 group-hover:text-amber-500 transition-colors" />
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-950 text-[9px] font-bold px-1.5 py-0.2 rounded-full border border-white dark:border-[#0B0F17]">
              L{currentLevel}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="font-display font-bold text-slate-900 dark:text-white text-xs truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                Konto Ucznia
              </span>
              <span className={`text-[10px] font-bold ${leagueColor}`}>
                {leagueName}
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              <span>LVL {currentLevel}</span>
              <span>{xpPct}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mt-1 border border-slate-300/40 dark:border-slate-700/60">
              <div 
                className="h-full bg-amber-500 rounded-full"
                style={{ width: `${xpPct}%` }}
              />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
