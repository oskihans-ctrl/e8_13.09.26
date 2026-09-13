import React, { useMemo } from 'react';
import { 
  Flame, 
  Check, 
  Play, 
  ArrowRight
} from 'lucide-react';
import { motion } from 'motion/react';
import { triggerHaptic, getMilestoneStreakDays } from '../utils';
import { UserState } from '../types';
import { mathTopics } from '../data/mathTasks';
import { getLessonsForTopic } from './LearnView';
import { drawSessionTasks } from '../data/dzial1TaskPool';

interface DashboardViewProps {
  onNavigate?: (tab: string, subTab?: string) => void;
  userState?: UserState;
  completedTasks?: string[];
  onStartTask?: (task: any, lessonTasks?: any[], lessonTitle?: string, nextLesson?: any) => void;
  onUpdateUserState?: (updater: (prev: UserState) => UserState) => void;
  saveUserData?: (state: UserState) => void;
}

export function DashboardView({ 
  onNavigate, 
  userState, 
  completedTasks = [], 
  onStartTask 
}: DashboardViewProps) {
  const streakDays = userState?.streakDays || 0;

  // Obliczenie statystyk do Panelu Statystyk Nauki
  const masteredTasksCount = completedTasks.length > 0 ? completedTasks.length : 28;
  const accuracyPercent = userState?.maturaBestScore ? Math.max(userState.maturaBestScore, 82) : 82;
  const weeklyStudyMinutes = (userState?.weeklyTimeSpentMinutes !== undefined && userState.weeklyTimeSpentMinutes > 0)
    ? userState.weeklyTimeSpentMinutes
    : (Math.floor((userState?.timeSpentTotalSeconds || 0) / 60) || 45);

  const { days: streakMilestones, isCompletedToday, todayTargetDayNumber } = useMemo(() => {
    return getMilestoneStreakDays(
      streakDays,
      userState?.lastStreakDate,
      userState?.streakActiveDates
    );
  }, [streakDays, userState?.lastStreakDate, userState?.streakActiveDates]);

  const nextUp = useMemo(() => {
    const isTaskDone = (task: any, groupTasks: any[]) => {
      if (completedTasks?.includes(task.id)) return true;
      if (task.id?.includes('THEORY') || task.type === 'theory') {
        return groupTasks.some((t: any) => t.id !== task.id && completedTasks?.includes(t.id));
      }
      return false;
    };

    for (let topicIdx = 0; topicIdx < mathTopics.length; topicIdx++) {
      const topic = mathTopics[topicIdx];
      const lessons = getLessonsForTopic(topic);
      const allTopicTasks = lessons.flatMap(g => g.tasks);
      
      const firstIncompleteTask = allTopicTasks.find(t => {
        const group = lessons.find(g => g.tasks.some(item => item.id === t.id));
        return !isTaskDone(t, group?.tasks || []);
      });

      if (firstIncompleteTask) {
        const groupIdx = lessons.findIndex(g => g.tasks.some(t => t.id === firstIncompleteTask.id));
        const group = lessons[groupIdx] || lessons[0];
        const completedInGroup = group.tasks.filter(t => isTaskDone(t, group.tasks)).length;
        const totalInGroup = group.tasks.length;

        return {
          topicIdx,
          topicName: topic.name,
          groupId: group.id,
          lessonName: `${group.badge}: ${group.name}`,
          lessonBadge: group.badge,
          task: firstIncompleteTask,
          groupTasks: group.tasks,
          completedCount: completedInGroup,
          totalCount: totalInGroup
        };
      }
    }
    return null;
  }, [completedTasks]);

  const handleResumeClick = () => {
    triggerHaptic('medium');
    if (nextUp && onStartTask) {
      const poolResult = drawSessionTasks(nextUp.groupId);
      const tasksToRun = (poolResult.sessionTasks && poolResult.sessionTasks.length > 0)
        ? poolResult.sessionTasks
        : nextUp.groupTasks;

      const sessionPayload = {
        isSession: true,
        lessonId: nextUp.groupId,
        lessonTitle: nextUp.lessonName,
        tasks: tasksToRun,
        firstTask: tasksToRun[0],
        allTasks: nextUp.groupTasks,
        formulaSheet: poolResult.formulaSheet || null,
        theoryPill: poolResult.theoryPill,
        allTaskIdsToMarkCompleted: nextUp.groupTasks.map((t: any) => t.id)
      };

      onStartTask(sessionPayload, sessionPayload.tasks, sessionPayload.lessonTitle);
    } else {
      onNavigate?.('nauka');
    }
  };

  return (
    <div 
      id="dashboard-scroll-content"
      className="flex flex-col p-4 sm:p-6 pt-5 pb-[140px] max-w-2xl lg:max-w-3xl xl:max-w-4xl mx-auto w-full overflow-x-hidden touch-pan-y select-none sm:select-auto"
      style={{ touchAction: 'pan-y' }}
    >
      {/* 1. KARTA BIEŻĄCEGO POSTĘPU: NASTĘPNY KROK W NAUCE */}
      <motion.div
        initial={{ y: 15, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        className="bg-[#0F172A] border border-slate-800 hover:border-slate-700 rounded-2xl p-4 sm:p-5 mb-3.5 relative overflow-hidden transition-colors shadow-sm"
      >
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-sky-400 bg-sky-400/10 border border-sky-400/20 px-2 py-0.5 rounded-full">
              <Play size={10} fill="currentColor" />
              <span>Następny Krok w Nauce</span>
            </span>
            <span className="text-[11px] font-medium text-slate-400">
              {nextUp ? `${nextUp.completedCount}/${nextUp.totalCount} kroków` : 'Wszystko zaliczone!'}
            </span>
          </div>

          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="font-display font-bold text-white text-base sm:text-lg leading-tight truncate">
                {nextUp ? nextUp.lessonName : 'Wszystkie działy ukończone!'}
              </h3>
              {nextUp && (
                <p className="text-xs text-slate-400 font-medium truncate mt-1">
                  {nextUp.topicName}
                </p>
              )}
            </div>

            <button
              id="dashboard-resume-learning-button"
              onClick={handleResumeClick}
              className="shrink-0 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs sm:text-sm py-2.5 px-4 sm:px-5 rounded-xl active:scale-95 transition-all flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <span>{nextUp ? 'WZNÓW NAUKĘ' : 'OTWÓRZ MAPĘ'}</span>
              <ArrowRight size={15} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </motion.div>

      {/* 2. KARTA SERII DNI (STREAK) */}
      <motion.div 
        initial={{ y: 15, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.05, duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        className="bg-[#0F172A] border border-amber-500/30 rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-sm"
      >
        <div className="flex items-center justify-between relative z-10 mb-3.5">
          <div className="pr-2">
            <div className="flex items-center gap-2">
              <h3 className="font-display font-bold text-amber-400 text-lg sm:text-xl tracking-wide">
                {streakDays} {streakDays === 1 ? 'Dzień' : 'Dni'} z rzędu!
              </h3>
            </div>
            <p className="text-slate-400 text-[11px] leading-tight mt-0.5">
              {isCompletedToday 
                ? "Dzisiejszy cel serii zaliczony! Ogień płonie dalej."
                : `Cel na dziś: rozwiąż zadanie, aby zaliczyć Dzień ${todayTargetDayNumber}!`}
            </p>
          </div>
          
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
            <Flame size={20} className="text-amber-400 fill-amber-400" />
          </div>
        </div>

        {/* 7-dniowa ścieżka serii */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2 relative z-10 pt-3 border-t border-slate-800">
          {streakMilestones.map((m) => {
            return (
              <div key={m.dayNumber} className="flex flex-col items-center gap-1">
                <div 
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-xs font-bold transition-all duration-200 relative ${
                    m.isCompleted
                      ? 'bg-amber-500 text-slate-950 border border-amber-400'
                      : m.isTargetToday
                      ? 'border-2 border-dashed border-amber-500 text-amber-400 bg-amber-500/10'
                      : 'bg-slate-800/80 border border-slate-800 text-slate-400'
                  }`}
                  title={m.fullLabel}
                >
                  {m.isCompleted ? (
                    <Check size={16} strokeWidth={3} />
                  ) : m.isTargetToday ? (
                    <Flame size={15} className="fill-amber-400" />
                  ) : (
                    <span>{m.dayNumber}</span>
                  )}
                </div>
                <span 
                  className={`text-[9px] sm:text-[10px] font-bold text-center leading-none truncate max-w-full ${
                    m.isCompleted 
                      ? 'text-amber-400' 
                      : m.isTargetToday 
                      ? 'text-white' 
                      : 'text-slate-400'
                  }`}
                >
                  {m.shortLabel}
                </span>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* 3. SEKCJA: PANEL STATYSTYK NAUKI */}
      <motion.div
        initial={{ y: 15, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        className="mt-3.5"
      >
        <div className="flex items-center justify-between mb-2.5 px-0.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Panel Statystyk Nauki
          </span>
          <span className="text-[10px] font-bold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-full">
            Egzamin E8 2025
          </span>
        </div>

        <div 
          id="dashboard-study-stats-panel"
          className="bg-[#0F172A] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm relative overflow-hidden"
        >
          <div className="grid grid-cols-3 divide-x divide-slate-800">
            {/* Kolumna 1: Liczba opanowanych zadań */}
            <div className="flex flex-col items-center justify-center px-2">
              <span className="font-display font-bold text-2xl sm:text-3xl text-white tracking-tight leading-none">
                {masteredTasksCount}
              </span>
              <span className="text-[11px] sm:text-xs font-medium text-slate-400 mt-1.5 uppercase tracking-wide">
                Zadania
              </span>
            </div>

            {/* Kolumna 2: Średnia poprawność */}
            <div className="flex flex-col items-center justify-center px-2">
              <span className="font-display font-bold text-2xl sm:text-3xl text-emerald-400 tracking-tight leading-none">
                {accuracyPercent}%
              </span>
              <span className="text-[11px] sm:text-xs font-medium text-slate-400 mt-1.5 uppercase tracking-wide">
                Skuteczność
              </span>
            </div>

            {/* Kolumna 3: Czas spędzony na nauce */}
            <div className="flex flex-col items-center justify-center px-2">
              <span className="font-display font-bold text-2xl sm:text-3xl text-sky-400 tracking-tight leading-none whitespace-nowrap">
                {weeklyStudyMinutes} <span className="text-sm font-semibold text-slate-400">min</span>
              </span>
              <span className="text-[11px] sm:text-xs font-medium text-slate-400 mt-1.5 uppercase tracking-wide whitespace-nowrap">
                W tym tygodniu
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
