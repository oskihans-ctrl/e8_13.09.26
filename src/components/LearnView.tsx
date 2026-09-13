import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  BookOpen, Calculator, Globe, FlaskConical, ChevronRight, ChevronLeft, ChevronDown,
  Lock, BookText, Zap, PenTool, Award, Dna, ArrowRight, CheckCircle2, Check,
  Sparkles, Layers, Play, Target, RefreshCw, X, Loader2,
  Hash, Binary, EqualNot, TrendingUp, Activity, 
  ListOrdered, TriangleRight, CircleDot, Map as MapIcon, Box, PieChart, Clock, Trophy,
  GraduationCap
} from 'lucide-react';
import { triggerHaptic } from '../utils';
import { motion, AnimatePresence } from 'motion/react';
import { MathRenderer } from './MathRenderer';
import { mathTopics } from '../data/mathTasks';
import { drawSessionTasks } from '../data/dzial1TaskPool';
import { BossExamRunner } from './BossExamRunner';

const mathIcons = [
  Hash, 
  Binary, 
  EqualNot, 
  Layers, 
  TrendingUp, 
  Activity, 
  Target, 
  ListOrdered, 
  TriangleRight, 
  CircleDot, 
  MapIcon, 
  Box, 
  PieChart, 
  Clock, 
  Trophy
];

function getTopicIcon(subjectKey: string, topicIndex: number, DefaultIcon: any) {
  if (subjectKey === 'math' && topicIndex < mathIcons.length) {
    return mathIcons[topicIndex];
  }
  return DefaultIcon;
}

export interface LessonGroup {
  id: string;
  name: string;
  badge: string;
  tasks: any[];
}

/**
 * Robust check if a single task in a lesson is completed.
 * Theory tasks are considered completed if explicitly in completedTasks
 * OR if any practice task in that same lesson has been completed.
 */
export function isTaskCompletedInLesson(
  task: any,
  completedTasks: string[],
  lessonTasks: any[] = []
): boolean {
  if (!task) return false;
  if (completedTasks.includes(task.id)) return true;

  const isTheory = task.id?.includes('THEORY') || task.type === 'theory' || task.cke_source === 'Pigułka Wiedzy';
  if (isTheory && lessonTasks && lessonTasks.length > 1) {
    const practiceTasks = lessonTasks.filter(t => !t.id?.includes('THEORY') && t.type !== 'theory' && t.cke_source !== 'Pigułka Wiedzy');
    if (practiceTasks.length > 0 && practiceTasks.some(t => completedTasks.includes(t.id))) {
      return true;
    }
  }
  return false;
}

/**
 * A lesson is 100% completed if every task in it is completed.
 */
export function isLessonCompleted(group: LessonGroup, completedTasks: string[]): boolean {
  if (!group) return false;
  const cleanId = group.id.replace('lesson-', '');
  if (
    completedTasks.includes(`LESSON-${group.id}`) ||
    completedTasks.includes(`LESSON-${cleanId}`) ||
    completedTasks.includes(`LESSON-${group.id.toLowerCase()}`)
  ) {
    return true;
  }
  if (!group.tasks || group.tasks.length === 0) return false;
  return group.tasks.every(task => isTaskCompletedInLesson(task, completedTasks, group.tasks));
}

/**
 * Cascading Progression Rule:
 * 1. Lesson at index 0 is ALWAYS unlocked.
 * 2. Lesson at index > 0 is unlocked IF AND ONLY IF the immediately preceding lesson
 *    (index - 1) is 100% completed.
 */
export function isLessonUnlocked(
  groupIdx: number,
  allGroups: LessonGroup[],
  completedTasks: string[]
): boolean {
  if (groupIdx === 0) return true;
  const prevGroup = allGroups[groupIdx - 1];
  if (!prevGroup) return false;
  return isLessonCompleted(prevGroup, completedTasks);
}

export function getLessonsForTopic(topic: any): LessonGroup[] {
  if (!topic) return [];
  
  // If topic has structured lessons, map them cleanly
  if (topic.lessons && Array.isArray(topic.lessons) && topic.lessons.length > 0) {
    return topic.lessons.map((lesson: any) => {
      const lessonTasks = (topic.tasks || []).filter((t: any) => String(t.lessonId) === String(lesson.id));
      const isSprawdzian = lesson.title.toLowerCase().includes('sprawdzian');
      return {
        id: String(lesson.id),
        name: lesson.title,
        badge: isSprawdzian ? 'Sprawdzian' : `Lekcja ${lesson.id}`,
        tasks: lessonTasks
      };
    });
  }

  if (!topic.tasks || topic.tasks.length === 0) return [];
  
  const lessonMap = new Map<string, LessonGroup>();
  const lessonOrder: string[] = [];
  
  topic.tasks.forEach((task: any) => {
    let groupKey = '';
    let groupName = '';
    let badge = '';
    
    const isTheory = task.id.includes('THEORY') || (task.type === 'theory' && task.title.toLowerCase().includes('lekcja'));
    const isSprawdzian = (task.topic && task.topic.includes('Sprawdzian')) || task.title.toLowerCase().includes('sprawdzian');
    
    if (isSprawdzian) {
      groupKey = 'SPRAWDZIAN';
      groupName = 'Sprawdzian i Podsumowanie';
      badge = 'Sprawdzian';
    } else if (isTheory) {
      groupKey = task.id;
      const match = task.title.match(/^(Lekcja \d+):\s*(.*)$/i);
      if (match) {
        badge = match[1];
        groupName = match[2];
      } else {
        badge = 'Lekcja';
        groupName = task.title;
      }
    } else {
      const keys = Array.from(lessonOrder).filter(k => k !== 'SPRAWDZIAN');
      if (keys.length > 0) {
        groupKey = keys[keys.length - 1];
        const prevGroup = lessonMap.get(groupKey)!;
        groupName = prevGroup.name;
        badge = prevGroup.badge;
      } else {
        groupKey = 'DEFAULT_1';
        groupName = task.topic ? (task.topic.split('•')[1] || task.topic).trim() : 'Zadania Wprowadzające';
        badge = 'Lekcja 1';
      }
    }
    
    if (!lessonMap.has(groupKey)) {
      lessonMap.set(groupKey, { id: groupKey, name: groupName, badge, tasks: [] });
      lessonOrder.push(groupKey);
    }
    lessonMap.get(groupKey)!.tasks.push(task);
  });
  
  const finalOrder = lessonOrder.filter(k => k !== 'SPRAWDZIAN');
  if (lessonOrder.includes('SPRAWDZIAN')) finalOrder.push('SPRAWDZIAN');
  
  return finalOrder.map(k => lessonMap.get(k)!);
}

function cleanTopicTitle(text: string): string {
  if (!text) return '';
  return text.replace(/^Dział\s+\d+:\s*/i, '').replace(/\s*\(Poziom\s+Podstawowy\)/gi, '').trim();
}

// Curriculum for Polish (E8 - Język Polski CKE - oczekuje na materiały użytkownika)
const polishTopics: any[] = [];

