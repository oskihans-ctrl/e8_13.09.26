import React from 'react';
import { LayoutDashboard, GraduationCap, Swords, FileText, User, Sparkles, Trophy, Flame } from 'lucide-react';
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
    { id: 'nauka' as TabState, label: 'Nauka', sublabel: 'Plan Nauki E8', icon: GraduationCap },
    { id: 'simulator' as TabState, label: 'Egzamin E8', sublabel: 'Symulator arkusza', icon: FileText },
    { id: 'arena' as TabState, label: 'Arena', sublabel: 'Ranking & ELO', icon: Swords },
    { id: 'profile' as TabState, label: 'Profil', sublabel: 'Skarbiec & Odznaki', icon: User },
  ];

  // League calculation for mini profile
  const rating = userState?.arenaRating || 1000;
  let leagueName = 'Liga Brązowa';
  let leagueColor = 'text-amber-500';
  if (rating >= 1800) { leagueName = 'Diament'; leagueColor = 'text-cyan-400'; }
  else if (rating >= 1500) { leagueName = 'Platyna'; leagueColor = 'text-teal-300'; }
  else if (rating >= 1300) { leagueName = 'Złoto'; leagueColor = 'text-yellow-400'; }
  else if (rating >= 1100) { leagueName = 'Srebro'; leagueColor = 'text-gray-300'; }

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
        <div className="pointer-events-auto flex items-center justify-between gap-1 bg-[#0F172A]/95 backdrop-blur-[16px] border border-slate-800 p-1.5 rounded-2xl shadow-xl w-full max-w-sm">
          {navItems.filter(item => item.id !== 'profile').map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button 
                key={item.id}
                id={`mobile-nav-${item.id}`}
                onClick={() => handleTabChange(item.id)}
                className={`relative flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl transition-all duration-200 select-none ${
                  isActive 
                    ? 'bg-slate-800 border border-slate-700 text-white flex-1 active:scale-[0.97]' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50 active:scale-[0.95] px-3'
                }`}
              >
                <div className={`transition-transform duration-200 ${isActive ? 'scale-105 text-sky-400' : ''}`}>
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
        className="hidden md:flex lg:hidden flex-col items-center justify-between w-20 shrink-0 h-screen sticky top-0 bg-[#0B0E14] border-r border-slate-800/80 py-5 z-40 select-none pointer-events-auto"
      >
        {/* Logo Mark */}
        <div className="flex flex-col items-center gap-1.5">
          <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center">
            <JasneLogo variant="icon" size="sm" />
          </div>
          <span className="text-[10px] font-bold uppercase text-slate-300 tracking-wider">Jasne.</span>
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
                className={`w-full py-2.5 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-all duration-200 group ${
                  isActive
                    ? 'bg-slate-800 text-white border border-slate-700'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
                title={item.label}
              >
                <Icon size={20} className={isActive ? 'text-sky-400' : 'group-hover:scale-110 transition-transform'} />
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
          className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 p-0.5 flex items-center justify-center hover:border-sky-400 transition-colors"
          title="Twój profil"
        >
          <div className="w-full h-full bg-[#0F172A] rounded-full flex items-center justify-center text-slate-300">
            <User size={18} />
          </div>
        </button>
      </aside>

      {/* =========================================================================
          3. DESKTOP: Pełny stały pasek boczny (Sidebar, 1024px+)
         ========================================================================= */}
      <aside 
        aria-label="Pasek boczny aplikacji"
        className="hidden lg:flex flex-col justify-between w-[270px] shrink-0 h-screen sticky top-0 bg-[#0B0E14] border-r border-slate-800/80 p-5 z-40 select-none pointer-events-auto"
      >
        <div className="flex flex-col gap-7">
          {/* Logo i Odznaka Jasne. */}
          <div className="flex items-center justify-between px-1">
            <JasneLogo variant="horizontal" size="md" showBadge={true} />
            <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider text-slate-300 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-full">
              2025
            </span>
          </div>

          {/* Lista zakładek */}
          <nav className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider px-3 mb-1">
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
                      ? 'bg-slate-800 border border-slate-700 text-white font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-850 border border-transparent font-medium'
                  }`}
                >
                  <div className={`p-2 rounded-lg transition-all ${
                    isActive 
                      ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' 
                      : 'bg-slate-800/60 text-slate-400 group-hover:text-white group-hover:bg-slate-800'
                  }`}>
                    <Icon size={18} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm leading-tight truncate">
                      {item.label}
                    </span>
                    <span className={`text-[11px] font-normal truncate ${isActive ? 'text-slate-300' : 'text-slate-400'}`}>
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
          className="bg-[#0F172A] hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 rounded-xl p-3.5 flex items-center gap-3 transition-all duration-200 cursor-pointer group shadow-sm"
          title="Kliknij, aby otworzyć profil i osiągnięcia"
        >
          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 p-0.5 group-hover:border-sky-400 transition-colors">
              <div className="w-full h-full bg-[#0B0E14] rounded-full flex items-center justify-center">
                <User size={18} className="text-slate-300 group-hover:text-sky-400 transition-colors" />
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 bg-sky-500 text-slate-950 text-[9px] font-black px-1.5 py-0.2 rounded-full border border-[#0B0E14]">
              L{currentLevel}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="font-display font-bold text-white text-xs truncate group-hover:text-sky-400 transition-colors">
                Konto Ucznia
              </span>
              <span className={`text-[10px] font-bold ${leagueColor}`}>
                {leagueName}
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 mt-0.5">
              <span>LVL {currentLevel}</span>
              <span>{xpPct}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1 border border-slate-700/60">
              <div 
                className="h-full bg-sky-400 rounded-full"
                style={{ width: `${xpPct}%` }}
              />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
