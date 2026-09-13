import fs from 'fs';

const code = `import { useState, useEffect } from 'react';
import { 
  BookOpen, Calculator, Globe, FlaskConical, ChevronRight, ChevronLeft, 
  Lock, BookText, Zap, PenTool, Award, Dna, Variable, ArrowRight, CheckCircle2,
  Sparkles, Layers, Play
} from 'lucide-react';
import { triggerHaptic } from '../utils';
import { motion, AnimatePresence } from 'motion/react';
import { MathText } from './MathText';
import { mathTopics } from '../data/mathTasks';

interface LearnViewProps {
  onStartTask?: (task: any) => void;
  isGuest?: boolean;
  onLoginRequest?: () => void;
  onProRequest?: () => void;
}

export interface LessonGroup {
  id: string;
  name: string;
  badge: string;
  tasks: any[];
}

export function getLessonsForTopic(topic: any): LessonGroup[] {
  if (!topic || !topic.tasks || topic.tasks.length === 0) return [];
  
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
      const match = task.title.match(/^(Lekcja \\d+):\\s*(.*)$/i);
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

function cleanTitle(text: string): string {
  if (!text) return '';
  return text.replace(/\\s*\\(Poziom\\s+Podstawowy\\)/gi, '').trim();
}

const data: Record<string, any> = {
  math: {
    name: 'Matematyka',
    icon: Calculator,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    progress: '15%',
    topics: mathTopics
  },
  pol: {
    name: 'Język Polski',
    icon: BookOpen,
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/20',
    progress: '12%',
    topics: [
      {
        id: 'pol-1',
        name: 'Epoka Lalki - Pozytywizm',
        progress: '30%',
        locked: false,
        tasks: [
          { id: 'task-p1', type: 'theory', topic: 'Język Polski • Pozytywizm', title: 'Wprowadzenie do epoki', question: 'Czym był pozytywizm? Krótkie wprowadzenie do epoki.', officialKey: 'Pozytywizm w Polsce rozwinął się po upadku powstania styczniowego (1864). Odrzucił on zbrojną walkę o niepodległość na rzecz edukacji i pracy.', method: 'Microlearning', xp: 20, time: '3 min' },
          { id: 'task-p2', type: 'practice', topic: 'Język Polski • Pozytywizm', title: 'Trzy hasła pozytywizmu', question: 'Wymień 3 główne hasła pozytywizmu polskiego i krótko je zdefiniuj.', officialKey: '1. Praca u podstaw - edukacja najniższych warstw społecznych. 2. Praca organiczna - działanie na rzecz rozwoju gospodarczego całego społeczeństwa jako jednego organizmu. 3. Emancypacja kobiet - dążenie do równouprawnienia kobiet w dostępie do edukacji i pracy.', difficulty: 'Podstawowy', method: 'Interleaving', xp: 60, time: '5 min' }
        ]
      }
    ]
  },
  eng: {
    name: 'Język Angielski',
    icon: Globe,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    progress: '50%',
    topics: [
      {
        id: 'eng-1',
        name: 'Środki Językowe • Transformacje i Luki',
        progress: '40%',
        locked: false,
        tasks: [
          { 
            id: 'task-e-11', 
            type: 'practice', 
            topic: 'J. Angielski • Transformacje Zdań', 
            title: 'Transformacje z wyrazem kluczem', 
            question: 'Wykorzystując podane słowa wielkimi literami, uzupełnij zdania z luką (max 4 wyrazy). Wymagana pełna poprawność gramatyczna i ortograficzna.\\n\\n11.1. I’m free today, so if you want to meet for lunch, please tell me.\\nLET -> I’m free today so [...] if you want to meet for lunch.', 
            officialKey: '11.1. let me know / please let me know', 
            maxPoints: 3,
            difficulty: 'Podstawowy', 
            method: 'Active Recall', 
            xp: 60, 
            time: '5 min' 
          },
        ]
      }
    ]
  },
  chem: {
    name: 'Chemia',
    icon: FlaskConical,
    color: 'text-fuchsia-400',
    bg: 'bg-fuchsia-500/10',
    border: 'border-fuchsia-500/20',
    progress: '0%',
    topics: [],
    isPro: true
  }
};

type ViewState = 'subjects' | 'topics' | 'lessons' | 'tasks';

export function LearnView({ onStartTask, isGuest, onLoginRequest, onProRequest }: LearnViewProps) {
  const [viewState, setViewState] = useState<ViewState>(() => {
    try {
      const stored = localStorage.getItem('matura_quest_last_viewed');
      if (stored) return JSON.parse(stored).viewState || 'subjects';
    } catch(e) {}
    return 'subjects';
  });

  const [selectedSubjectKey, setSelectedSubjectKey] = useState<string | null>(() => {
    try {
      const stored = localStorage.getItem('matura_quest_last_viewed');
      if (stored) return JSON.parse(stored).subjectKey || null;
    } catch(e) {}
    return null;
  });

  const [selectedTopicIndex, setSelectedTopicIndex] = useState<number | null>(() => {
    try {
      const stored = localStorage.getItem('matura_quest_last_viewed');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.topicIndex !== undefined && parsed.topicIndex !== null) return parsed.topicIndex;
      }
    } catch(e) {}
    return null;
  });

  const [selectedLessonIndex, setSelectedLessonIndex] = useState<number | null>(() => {
    try {
      const stored = localStorage.getItem('matura_quest_last_viewed');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.lessonIndex !== undefined && parsed.lessonIndex !== null) return parsed.lessonIndex;
      }
    } catch(e) {}
    return null;
  });

  const [completedTasks, setCompletedTasks] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('matura_quest_completed_tasks');
      if (stored) return JSON.parse(stored);
    } catch(e) {}
    return [];
  });

  useEffect(() => {
    localStorage.setItem('matura_quest_last_viewed', JSON.stringify({
      viewState,
      subjectKey: selectedSubjectKey,
      topicIndex: selectedTopicIndex,
      lessonIndex: selectedLessonIndex
    }));
  }, [viewState, selectedSubjectKey, selectedTopicIndex, selectedLessonIndex]);

  const displayData = isGuest ? {
    ...data,
    math: {
      ...data.math,
      topics: data.math.topics.map((t, i) => ({ ...t, locked: i > 0, isPro: i > 0 }))
    }
  } : data;

  const handleSelectSubject = (key: string) => {
    triggerHaptic('light');
    setSelectedSubjectKey(key);
    setViewState('topics');
    setSelectedTopicIndex(null);
    setSelectedLessonIndex(null);
  };

  const handleSelectTopic = (index: number, locked: boolean) => {
    triggerHaptic('light');
    if (locked) return;
    setSelectedTopicIndex(index);
    setViewState('lessons');
    setSelectedLessonIndex(null);
  };

  const handleSelectLesson = (index: number, locked: boolean) => {
    triggerHaptic('light');
    if (locked) return;
    setSelectedLessonIndex(index);
    setViewState('tasks');
  };

  const handleBack = () => {
    triggerHaptic('light');
    if (viewState === 'tasks') {
      setViewState('lessons');
      setSelectedLessonIndex(null);
    } else if (viewState === 'lessons') {
      setViewState('topics');
      setSelectedTopicIndex(null);
    } else if (viewState === 'topics') {
      setViewState('subjects');
      setSelectedSubjectKey(null);
    }
  };

  const currentSubject = selectedSubjectKey ? displayData[selectedSubjectKey] : null;
  const currentTopic = (currentSubject && selectedTopicIndex !== null && currentSubject.topics[selectedTopicIndex]) ? currentSubject.topics[selectedTopicIndex] : null;
  const lessonsForCurrentTopic = currentTopic ? getLessonsForTopic(currentTopic) : [];
  const currentLesson = (lessonsForCurrentTopic && selectedLessonIndex !== null && lessonsForCurrentTopic[selectedLessonIndex]) ? lessonsForCurrentTopic[selectedLessonIndex] : null;

  return (
    <div className="flex flex-col p-5 pb-32 min-h-full max-w-2xl mx-auto w-full">
      {/* HEADER NAV */}
      {viewState !== 'subjects' && (
        <div className="mb-6 mt-2">
          <button 
            onClick={handleBack}
            className="flex items-center gap-2 text-white/50 hover:text-white font-medium text-sm transition-colors group w-fit"
          >
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
              <ChevronLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
            </div>
            <span>
              {viewState === 'topics' && 'Wróć do przedmiotów'}
              {viewState === 'lessons' && 'Wróć do działów'}
              {viewState === 'tasks' && 'Wróć do tematów'}
            </span>
          </button>
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* LEVEL 1: SUBJECTS */}
        {viewState === 'subjects' && (
          <motion.div key="subjects" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <h1 className="text-3xl font-display font-bold text-white mb-2 mt-4">Wybierz Przedmiot</h1>
            <p className="text-white/50 text-sm mb-8">Rozpocznij naukę i przygotowania do matury.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(displayData).map(([key, sub]) => {
                const Icon = sub.icon;
                return (
                  <button 
                    key={key} 
                    onClick={() => {
                      if (sub.isPro) {
                        isGuest && onLoginRequest ? onLoginRequest() : onProRequest && onProRequest();
                      } else {
                        handleSelectSubject(key);
                      }
                    }}
                    className="relative bg-[#13141A] border border-white/5 hover:border-white/15 rounded-[24px] p-5 flex flex-col justify-between transition-all text-left group min-h-[160px]"
                  >
                    {sub.isPro && (
                      <div className="absolute top-4 right-4 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        PRO
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between w-full">
                      <div className={\`w-12 h-12 rounded-[16px] flex items-center justify-center \${sub.bg} \${sub.color} border border-white/5 group-hover:scale-110 transition-transform duration-300\`}>
                        <Icon size={24} strokeWidth={1.5} />
                      </div>
                    </div>
                    
                    <div className="mt-6">
                      <h3 className="font-display font-semibold text-lg text-white mb-1">
                        {cleanTitle(sub.name)}
                      </h3>
                      {!sub.isPro ? (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                            <div className={\`h-full rounded-full \${sub.bg.replace('/10', '')}\`} style={{ width: sub.progress }}></div>
                          </div>
                          <span className="text-[10px] font-bold text-white/50">{sub.progress}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs text-amber-400/80 mt-2">
                          <Lock size={12} /> Odblokuj dostęp
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* LEVEL 2: TOPICS (TREE VIEW) */}
        {viewState === 'topics' && currentSubject && (
          <motion.div key="topics" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="flex items-center gap-4 mb-8 bg-[#13141A] border border-white/5 p-5 rounded-[24px]">
              <div className={\`w-14 h-14 rounded-2xl flex items-center justify-center \${currentSubject.bg} \${currentSubject.color}\`}>
                {(() => { const Icon = currentSubject.icon; return <Icon size={28} strokeWidth={1.5} />; })()}
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold text-white">{cleanTitle(currentSubject.name)}</h1>
                <p className="text-white/50 text-sm mt-0.5">{currentSubject.topics.length} działów tematycznych</p>
              </div>
            </div>

            <div className="relative flex flex-col items-center py-6 w-full">
              {currentSubject.topics.length > 0 && (
                <div className="absolute top-6 bottom-6 w-[2px] bg-white/5 left-1/2 -translate-x-1/2"></div>
              )}

              {currentSubject.topics.map((topic: any, idx: number) => {
                const isLocked = topic.locked;
                const isCompleted = topic.progress === '100%';
                const isLeft = idx % 2 === 0;
                
                const cleanTopicName = cleanTitle(topic.name);
                const match = cleanTopicName.match(/^(Dział \\d+):\\s*(.*)$/i);
                const badgeLabel = match ? match[1] : \`Dział \${idx + 1}\`;
                const topicTitle = match ? match[2] : cleanTopicName;

                return (
                  <div key={topic.id} className="relative z-10 w-full flex items-center justify-center my-6 h-24">
                    <div className="absolute flex items-center justify-center w-full">
                      {/* Text Label */}
                      <div className={\`absolute w-[140px] sm:w-[180px] flex flex-col \${isLeft ? 'right-[calc(50%+40px)] text-right items-end' : 'left-[calc(50%+40px)] text-left items-start'}\`}>
                        <span className={\`text-[10px] font-bold uppercase tracking-widest mb-1 \${isLocked ? 'text-white/20' : currentSubject.color}\`}>
                          {badgeLabel}
                        </span>
                        <h3 className={\`font-display font-semibold text-[15px] leading-tight \${isLocked ? 'text-white/30' : 'text-white/90'}\`}>
                          {topicTitle}
                        </h3>
                      </div>
                      
                      {/* Node Circle */}
                      <button 
                        onClick={() => handleSelectTopic(idx, isLocked)}
                        className={\`relative z-20 w-14 h-14 rounded-full flex items-center justify-center border-4 transition-all hover:scale-105 shrink-0 \${
                          isLocked 
                            ? 'bg-[#0E0F13] border-white/5 text-white/20 cursor-not-allowed' 
                            : isCompleted 
                              ? 'bg-[#0E0F13] border-emerald-500/50 text-emerald-400' 
                              : \`bg-[#0E0F13] \${currentSubject.border.replace('/20', '/50')} \${currentSubject.color} shadow-[0_0_20px_rgba(255,255,255,0.03)]\`
                        }\`}
                      >
                        {topic.isPro && (
                          <div className="absolute -top-1 -right-1 bg-amber-500 text-[#13141A] text-[9px] font-bold px-1.5 py-0.5 rounded-full z-20">PRO</div>
                        )}
                        {isLocked ? <Lock size={20} strokeWidth={2} /> : isCompleted ? <CheckCircle2 size={24} strokeWidth={2} /> : <BookOpen size={24} strokeWidth={1.5} />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* LEVEL 3: LESSONS (TEMATY - Modern List) */}
        {viewState === 'lessons' && currentSubject && currentTopic && (
          <motion.div key="lessons" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="mb-8">
              <span className={\`text-[11px] font-bold uppercase tracking-widest \${currentSubject.color}\`}>
                {cleanTitle(currentTopic.name).split(':')[0]}
              </span>
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-white mt-1">
                {cleanTitle(currentTopic.name).replace(/^Dział \\d+:\\s*/i, '')}
              </h1>
            </div>

            <div className="relative before:absolute before:inset-0 before:ml-[27px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-white/5">
              {lessonsForCurrentTopic.map((lesson, idx) => {
                const completedCount = lesson.tasks.filter(t => completedTasks.includes(t.id)).length;
                const totalCount = lesson.tasks.length;
                const isLessonCompleted = totalCount > 0 && completedCount === totalCount;
                const isSprawdzian = lesson.badge === 'Sprawdzian' || lesson.name.toLowerCase().includes('sprawdzian');
                
                return (
                  <div key={lesson.id} className="relative flex items-start mb-8 group">
                    <div className="absolute left-0 md:left-1/2 md:-ml-[28px] flex items-center justify-center">
                      <div className={\`w-14 h-14 rounded-full border-4 border-[#0E0F13] flex items-center justify-center z-10 \${
                        isSprawdzian ? 'bg-amber-500/20 text-amber-400' : isLessonCompleted ? 'bg-emerald-500/20 text-emerald-400' : 'bg-[#13141A] text-white/50 group-hover:text-white group-hover:bg-white/5'
                      } transition-colors\`}>
                        {isLessonCompleted ? <CheckCircle2 size={24} /> : isSprawdzian ? <Award size={24} /> : <span className="font-display font-bold">{idx + 1}</span>}
                      </div>
                    </div>
                    <div className="ml-20 md:ml-0 md:w-1/2 md:pr-16 md:even:ml-auto md:even:pl-16 md:even:pr-0 w-full pt-1">
                      <button 
                        onClick={() => handleSelectLesson(idx, false)}
                        className="w-full text-left bg-[#13141A] border border-white/5 hover:border-white/20 p-5 rounded-[24px] transition-all hover:bg-white/[0.02]"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className={\`text-[10px] font-bold uppercase tracking-wider \${isSprawdzian ? 'text-amber-400' : 'text-white/40'}\`}>
                            {lesson.badge}
                          </span>
                          <span className="text-[11px] font-medium text-white/40">{totalCount} zadań</span>
                        </div>
                        <h3 className="font-display font-semibold text-lg text-white mb-4 group-hover:text-blue-200 transition-colors">
                          {cleanTitle(lesson.name)}
                        </h3>
                        <div className="flex items-center justify-between pt-3 border-t border-white/5">
                           {completedCount > 0 ? (
                            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                              <CheckCircle2 size={14} /> {completedCount}/{totalCount} zrobione
                            </span>
                          ) : (
                            <span className="text-xs font-medium text-white/40">Zacznij naukę</span>
                          )}
                          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/50 group-hover:text-white group-hover:bg-white/10 transition-all">
                            <ChevronRight size={16} />
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* LEVEL 4: TASKS */}
        {viewState === 'tasks' && currentSubject && currentTopic && currentLesson && (
          <motion.div key="tasks" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="mb-8">
              <span className="text-[11px] font-bold uppercase tracking-widest text-white/40">
                {currentLesson.badge}
              </span>
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-white mt-1 mb-3">
                {cleanTitle(currentLesson.name)}
              </h1>
              <div className="flex items-center gap-3 text-sm text-white/50">
                <div className="flex items-center gap-1.5"><Layers size={16} /> {currentLesson.tasks.length} zadań</div>
              </div>
            </div>

            <div className="space-y-3">
              {currentLesson.tasks.map((task: any, idx: number, tasksArr: any[]) => {
                const isCompleted = completedTasks.includes(task.id);
                const isLocked = idx > 0 && !completedTasks.includes(tasksArr[idx - 1].id);
                
                const isTheory = task.id.includes('THEORY') || task.type === 'theory';
                let Icon = isTheory ? BookText : PenTool;
                let colorClass = isTheory ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
                
                if (task.type === 'quiz') { Icon = Zap; colorClass = 'text-purple-400 bg-purple-500/10 border-purple-500/20'; }
                if (task.type === 'exam') { Icon = Award; colorClass = 'text-amber-400 bg-amber-500/10 border-amber-500/20'; }

                return (
                  <button 
                    key={task.id}
                    onClick={() => {
                      if (isLocked) return;
                      triggerHaptic('medium');
                      onStartTask?.(task);
                    }}
                    disabled={isLocked}
                    className={\`w-full flex items-center p-4 rounded-[20px] bg-[#13141A] border transition-all text-left group \${
                      isLocked 
                        ? 'opacity-40 border-white/5 cursor-not-allowed' 
                        : isCompleted
                          ? 'border-emerald-500/30 hover:bg-white/[0.02]'
                          : 'border-white/5 hover:border-white/15 hover:bg-white/[0.02]'
                    }\`}
                  >
                    <div className={\`w-12 h-12 rounded-[16px] flex items-center justify-center shrink-0 mr-4 border \${
                      isLocked ? 'bg-white/5 border-white/5 text-white/30' : isCompleted ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : colorClass
                    }\`}>
                      {isLocked ? <Lock size={20} /> : isCompleted ? <CheckCircle2 size={20} /> : <Icon size={20} />}
                    </div>
                    
                    <div className="flex-1 min-w-0 pr-4">
                      <h3 className="font-display font-semibold text-[15px] text-white mb-1 truncate">
                        <MathText text={cleanTitle(task.title)} />
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-white/40">
                        <span className="uppercase tracking-wider font-bold">{task.method || (isTheory ? 'Teoria' : 'Praktyka')}</span>
                        <span>•</span>
                        <span>{task.time || '2 min'}</span>
                        <span>•</span>
                        <span>+{task.xp || 10} XP</span>
                      </div>
                    </div>

                    {!isLocked && (
                      <div className={\`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors \${
                        isCompleted ? 'text-emerald-400' : 'bg-white/5 text-white/50 group-hover:bg-white/10 group-hover:text-white'
                      }\`}>
                        {isCompleted ? <CheckCircle2 size={16} /> : <Play size={14} className="ml-0.5" />}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
`

fs.writeFileSync('src/components/LearnView.tsx', code);
console.log('Done!');