const dataBySubject: Record<string, any> = {
  math: {
    key: 'math',
    name: 'Matematyka',
    level: 'Egzamin Ósmoklasisty • CKE',
    icon: Calculator,
    color: 'text-blue-400',
    topics: mathTopics
  },
  pol: {
    key: 'pol',
    name: 'Język Polski',
    level: 'Egzamin Ósmoklasisty • CKE',
    icon: BookOpen,
    color: 'text-rose-400',
    topics: polishTopics
  },
  eng: {
    key: 'eng',
    name: 'Język Angielski',
    level: 'Egzamin Ósmoklasisty • CKE',
    icon: Globe,
    color: 'text-emerald-400',
    topics: []
  }
};

type ViewState = 'subjects' | 'topics' | 'lessons' | 'tasks';

interface LearnViewProps {
  completedTasks?: string[];
  taskStars?: Record<string, number>;
  onStartTask?: (task: any, lessonTasks?: any[], lessonTitle?: string, nextLesson?: any) => void;
  onCompleteTask?: (taskIds?: string | string[], stars?: number, earnedXp?: number, earnedCoins?: number, nextLesson?: any, sessionDurationSeconds?: number) => void;
  isGuest?: boolean;
  onLoginRequest?: () => void;
  onProRequest?: () => void;
  onBackToDashboard?: () => void;
  onSheetToggle?: (isOpen: boolean) => void;
}

export function LearnView({ 
  onStartTask, 
  onCompleteTask,
  isGuest, 
  onBackToDashboard,
  completedTasks = [],
  taskStars = {},
  onSheetToggle
}: LearnViewProps) {
  const [isBossExamOpen, setIsBossExamOpen] = useState<boolean>(false);

  // Subject selection (math, pol, eng)
  const [selectedSubjectKey, setSelectedSubjectKey] = useState<string>(() => {
    try {
      const stored = localStorage.getItem('matura_quest_selected_subject');
      if (stored && (stored === 'math' || stored === 'pol')) return stored;
    } catch(e) {}
    return 'math';
  });

  // Screen view state
  const [viewState, setViewState] = useState<ViewState>(() => {
    try {
      const stored = localStorage.getItem('matura_quest_last_viewed');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.viewState === 'lessons' || parsed.viewState === 'topics') {
          return parsed.viewState;
        }
      }
    } catch(e) {}
    return 'topics';
  });

  const [selectedTopicIndex, setSelectedTopicIndex] = useState<number | null>(() => {
    try {
      const stored = localStorage.getItem('matura_quest_last_viewed');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.topicIndex !== undefined && parsed.topicIndex !== null) return parsed.topicIndex;
      }
    } catch(e) {}
    return 0;
  });

  // Smart Accordion single expanded lesson
  const [expandedLessonId, setExpandedLessonId] = useState<string | null>(null);

  // Subject Switcher Bottom Sheet
  const [isSubjectSheetOpen, setIsSubjectSheetOpen] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const openSubjectSheet = (open: boolean) => {
    setIsSubjectSheetOpen(open);
    onSheetToggle?.(open);
  };

  useEffect(() => {
    if (!isSubjectSheetOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') openSubjectSheet(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSubjectSheetOpen]);

  // Locked lesson notification snackbar
  const [showLockedToast, setShowLockedToast] = useState<boolean>(false);
  const [lockedToastMessage, setLockedToastMessage] = useState<string>('');
  const toastTimeoutRef = useRef<any>(null);

  // =========================================================================
  // LAZY LOADING DLA LIST DZIAŁÓW (TROPHY ROAD WINDOWING & INTERSECTION OBSERVER)
  // Stopniowo renderuje działy partiami (batch), aby odciążyć DOM i wątek renderowania,
  // zachowując natychmiastową dostępność aktywnego działu użytkownika.
  // =========================================================================
  const TOPICS_BATCH_SIZE = 6;
  const [visibleTopicsCount, setVisibleTopicsCount] = useState<number>(TOPICS_BATCH_SIZE);
  const [isLoadingMoreTopics, setIsLoadingMoreTopics] = useState<boolean>(false);
  const topicSentinelRef = useRef<HTMLDivElement | null>(null);

  // Persist selections
  useEffect(() => {
    localStorage.setItem('matura_quest_selected_subject', selectedSubjectKey);
    localStorage.setItem('matura_quest_last_viewed', JSON.stringify({
      viewState,
      subjectKey: selectedSubjectKey,
      topicIndex: selectedTopicIndex
    }));
  }, [viewState, selectedSubjectKey, selectedTopicIndex]);

  const currentSubject = dataBySubject[selectedSubjectKey] || dataBySubject['math'];
  const currentTopic = (currentSubject && selectedTopicIndex !== null && currentSubject.topics[selectedTopicIndex]) 
    ? currentSubject.topics[selectedTopicIndex] 
    : (currentSubject?.topics?.[0] || null);

  const lessonsForCurrentTopic = currentTopic ? getLessonsForTopic(currentTopic) : [];

  // Aktualizuj lub resetuj liczbę widocznych działów przy zmianie przedmiotu lub wybranego działu
  useEffect(() => {
    const total = currentSubject?.topics?.length || 0;
    if (total === 0) {
      setVisibleTopicsCount(0);
      return;
    }
    // Wyznacz indeks bieżącego aktywnego / odblokowanego działu
    const activeTopicIdx = currentSubject.topics.findIndex((t: any, i: number) => {
      if (i === 0) {
        const tasks = t.tasks || [];
        return !tasks.every((tsk: any) => completedTasks.includes(tsk.id));
      }
      const prev = currentSubject.topics[i - 1];
      const prevTasks = prev?.tasks || [];
      const prevDone = prevTasks.length > 0 && prevTasks.every((tsk: any) => completedTasks.includes(tsk.id));
      if (!prevDone) return false;
      const tasks = t.tasks || [];
      return !tasks.every((tsk: any) => completedTasks.includes(tsk.id));
    });
    const beaconIdx = activeTopicIdx !== -1 ? activeTopicIdx : 0;
    const targetIdx = Math.max(beaconIdx, selectedTopicIndex ?? 0);
    // Zapewnij, że aktywny dział i jego sąsiedzi są od razu widoczni
    const initialBatch = Math.min(total, Math.max(TOPICS_BATCH_SIZE, targetIdx + 2));
    setVisibleTopicsCount((prev) => Math.max(initialBatch, Math.min(prev, total)));
  }, [selectedSubjectKey, currentSubject?.topics?.length, selectedTopicIndex, completedTasks.length]);

  // Intersection Observer dla automatycznego płynnego doczytywania kolejnych partii
  useEffect(() => {
    if (viewState !== 'topics' && viewState !== 'subjects') return;

    const sentinel = topicSentinelRef.current;
    if (!sentinel) return;

    const totalTopics = currentSubject?.topics?.length || 0;
    if (visibleTopicsCount >= totalTopics) return;

    const scrollContainer = typeof document !== 'undefined' ? document.getElementById('main-scroll-container') : null;
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry && entry.isIntersecting) {
          setIsLoadingMoreTopics(true);
          // Krótki interwał asynchroniczny zapobiegający blokowaniu klatki animacji
          const timer = setTimeout(() => {
            setVisibleTopicsCount((prev) => Math.min(totalTopics, prev + TOPICS_BATCH_SIZE));
            setIsLoadingMoreTopics(false);
          }, 80);
          return () => clearTimeout(timer);
        }
      },
      {
        root: scrollContainer || null,
        rootMargin: '240px',
        threshold: 0.05
      }
    );

    observer.observe(sentinel);
    return () => {
      observer.disconnect();
    };
  }, [viewState, visibleTopicsCount, currentSubject?.topics?.length]);

  // =========================================================================
  // AUTO-FOCUS & AUTO-EXPAND ON ENTERING LESSONS VIEW
  // Finds the first unlocked lesson that is not yet 100% completed,
  // expands it for convenience.
  // =========================================================================
  useEffect(() => {
    if (viewState === 'lessons' && lessonsForCurrentTopic.length > 0) {
      // Find the first unlocked, incomplete lesson
      const activeLesson = lessonsForCurrentTopic.find((group, idx) => {
        const unlocked = isLessonUnlocked(idx, lessonsForCurrentTopic, completedTasks);
        const completed = isLessonCompleted(group, completedTasks);
        return unlocked && !completed;
      }) || lessonsForCurrentTopic[0];

      if (activeLesson) {
        setExpandedLessonId(activeLesson.id);
      }
    }
  }, [viewState, selectedTopicIndex, lessonsForCurrentTopic.length]);

  // Overall math progress calculation
  const totalMathTasks = mathTopics.reduce((acc, t) => acc + (t.tasks?.length || 0), 0);
  const completedMathTasks = mathTopics.reduce((acc, t) => {
    return acc + (t.tasks || []).filter((tsk: any) => completedTasks.includes(tsk.id)).length;
  }, 0);
  const mathProgressPercent = totalMathTasks > 0 ? Math.round((completedMathTasks / totalMathTasks) * 100) : 0;

  // Polish progress calculation
  const totalPolTasks = polishTopics.reduce((acc, t) => acc + (t.tasks?.length || 0), 0);
  const completedPolTasks = polishTopics.reduce((acc, t) => {
    return acc + (t.tasks || []).filter((tsk: any) => completedTasks.includes(tsk.id)).length;
  }, 0);
  const polProgressPercent = totalPolTasks > 0 ? Math.round((completedPolTasks / totalPolTasks) * 100) : 0;

  const handleSelectTopic = (index: number, locked: boolean = false) => {
    if (locked) {
      triggerHaptic('error');
      setLockedToastMessage('Ukończ poprzedni dział, aby odblokować ten materiał');
      setShowLockedToast(true);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = setTimeout(() => setShowLockedToast(false), 2500);
      return;
    }
    triggerHaptic('light');
    setSelectedTopicIndex(index);
    setViewState('lessons');
    if (typeof document !== 'undefined') {
      const mainContainer = document.getElementById('main-scroll-container');
      if (mainContainer) {
        mainContainer.scrollTo({ top: 0, behavior: 'instant' });
      }
    }
  };

  const handleBack = () => {
    triggerHaptic('light');
    if (viewState === 'lessons') {
      setViewState('topics');
      if (typeof document !== 'undefined') {
        setTimeout(() => {
          const el = document.getElementById(`topic-card-${selectedTopicIndex}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        }, 50);
      }
    } else if (viewState === 'topics') {
      // Per prompt requirement: Clicking < in topics screen opens the Subject Switcher Bottom Sheet
      openSubjectSheet(true);
    }
  };

  const handleLessonHeaderClick = (group: LessonGroup, isUnlocked: boolean) => {
    if (!isUnlocked) {
      triggerHaptic('error');
      setLockedToastMessage('Ukończ poprzednią lekcję, aby odblokować ten materiał');
      setShowLockedToast(true);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = setTimeout(() => setShowLockedToast(false), 2500);
      return;
    }

    triggerHaptic('light');
    // Smart Accordion: Clicking current closes it; clicking another closes previous and opens current
    setExpandedLessonId(prev => prev === group.id ? null : group.id);
  };

  const handleStartLessonSession = (group: LessonGroup, nextLessonPayload?: any) => {
    triggerHaptic('medium');
    const poolResult = drawSessionTasks(group.id);
    const tasksToRun = (poolResult.sessionTasks && poolResult.sessionTasks.length > 0)
      ? poolResult.sessionTasks
      : group.tasks;

    const taskIdsToMark = (group.tasks && group.tasks.length > 0)
      ? group.tasks.map((t: any) => t.id)
      : [`LESSON-${group.id}`, `LESSON-${group.id.replace('lesson-', '')}`];

    const sessionPayload = {
      isSession: true,
      lessonId: group.id,
      lessonTitle: `${group.badge}: ${group.name}`,
      tasks: tasksToRun,
      formulaSheet: poolResult.formulaSheet,
      theoryPill: poolResult.theoryPill,
      nextLesson: nextLessonPayload,
      allTaskIdsToMarkCompleted: taskIdsToMark
    };

    onStartTask?.(sessionPayload, tasksToRun, `${group.badge}: ${group.name}`, nextLessonPayload);
  };

  return (
    <div 
      id="learn-scroll-content"
      className="flex flex-col min-h-full max-w-2xl lg:max-w-3xl xl:max-w-4xl mx-auto w-full overflow-x-hidden relative touch-pan-y select-none sm:select-auto"
      style={{ touchAction: 'pan-y' }}
    >
      
      {/* =========================================================================
          GLOBAL SNACKBAR / TOAST DLA ZABLOKOWANYCH LEKCJI
         ========================================================================= */}
      <AnimatePresence>
        {showLockedToast && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-[#141A23]/95 backdrop-blur-md border border-sky-500/40 text-sky-300 font-semibold text-xs sm:text-sm shadow-[0_10px_30px_rgba(0,0,0,0.8)] flex items-center gap-2.5 pointer-events-none max-w-[90vw]"
          >
            <div className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
              <Lock size={13} />
            </div>
            <span>{lockedToastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        
        {/* =========================================================================
            SCREEN 1: ŚCIEŻKA DZIAŁÓW (TROPHY ROAD)
            Działa dla Matematyki oraz Języka Polskiego.
           ========================================================================= */}
        {(viewState === 'topics' || viewState === 'subjects') && currentSubject && (() => {
          const completedTopicsCount = currentSubject.topics.filter((t: any) => {
            const tasks = t.tasks || [];
            return tasks.length > 0 && tasks.every((tsk: any) => completedTasks.includes(tsk.id));
          }).length;
          const totalTopicsCount = currentSubject.topics.length;

          // Find active topic index
          const activeTopicIdx = currentSubject.topics.findIndex((t: any, i: number) => {
            if (i === 0) {
              const tasks = t.tasks || [];
              return !tasks.every((tsk: any) => completedTasks.includes(tsk.id));
            }
            const prev = currentSubject.topics[i - 1];
            const prevTasks = prev?.tasks || [];
            const prevDone = prevTasks.length > 0 && prevTasks.every((tsk: any) => completedTasks.includes(tsk.id));
            if (!prevDone) return false;
            const tasks = t.tasks || [];
            return !tasks.every((tsk: any) => completedTasks.includes(tsk.id));
          });
          const currentActiveIdx = activeTopicIdx !== -1 ? activeTopicIdx : 0;
          const visibleTopics = currentSubject.topics.slice(0, visibleTopicsCount);
          const hasMoreTopics = visibleTopicsCount < currentSubject.topics.length;

          return (
            <motion.div 
              key={`topics-${selectedSubjectKey}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col w-full"
            >
              {/* Top Header: Przycisk wstecz < oraz klikalny tytuł otwierają Bottom Sheet wyboru przedmiotu */}
              <header className="px-4 py-2.5 sm:py-3 sticky top-0 bg-[#0B0E14]/95 backdrop-blur-md z-20 border-b border-white/5 shadow-sm shrink-0 flex flex-col gap-2">
                <div className="flex items-center justify-between gap-3 w-full">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button 
                      id="learn-back-subject-button"
                      onClick={handleBack}
                      className="w-9 h-9 rounded-xl bg-[#141A23] border border-white/5 flex items-center justify-center text-white hover:bg-white/10 transition-colors shadow-sm shrink-0 cursor-pointer active:scale-95"
                      aria-label="Wybierz przedmiot"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    
                    {/* Klikalny tytuł przedmiotu otwierający Subject Switcher */}
                    <button
                      id="learn-subject-switcher-trigger"
                      onClick={() => {
                        triggerHaptic('light');
                        openSubjectSheet(true);
                      }}
                      className="flex items-center gap-2 text-left cursor-pointer group rounded-xl px-1.5 py-1 -ml-1.5 hover:bg-white/5 transition-colors"
                    >
                      <h1 className="font-display font-black text-white text-lg sm:text-xl tracking-tight leading-none group-hover:text-[#00C2FF] transition-colors">
                        {currentSubject.name}
                      </h1>
                      <div className="w-5 h-5 rounded-md bg-[#141A23] border border-white/10 flex items-center justify-center text-[#8B8D98] group-hover:text-[#00C2FF] transition-colors shrink-0">
                        <ChevronDown size={14} />
                      </div>
                    </button>
                  </div>

                  <div className="shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#141A23] border border-white/5 text-[11px] font-bold text-[#8B8D98] whitespace-nowrap">
                    <span className="text-emerald-400 font-black">{completedTopicsCount}/{totalTopicsCount}</span>
                    <span>działów</span>
                  </div>
                </div>

                <div className="flex items-center pl-0">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#08131F] border border-[#00C2FF]/40 text-[#00C2FF] text-[10px] sm:text-[11px] font-black tracking-wider uppercase shadow-[0_0_12px_rgba(0,194,255,0.18)] whitespace-nowrap">
                    <GraduationCap size={13} className="text-[#00C2FF]" />
                    <span>Egzamin Ósmoklasisty • CKE</span>
                  </span>
                </div>
              </header>
              
              {/* Lista Działów (Full-width, Law of Common Region) z marginesem pod dolną nawigację */}
              <div className="flex-1 px-4 sm:px-6 pt-3 pb-36 sm:pb-40 relative">
                <div className="space-y-3.5 relative z-10">
                  {visibleTopics.map((topic: any, idx: number) => {
                    // Kaskadowe odblokowywanie działów: Dział 0 zawsze odblokowany; kolejny po ukończeniu poprzednika
                    const prevTopic = idx > 0 ? currentSubject.topics[idx - 1] : null;
                    const prevTopicTasks = prevTopic?.tasks || [];
                    const prevTopicCompleted = idx === 0 || (prevTopicTasks.length > 0 && prevTopicTasks.every((t: any) => completedTasks.includes(t.id)));
                    const isUnlocked = idx === 0 || prevTopicCompleted;
                    const isLocked = !isUnlocked;

                    const allTopicTasks = topic.tasks || [];
                    const completedTopicTasks = allTopicTasks.filter((t: any) => completedTasks.includes(t.id));
                    const isFullyCompleted = allTopicTasks.length > 0 && completedTopicTasks.length === allTopicTasks.length;
                    const isBeaconTopic = (idx === currentActiveIdx) && !isFullyCompleted && isUnlocked;
                    
                    const topicLessons = getLessonsForTopic(topic);
                    const topicLessonsCount = topicLessons.length;
                    const completedTopicLessonsCount = topicLessons.filter(l => isLessonCompleted(l, completedTasks)).length;

                    const progressPercent = topicLessonsCount > 0 
                      ? Math.round((completedTopicLessonsCount / topicLessonsCount) * 100)
                      : allTopicTasks.length > 0 
                        ? Math.round((completedTopicTasks.length / allTopicTasks.length) * 100) 
                        : 0;

                    const cleanName = cleanTopicTitle(topic.name);
                    const formattedNumber = String(idx + 1).padStart(2, '0');

                    return (
                      <button 
                        key={topic.id || idx}
                        id={`topic-card-${topic.id || idx}`}
                        onClick={() => handleSelectTopic(idx, isLocked)}
                        style={{
                          contentVisibility: 'auto',
                          containIntrinsicSize: '0 100px'
                        }}
                        className={`w-full p-4 sm:p-5 rounded-xl border text-left transition-all duration-200 group flex flex-col gap-2.5 relative overflow-hidden cursor-pointer active:scale-[0.99] ${
                          isBeaconTopic
                            ? 'bg-[#111A28] border-sky-500/70'
                            : isFullyCompleted
                              ? 'bg-[#0E1715] border-emerald-500/40'
                              : isLocked
                                ? 'bg-[#0E131C]/60 border-slate-850 opacity-60 hover:opacity-75'
                                : 'bg-[#101724] border-slate-800 hover:border-slate-700 shadow-sm'
                        }`}
                      >
                        {/* Wiersz 1 (Góra): Numer działu (np. "01") + Pastylka stanu po lewej, Liczba lekcji po prawej */}
                        <div className="flex items-center justify-between gap-2 w-full">
                          <div className="flex items-center gap-2">
                            <span className="font-display font-black text-xs text-slate-300 bg-black/40 border border-white/10 px-2 py-0.5 rounded-lg tracking-wider">
                              {formattedNumber}
                            </span>
                            {isLocked ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-white/5 border border-white/5 px-2.5 py-0.5 rounded-full">
                                <Lock size={10} className="text-slate-400" />
                                <span>ZABLOKOWANY</span>
                              </span>
                            ) : isFullyCompleted ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                                <CheckCircle2 size={11} className="text-emerald-400" />
                                <span>ZALICZONY</span>
                              </span>
                            ) : isBeaconTopic ? (
                              <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase text-[#00C2FF] bg-[#00C2FF]/15 border border-[#00C2FF]/40 px-2.5 py-0.5 rounded-full shadow-[0_0_10px_rgba(0,194,255,0.25)]">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#00C2FF] animate-ping" />
                                <span>W TOKU</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-slate-300 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                                DOSTĘPNY
                              </span>
                            )}
                          </div>

                          <span className="text-[11px] font-semibold text-slate-400">
                            {topicLessonsCount > 0 ? `${topicLessonsCount} lekcji` : 'W opracowaniu'}
                          </span>
                        </div>

                        {/* Wiersz 2 (Środek): Duży, czytelny tytuł działu */}
                        <h2 className={`font-display font-black text-base sm:text-lg leading-snug break-words transition-colors ${
                          isLocked ? 'text-slate-400' : 'text-white group-hover:text-[#00C2FF]'
                        }`}>
                          {cleanName}
                        </h2>

                        {/* Wiersz 3 (Dół): Cienki, elegancki pasek postępu z licznikiem */}
                        <div className="space-y-1.5 w-full pt-0.5">
                          <div className="flex items-center justify-between text-[11px] font-semibold">
                            <span className="text-slate-400">
                              {isLocked 
                                ? 'Zablokowany' 
                                : topicLessonsCount > 0 
                                  ? `Ukończono: ${completedTopicLessonsCount}/${topicLessonsCount} lekcji` 
                                  : `Postęp zadań: ${completedTopicTasks.length}/${allTopicTasks.length}`}
                            </span>
                            {!isLocked && (
                              <span className={isFullyCompleted ? "text-emerald-400 font-bold" : isBeaconTopic ? "text-[#00C2FF] font-bold" : "text-slate-300 font-bold"}>
                                {progressPercent}%
                              </span>
                            )}
                          </div>
                          <div className="w-full h-1.5 bg-[#0B0E14] rounded-full overflow-hidden border border-white/5">
                            <div 
                              className={`h-full rounded-full transition-all duration-300 ${
                                isLocked 
                                  ? 'bg-transparent' 
                                  : isFullyCompleted
                                    ? 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                                    : isBeaconTopic 
                                      ? 'bg-[#00C2FF] shadow-[0_0_10px_rgba(0,194,255,0.6)]' 
                                      : 'bg-white/30'
                              }`} 
                              style={{ width: `${isLocked ? 0 : progressPercent}%` }} 
                            />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                
                {/* Lazy Loading Sentinel / Progressive Loader */}
                {hasMoreTopics && (
                  <div 
                    ref={topicSentinelRef}
                    className="pt-6 pb-2 flex flex-col items-center justify-center relative z-10 gap-2.5"
                  >
                    <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#141A23]/90 border border-white/10 text-xs text-[#8B8D98] backdrop-blur-md shadow-lg">
                      <Loader2 size={13} className="animate-spin text-[#00C2FF]" />
                      <span>Doczytywanie kolejnych działów ({visibleTopics.length} z {totalTopicsCount})...</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        setVisibleTopicsCount(totalTopicsCount);
                      }}
                      className="text-[11px] font-semibold text-[#00C2FF] hover:text-cyan-300 underline underline-offset-2 cursor-pointer py-1 px-3 transition-colors active:scale-95"
                    >
                      Pokaż wszystkie działy ({totalTopicsCount})
                    </button>
                  </div>
                )}

                {/* Trofeum na mecie (wyświetlane po wczytaniu wszystkich działów) */}
                {!hasMoreTopics && (
                  <div className="flex flex-col items-center justify-center mt-8 mb-4 relative z-10 text-center">
                    <div className="w-12 h-12 bg-amber-500/15 border border-amber-500/30 rounded-xl flex items-center justify-center mb-2">
                      <Trophy size={24} className="text-amber-400" />
                    </div>
                    <p className="text-xs font-bold uppercase text-slate-300 tracking-wider">Egzamin zdany na 100%</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Ukończ wszystkie działy, aby zdobyć trofeum</p>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })()}

        {/* =========================================================================
            SCREEN 2: INTELIGENTNY AKORDEON LEKCJI (SMART EXPANSION & AUTO-FOCUS)
            Z kaskadowym odblokowywaniem i trybem powtórkowym.
           ========================================================================= */}
        {viewState === 'lessons' && currentTopic && (() => {
          const allTopicTasks = lessonsForCurrentTopic.flatMap(g => g.tasks);
          const completedInCurrentTopic = allTopicTasks.filter(t => isTaskCompletedInLesson(t, completedTasks, allTopicTasks)).length;
          const totalInCurrentTopic = allTopicTasks.length;

          return (
            <motion.div 
              key="lessons"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col w-full"
            >
              {/* Header działu */}
              <header className="px-4 py-2.5 sm:py-3 sticky top-0 bg-[#0B0E14]/95 backdrop-blur-md z-20 border-b border-white/5 shadow-sm shrink-0 flex flex-col gap-2">
                <div className="flex items-center justify-between gap-3 w-full">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button 
                      id="lessons-back-button"
                      onClick={handleBack}
                      className="w-9 h-9 rounded-xl bg-[#141A23] border border-white/5 flex items-center justify-center text-white hover:bg-white/10 transition-colors shadow-sm shrink-0 cursor-pointer active:scale-95"
                      aria-label="Wróć do listy działów"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <h2 className="font-display font-black text-white text-base sm:text-lg leading-tight truncate">
                      {cleanTopicTitle(currentTopic.name)}
                    </h2>
                  </div>

                  <div className="shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#141A23] border border-white/5 text-[11px] font-bold text-[#8B8D98] whitespace-nowrap">
                    {totalInCurrentTopic > 0 ? (
                      <>
                        <span className="text-emerald-400 font-black">{completedInCurrentTopic}/{totalInCurrentTopic}</span>
                        <span>zadań</span>
                      </>
                    ) : (
                      <span className="text-cyan-400 font-semibold">W opracowaniu</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center pl-0 sm:pl-11">
                  <button
                    id="lessons-subject-switcher-badge"
                    onClick={() => {
                      triggerHaptic('light');
                      openSubjectSheet(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#141A23] border border-white/10 hover:border-[#00C2FF]/40 text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider transition-colors cursor-pointer group"
                    title="Zmień przedmiot"
                  >
                    <span>Dział {(selectedTopicIndex ?? 0) + 1}</span>
                    <span>•</span>
                    <span className="text-[#00C2FF] font-black group-hover:underline">{currentSubject.name} • Egzamin E8</span>
                  </button>
                </div>
              </header>
              
              {/* Inteligentny Akordeon Lekcji z bezpiecznym paddingiem na dole */}
              <div className="flex-1 px-4 sm:px-5 pt-3 pb-36 sm:pb-40 space-y-3.5">
                {/* Pasek Postępu Działu - Minimalistyczny, 6-milimetrowy pasek w kolorze szmaragdowym/turkusowym */}
                {(() => {
                  const completedLessonsCount = lessonsForCurrentTopic.filter(g => isLessonCompleted(g, completedTasks)).length;
                  const totalLessonsCount = lessonsForCurrentTopic.length;
                  const progressPct = totalLessonsCount > 0 ? Math.round((completedLessonsCount / totalLessonsCount) * 100) : 0;

                  return (
                    <div className="bg-[#101724] border border-white/10 rounded-2xl p-4 shadow-sm flex flex-col gap-2.5 mb-1">
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="text-slate-300 font-semibold flex items-center gap-2">
                          <GraduationCap className="w-4 h-4 text-cyan-400" />
                          <span>Postęp Działu {(selectedTopicIndex ?? 0) + 1}:</span>
                        </span>
                        <span className="font-bold text-white">
                          <span className="text-emerald-400 font-extrabold">{completedLessonsCount}/{totalLessonsCount}</span> lekcji ukończonych ({progressPct}%)
                        </span>
                      </div>
                      {/* Minimalistyczny 6-milimetrowy (h-2) pasek postępu */}
                      <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden border border-white/5">
                        <div 
                          className="h-full bg-gradient-to-r from-teal-500 via-emerald-400 to-cyan-400 transition-all duration-500 rounded-full shadow-[0_0_12px_rgba(52,211,153,0.5)]"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  );
                })()}

                {lessonsForCurrentTopic.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center p-6 sm:p-8 bg-[#141A23]/70 border border-white/10 rounded-3xl mt-4 sm:mt-6 max-w-md mx-auto shadow-xl">
                    <div className="w-16 h-16 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4 shadow-[0_0_20px_rgba(0,194,255,0.2)]">
                      <Sparkles size={28} />
                    </div>
                    <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 border border-cyan-500/25 px-3 py-1 rounded-full mb-3">
                      W opracowaniu • Dostępne wkrótce
                    </span>
                    <h3 className="text-lg sm:text-xl font-display font-black text-white mb-2">
                      {cleanTopicTitle(currentTopic.name)}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#8B8D98] leading-relaxed mb-4 max-w-xs">
                      {currentTopic.description || 'Struktura lekcji oraz baza zadań dla tego działu są przygotowywane zgodnie z wymaganiami egzaminacyjnymi CKE.'}
                    </p>
                    <div className="w-full bg-[#0B0E14] border border-white/5 rounded-xl p-3 mb-5 text-left text-xs text-slate-300 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                        <span>Waga w arkuszu CKE:</span>
                        <span className="text-cyan-400 font-bold">{currentTopic.matura_points_range || '3–6 pkt'}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                        <span>Status:</span>
                        <span className="text-sky-400 font-bold">Pewniaki w przygotowaniu</span>
                      </div>
                    </div>
                    <div className="w-full flex flex-col gap-2.5">
                      <button
                        onClick={() => {
                          triggerHaptic('light');
                          setSelectedTopicIndex(0);
                          setViewState('lessons');
                        }}
                        className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-[#00C2FF] to-[#0099CC] hover:from-[#38BDF8] hover:to-[#00B4E6] text-[#080C12] font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,194,255,0.35)] active:scale-98 transition-all cursor-pointer"
                      >
                        <span>Przejdź do Działu 1 (Liczby Rzeczywiste)</span>
                        <ArrowRight size={16} strokeWidth={3} />
                      </button>
                      <button
                        onClick={handleBack}
                        className="w-full py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold text-xs flex items-center justify-center gap-2 border border-white/10 active:scale-98 transition-all cursor-pointer"
                      >
                        <span>Wróć do listy działów</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {lessonsForCurrentTopic.map((group, groupIdx) => {
                      // CASCADING PROGRESSION ENGINE:
                      const isUnlocked = isLessonUnlocked(groupIdx, lessonsForCurrentTopic, completedTasks);
                      const isCompleted = isLessonCompleted(group, completedTasks);
                      const prevGroup = groupIdx > 0 ? lessonsForCurrentTopic[groupIdx - 1] : null;

                      const isCurrentActiveLesson = isUnlocked && !isCompleted && (
                        lessonsForCurrentTopic.findIndex((g, i) => isLessonUnlocked(i, lessonsForCurrentTopic, completedTasks) && !isLessonCompleted(g, completedTasks)) === groupIdx
                      );

                      // Next lesson in line
                      const nextGroup = groupIdx < lessonsForCurrentTopic.length - 1 ? lessonsForCurrentTopic[groupIdx + 1] : null;
                      const nextPoolResult = nextGroup ? drawSessionTasks(nextGroup.id) : null;
                      const nextTasksToRun = nextGroup ? (
                        (nextPoolResult?.sessionTasks && nextPoolResult.sessionTasks.length > 0)
                          ? nextPoolResult.sessionTasks
                          : nextGroup.tasks
                      ) : [];

                      const afterNextGroup = (nextGroup && groupIdx + 1 < lessonsForCurrentTopic.length - 1) 
                        ? lessonsForCurrentTopic[groupIdx + 2] 
                        : null;

                      const nextLessonPayload = nextGroup ? {
                        isSession: true,
                        lessonId: nextGroup.id,
                        lessonTitle: `${nextGroup.badge}: ${nextGroup.name}`,
                        tasks: nextTasksToRun,
                        firstTask: nextTasksToRun[0],
                        allTasks: nextGroup.tasks,
                        formulaSheet: nextPoolResult?.formulaSheet || null,
                        allTaskIdsToMarkCompleted: nextGroup.tasks.map((t: any) => t.id),
                        nextLesson: afterNextGroup ? {
                          isSession: true,
                          lessonId: afterNextGroup.id,
                          lessonTitle: `${afterNextGroup.badge}: ${afterNextGroup.name}`
                        } : null
                      } : null;

                      return (
                        <div 
                          key={group.id}
                          id={`lesson-card-${group.id}`}
                          className={`rounded-2xl border transition-all duration-200 p-4 sm:p-5 flex flex-col gap-3.5 ${
                            isCompleted
                              ? 'border-emerald-500/35 bg-[#0B1516]'
                              : isCurrentActiveLesson
                                ? 'border border-sky-500/70 bg-[#111A28]'
                                : !isUnlocked
                                  ? 'border-white/5 bg-[#0B0F15]/60 opacity-60'
                                  : 'border-white/10 bg-[#121822]'
                          }`}
                        >
                          {/* Górna część karty */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 min-w-0 flex-1">
                              {/* Ikona statusu (3 Stany) */}
                              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border mt-0.5 transition-all ${
                                isCompleted
                                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                                  : isCurrentActiveLesson
                                    ? 'bg-sky-500/20 border border-sky-500/50 text-sky-300'
                                    : !isUnlocked
                                      ? 'bg-white/5 border-white/10 text-slate-500'
                                      : 'bg-white/5 border-white/10 text-slate-300'
                              }`}>
                                {isCompleted ? (
                                  <CheckCircle2 size={22} className="stroke-[2.5]" />
                                ) : !isUnlocked ? (
                                  <Lock size={18} />
                                ) : (
                                  <span className="font-display font-bold text-xs sm:text-sm">{group.id.replace('lesson-', '')}</span>
                                )}
                              </div>

                              {/* Tytuł i metadane */}
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider bg-[#080B10] px-2 py-0.5 rounded-full border border-white/5">
                                    {group.badge}
                                  </span>
                                  {isCompleted && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                                      ✓ ZALICZONA
                                    </span>
                                  )}
                                  {isCurrentActiveLesson && (
                                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase text-sky-300 bg-sky-500/15 border border-sky-500/30 px-2.5 py-0.5 rounded-full">
                                      <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                                      AKTUALNA LEKCJA
                                    </span>
                                  )}
                                  {!isUnlocked && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-slate-500 bg-white/5 border border-white/5 px-2 py-0.5 rounded-full">
                                      ZABLOKOWANA
                                    </span>
                                  )}
                                </div>

                                <h3 className={`font-display font-bold text-base sm:text-lg leading-snug break-words ${
                                  isUnlocked ? 'text-white' : 'text-slate-400'
                                }`}>
                                  {group.name}
                                </h3>

                                {/* Szacowany czas i zadania w sesji */}
                                <div className="flex items-center gap-2.5 mt-1.5 text-xs text-slate-400 flex-wrap">
                                  {isCompleted ? (
                                    <>
                                      <span className="text-emerald-300 font-semibold">★★★ 3/3 gwiazdki</span>
                                      <span>•</span>
                                      <span>Cel: 4/4 zadań opanowane</span>
                                      <span>•</span>
                                      <span className="flex items-center gap-1">
                                        <Clock size={12} />
                                        <span>~4 min</span>
                                      </span>
                                    </>
                                  ) : isCurrentActiveLesson ? (
                                    <>
                                      <span className="flex items-center gap-1 text-sky-300 font-medium">
                                        <Clock size={13} />
                                        <span>~4 minuty</span>
                                      </span>
                                      <span>•</span>
                                      <span className="text-white font-medium">Wymóg: 4 poprawne zadania</span>
                                      <span>•</span>
                                      <span className="text-slate-400">Pewniaki CKE</span>
                                    </>
                                  ) : !isUnlocked ? (
                                    <span className="text-slate-500 flex items-center gap-1">
                                      <Lock size={12} />
                                      <span>Odblokuje się po zaliczeniu Lekcji {prevGroup?.badge || 'poprzedniej'}</span>
                                    </span>
                                  ) : (
                                    <>
                                      <span className="flex items-center gap-1">
                                        <Clock size={12} />
                                        <span>~4 minuty</span>
                                      </span>
                                      <span>•</span>
                                      <span>Wymóg: 4 poprawne zadania</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Dolna część karty: 3 Stany przycisków */}
                          <div className="pt-1">
                            {!isUnlocked ? (
                              <div className="w-full py-2.5 px-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-center gap-2 text-xs text-slate-500 cursor-not-allowed select-none">
                                <Lock size={13} />
                                <span>Odblokuje się po zaliczeniu Lekcji {prevGroup?.badge || 'poprzedniej'}</span>
                              </div>
                            ) : isCompleted ? (
                              <button
                                id={`repeat-lesson-btn-${group.id}`}
                                onClick={() => handleStartLessonSession(group, nextLessonPayload)}
                                className="w-full py-2.5 px-4 rounded-xl bg-transparent hover:bg-emerald-500/10 border border-emerald-500/35 hover:border-emerald-500/60 text-emerald-300 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition active:scale-[0.99] cursor-pointer"
                              >
                                <RefreshCw size={14} className="stroke-[2.5]" />
                                <span>POWTÓRZ LEKCJĘ</span>
                              </button>
                            ) : (
                              <button
                                id={`start-lesson-btn-${group.id}`}
                                onClick={() => handleStartLessonSession(group, nextLessonPayload)}
                                className="w-full py-3.5 px-6 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm sm:text-base flex items-center justify-center gap-2 active:scale-[0.98] transition cursor-pointer"
                              >
                                <Play size={16} fill="#020617" strokeWidth={0} />
                                <span>ROZPOCZNIJ LEKCJĘ</span>
                                <ArrowRight size={16} strokeWidth={3} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* ================= AUTOMATYCZNY SPRAWDZIAN DZIAŁU (BOSS EXAM) ================= */}
                    {(() => {
                      const topicNum = currentTopic.numericId || 1;
                      const isBossExamPassed = completedTasks.includes(`BOSS-EXAM-DZIAL-${topicNum}`) 
                        || completedTasks.includes(`SPRAWDZIAN-DZIAL-${topicNum}`)
                        || (topicNum === 1 && (completedTasks.includes('BOSS-EXAM-DZIAL-1') || completedTasks.includes('SPRAWDZIAN-DZIAL-1')));
                      const completedCount = lessonsForCurrentTopic.filter(g => isLessonCompleted(g, completedTasks)).length;
                      const allDone = completedCount === lessonsForCurrentTopic.length;
                      const qCount = lessonsForCurrentTopic.length || 3;
                      const timeLimit = Math.max(10, qCount * 3);

                      return (
                        <div 
                          id={`boss-exam-dzial-${topicNum}-card`}
                          className={`rounded-2xl border p-5 sm:p-6 flex flex-col gap-4 transition-all duration-200 mt-6 relative overflow-hidden ${
                            isBossExamPassed
                              ? 'bg-[#0E1715] border-emerald-500/40'
                              : allDone
                                ? 'bg-[#121626] border-indigo-500/50'
                                : 'bg-[#101724] border-slate-800'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3.5">
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
                                isBossExamPassed
                                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                                  : allDone
                                    ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                                    : 'bg-slate-800 border-slate-700 text-slate-400'
                              }`}>
                                <Trophy size={24} className="stroke-[2.2]" />
                              </div>

                              <div>
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300">
                                    Zwieńczenie Działu {topicNum}
                                  </span>
                                  {isBossExamPassed && (
                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300">
                                      ✓ ZALICZONY SPRAWDZIAN
                                    </span>
                                  )}
                                </div>
                                <h3 className="font-display font-bold text-white text-lg sm:text-xl uppercase">
                                  SPRAWDZIAN DZIAŁU {topicNum}: {currentTopic.short_title || currentTopic.title}
                                </h3>
                                <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed">
                                  {qCount} kluczowych zadań egzaminacyjnych CKE • Limit: {timeLimit} minut • Próg zaliczenia: 60%
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Metadane sprawdzianu */}
                          <div className="grid grid-cols-3 gap-2 py-1 text-center">
                            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-2.5">
                              <span className="text-[10px] text-slate-400 font-semibold block uppercase">Liczba Zadań</span>
                              <span className="text-sm font-bold text-white">{qCount} pytania</span>
                            </div>
                            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-2.5">
                              <span className="text-[10px] text-slate-400 font-semibold block uppercase">Limit Czasu</span>
                              <span className="text-sm font-bold text-sky-400">{timeLimit} minut</span>
                            </div>
                            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-2.5">
                              <span className="text-[10px] text-slate-400 font-semibold block uppercase">Nagroda</span>
                              <span className="text-sm font-bold text-amber-400">+{150 + topicNum * 10} XP + Odznaka</span>
                            </div>
                          </div>

                          {/* Przycisk akcji sprawdzianu */}
                          <button
                            id="start-boss-exam-btn"
                            onClick={() => {
                              triggerHaptic('medium');
                              setIsBossExamOpen(true);
                            }}
                            className={`w-full py-3.5 sm:py-4 px-6 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 transition active:scale-[0.99] cursor-pointer ${
                              isBossExamPassed
                                ? 'bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/40'
                                : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                            }`}
                          >
                            <Trophy size={18} />
                            <span>{isBossExamPassed ? 'POWTÓRZ SPRAWDZIAN DZIAŁU' : 'ROZPOCZNIJ SPRAWDZIAN DZIAŁU'}</span>
                            <ArrowRight size={18} strokeWidth={2.5} />
                          </button>
                        </div>
                      );
                    })()}
                  </>
                )}
              </div>
            </motion.div>
          );
        })()}

      </AnimatePresence>

      {/* =========================================================================
          PRZEŁĄCZNIK PRZEDMIOTÓW: WYSWUWANY OD DOŁU ARKUSZ (BOTTOM SHEET)
          Uruchamiany po kliknięciu < w widoku działów lub kliknięciu w tytuł "Matematyka".
         ========================================================================= */}
      {isMounted && typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isSubjectSheetOpen && (
            <div 
              key="subject-sheet-portal-wrapper"
              id="subject-sheet-wrapper"
              className="fixed inset-0 z-[120] flex items-end md:items-center justify-center pointer-events-auto p-0 md:p-4"
            >
              {/* Full Screen Backdrop Overlay - completely dims the entire screen including top header */}
              <motion.div
                key="subject-sheet-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => openSubjectSheet(false)}
                className="fixed inset-0 bg-black/80 backdrop-blur-md cursor-pointer z-[120]"
              />

              {/* Bottom Sheet / Desktop Centered Modal */}
              <motion.div
                key="subject-sheet-modal-content"
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 26, stiffness: 280 }}
                className="relative z-[125] w-full max-w-lg bg-[#0E131C] border-t md:border border-white/10 rounded-t-3xl md:rounded-3xl p-5 shadow-[0_-10px_40px_rgba(0,0,0,0.9)] flex flex-col gap-4 max-h-[85vh] overflow-y-auto"
                style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom, 24px))' }}
              >
                {/* Grab handle */}
                <div 
                  className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-1 cursor-pointer" 
                  onClick={() => openSubjectSheet(false)} 
                />

                {/* Sheet Header */}
                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                  <div>
                    <h3 className="font-display font-black text-white text-lg sm:text-xl tracking-tight">
                      Wybierz przedmiot egzaminacyjny
                    </h3>
                    <p className="text-xs text-[#8B8D98] mt-0.5">
                      Egzamin Ósmoklasisty • CKE
                    </p>
                  </div>
                  <button
                    id="subject-sheet-close-btn"
                    onClick={() => openSubjectSheet(false)}
                    className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-[#9CA3AF] hover:text-white transition-colors cursor-pointer"
                    aria-label="Zamknij"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Lista dostępnych przedmiotów */}
                <div className="space-y-3 pt-1 pb-10">
                  
                  {/* 1. Matematyka */}
                  <div
                    id="subject-card-math"
                    onClick={() => {
                      triggerHaptic('light');
                      setSelectedSubjectKey('math');
                      setSelectedTopicIndex(0);
                      setViewState('topics');
                      openSubjectSheet(false);
                    }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                      selectedSubjectKey === 'math'
                        ? 'border-[#00C2FF] bg-[#121B2A] shadow-[0_0_20px_rgba(0,194,255,0.2)]'
                        : 'border-white/10 bg-[#141A23] hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/40 text-blue-400 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(59,130,246,0.25)]">
                        <Calculator size={24} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-display font-black text-white text-base">
                            Matematyka
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-wide text-[#00C2FF] bg-[#00C2FF]/10 border border-[#00C2FF]/30 px-2.5 py-0.5 rounded-full">
                            W trakcie nauki
                          </span>
                        </div>
                        <p className="text-xs text-[#8B8D98]">
                          14 działów • Egzamin Ósmoklasisty • Wszystkie typy zadań
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-[#0B0E14] rounded-full overflow-hidden border border-white/5">
                            <div 
                              className="h-full bg-[#00C2FF] rounded-full transition-all duration-300"
                              style={{ width: `${mathProgressPercent}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-bold text-[#00C2FF] shrink-0">
                            {mathProgressPercent}% ukończono
                          </span>
                        </div>
                      </div>
                    </div>
                    {selectedSubjectKey === 'math' && (
                      <div className="w-6 h-6 rounded-full bg-[#00C2FF] text-[#080C12] flex items-center justify-center shrink-0">
                        <Check size={14} strokeWidth={3} />
                      </div>
                    )}
                  </div>

                  {/* 2. Język Polski */}
                  <div
                    id="subject-card-pol"
                    onClick={() => {
                      triggerHaptic('light');
                      setSelectedSubjectKey('pol');
                      setSelectedTopicIndex(0);
                      setViewState('topics');
                      openSubjectSheet(false);
                    }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                      selectedSubjectKey === 'pol'
                        ? 'border-rose-500 bg-[#221318] shadow-[0_0_20px_rgba(244,63,94,0.2)]'
                        : 'border-white/10 bg-[#141A23] hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 text-rose-400 flex items-center justify-center shrink-0">
                        <BookOpen size={24} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-display font-black text-white text-base">
                            Język Polski
                          </span>
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-300 bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-full">
                            Dostępny
                          </span>
                        </div>
                        <p className="text-xs text-[#8B8D98]">
                          Lektury E8 • Gramatyka i ortografia • Formy wypowiedzi CKE
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-[#0B0E14] rounded-full overflow-hidden border border-white/5">
                            <div 
                              className="h-full bg-rose-400 rounded-full transition-all duration-300"
                              style={{ width: `${polProgressPercent}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-bold text-rose-400 shrink-0">
                            Oczekuje na materiały
                          </span>
                        </div>
                      </div>
                    </div>
                    {selectedSubjectKey === 'pol' && (
                      <div className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0">
                        <Check size={14} strokeWidth={3} />
                      </div>
                    )}
                  </div>

                  {/* 3. Język Angielski */}
                  <div
                    id="subject-card-eng"
                    onClick={() => {
                      triggerHaptic('medium');
                      setLockedToastMessage('Kurs Języka Angielskiego E8 pojawi się po dodaniu materiałów!');
                      setShowLockedToast(true);
                      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
                      toastTimeoutRef.current = setTimeout(() => setShowLockedToast(false), 2500);
                    }}
                    className="p-4 rounded-2xl border border-white/5 bg-[#10141C]/70 opacity-80 hover:opacity-100 transition-all cursor-pointer flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 text-[#6B7280] flex items-center justify-center shrink-0">
                        <Globe size={24} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-display font-black text-white/80 text-base">
                            Język Angielski
                          </span>
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-full">
                            Wkrótce
                          </span>
                        </div>
                        <p className="text-xs text-[#6B7280]">
                          Środki językowe • Reagowanie językowe • Gramatyka E8
                        </p>
                      </div>
                    </div>
                    <Lock size={16} className="text-[#6B7280] shrink-0" />
                  </div>

                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* =========================================================================
          BOSS EXAM RUNNER: SPRAWDZIAN DZIAŁU
         ========================================================================= */}
      {isBossExamOpen && isMounted && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[150] bg-[#080C14] text-white">
          <BossExamRunner
            topicNumericId={currentTopic.numericId}
            onCancel={() => setIsBossExamOpen(false)}
            onCompleteExam={(score, passed, xp, coins, badgeId) => {
              setIsBossExamOpen(false);
              if (onCompleteTask) {
                onCompleteTask(
                  [`BOSS-EXAM-DZIAL-${currentTopic.numericId}`, `SPRAWDZIAN-DZIAL-${currentTopic.numericId}`],
                  passed ? 3 : 1,
                  xp,
                  coins
                );
              }
            }}
          />
        </div>,
        document.body
      )}

    </div>
  );
}
