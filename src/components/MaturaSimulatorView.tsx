import { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, 
  GraduationCap, 
  Target, 
  ArrowLeft, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Flag, 
  Pen, 
  Pause, 
  Play, 
  RotateCcw,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import Markdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { seedMaturaTasks } from '../scripts/seedMatura';
import { zadania_matura } from '../data/zadania_matura';
import { ScratchpadModal } from './ScratchpadModal';
import { MaturaExamReview, MaturaTaskReviewItem } from './MaturaExamReview';

export type MaturaTask = {
  id: string;
  section: string;
  content: string;
  options: string[];
  correctAnswer: string;
  points: number;
  isClosed: boolean;
  explanation: string;
};

interface MaturaSimulatorViewProps {
  onEarnReward?: (xp: number, coins: number) => void;
}

const EXAM_DURATION_SECONDS = 20 * 60; // 20 minutes

export function MaturaSimulatorView({ onEarnReward }: MaturaSimulatorViewProps) {
  const [tasks, setTasks] = useState<MaturaTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'menu' | 'select_section_single' | 'select_section_exam' | 'single' | 'exam' | 'mistakes'>('menu');
  const [sections, setSections] = useState<string[]>([]);
  const [selectedSection, setSelectedSection] = useState<string>('Wszystkie');
  
  // Scratchpad modal state
  const [isScratchpadOpen, setIsScratchpadOpen] = useState(false);

  // Mistakes bank (persisted in localStorage)
  const [mistakesBank, setMistakesBank] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('matura_mistakes_bank');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Single task state
  const [currentTask, setCurrentTask] = useState<MaturaTask | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [singleSelfGrade, setSingleSelfGrade] = useState<number | null>(null);

  // Exam mode state
  const [examTasks, setExamTasks] = useState<MaturaTask[]>([]);
  const [examCurrentIndex, setExamCurrentIndex] = useState(0);
  const [examAnswers, setExamAnswers] = useState<Record<string, string>>({});
  const [examOpenScores, setExamOpenScores] = useState<Record<string, number>>({});
  const [flaggedTasks, setFlaggedTasks] = useState<Set<string>>(new Set());
  const [examFinished, setExamFinished] = useState(false);
  const [examTimeLeft, setExamTimeLeft] = useState(EXAM_DURATION_SECONDS);
  const [isExamPaused, setIsExamPaused] = useState(false);
  const [examTimeSpent, setExamTimeSpent] = useState(0);
  const [earnedReward, setEarnedReward] = useState<{ xp: number; coins: number } | null>(null);

  // Timer reference
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Save mistakes bank to localStorage
  const saveMistakesBank = (newBank: string[]) => {
    setMistakesBank(newBank);
    try {
      localStorage.setItem('matura_mistakes_bank', JSON.stringify(newBank));
    } catch (e) {
      console.error("Failed to save mistakes bank:", e);
    }
  };

  const addToMistakesBank = (taskId: string) => {
    if (!mistakesBank.includes(taskId)) {
      const updated = [...mistakesBank, taskId];
      saveMistakesBank(updated);
    }
  };

  const removeFromMistakesBank = (taskId: string) => {
    if (mistakesBank.includes(taskId)) {
      const updated = mistakesBank.filter(id => id !== taskId);
      saveMistakesBank(updated);
    }
  };

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const querySnapshot = await getDocs(collection(db, 'matura_tasks'));
        
        let loadedTasks: MaturaTask[] = [];
        if (!querySnapshot.empty) {
          loadedTasks = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as MaturaTask));
        }

        if (loadedTasks.length === 0) {
          await seedMaturaTasks();
          loadedTasks = zadania_matura as unknown as MaturaTask[];
        }

        setTasks(loadedTasks);

        const secs = Array.from(new Set(loadedTasks.map(t => t.section)));
        setSections(['Wszystkie', ...secs]);
      } catch (err) {
        console.error("Error fetching tasks, falling back to local dataset:", err);
        setTasks(zadania_matura as unknown as MaturaTask[]);
        const secs = Array.from(new Set(zadania_matura.map(t => t.section)));
        setSections(['Wszystkie', ...secs]);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  // Timer logic for exam mode
  useEffect(() => {
    if (view === 'exam' && !examFinished && !isExamPaused) {
      timerRef.current = setInterval(() => {
        setExamTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleFinishExam();
            return 0;
          }
          return prev - 1;
        });
        setExamTimeSpent(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [view, examFinished, isExamPaused]);

  // SINGLE TASK FLOW
  const getRandomTask = (section: string) => {
    setSelectedSection(section);
    let pool = tasks;
    if (section !== 'Wszystkie') {
      pool = tasks.filter(t => t.section === section);
    }
    if (pool.length === 0) pool = tasks;

    const randomIndex = Math.floor(Math.random() * pool.length);
    setCurrentTask(pool[randomIndex]);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setSingleSelfGrade(null);
    setView('single');
  };

  const handleSingleAnswer = (optId: string) => {
    if (selectedAnswer !== null || showExplanation) return;
    setSelectedAnswer(optId);
    setShowExplanation(true);

    if (currentTask) {
      const isCorrect = currentTask.correctAnswer.includes(optId);
      if (isCorrect) {
        removeFromMistakesBank(currentTask.id);
        if (onEarnReward) onEarnReward(15, 5);
      } else {
        addToMistakesBank(currentTask.id);
      }
    }
  };

  const handleSingleSelfGrade = (points: number) => {
    setSingleSelfGrade(points);
    if (currentTask) {
      if (points === currentTask.points) {
        removeFromMistakesBank(currentTask.id);
        if (onEarnReward) onEarnReward(20, 10);
      } else {
        addToMistakesBank(currentTask.id);
      }
    }
  };

  // EXAM FLOW
  const startExam = (section: string) => {
    setSelectedSection(section);
    let pool = tasks;
    if (section !== 'Wszystkie') {
      pool = tasks.filter(t => t.section === section);
    }
    if (pool.length < 5) pool = tasks;

    // Pick 7 balanced tasks
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, Math.min(7, shuffled.length));

    setExamTasks(selected);
    setExamCurrentIndex(0);
    setExamAnswers({});
    setExamOpenScores({});
    setFlaggedTasks(new Set());
    setExamFinished(false);
    setExamTimeLeft(EXAM_DURATION_SECONDS);
    setIsExamPaused(false);
    setExamTimeSpent(0);
    setEarnedReward(null);
    setView('exam');
  };

  const startMistakesPractice = () => {
    const missed = tasks.filter(t => mistakesBank.includes(t.id));
    if (missed.length === 0) return;

    setExamTasks(missed);
    setExamCurrentIndex(0);
    setExamAnswers({});
    setExamOpenScores({});
    setFlaggedTasks(new Set());
    setExamFinished(false);
    setExamTimeLeft(missed.length * 3 * 60);
    setIsExamPaused(false);
    setExamTimeSpent(0);
    setEarnedReward(null);
    setView('exam');
  };

  const handleExamAnswer = (optId: string) => {
    if (!examTasks[examCurrentIndex]) return;
    const taskId = examTasks[examCurrentIndex].id;
    setExamAnswers(prev => ({
      ...prev,
      [taskId]: optId
    }));
  };

  const handleOpenScore = (score: number) => {
    if (!examTasks[examCurrentIndex]) return;
    const taskId = examTasks[examCurrentIndex].id;
    setExamOpenScores(prev => ({
      ...prev,
      [taskId]: score
    }));
  };

  const toggleFlagCurrentTask = () => {
    if (!examTasks[examCurrentIndex]) return;
    const taskId = examTasks[examCurrentIndex].id;
    setFlaggedTasks(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  const handleFinishExam = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setExamFinished(true);

    let earnedTotal = 0;
    let maxTotal = 0;

    examTasks.forEach(task => {
      maxTotal += task.points;
      if (task.isClosed) {
        const userAns = examAnswers[task.id];
        if (userAns === task.correctAnswer) {
          earnedTotal += task.points;
          removeFromMistakesBank(task.id);
        } else {
          addToMistakesBank(task.id);
        }
      } else {
        const openScore = examOpenScores[task.id] || 0;
        earnedTotal += openScore;
        if (openScore === task.points) {
          removeFromMistakesBank(task.id);
        } else {
          addToMistakesBank(task.id);
        }
      }
    });

    const pct = maxTotal > 0 ? (earnedTotal / maxTotal) : 0;
    const baseRewardXP = Math.round(50 + pct * 100);
    const baseRewardCoins = Math.round(15 + pct * 25);

    setEarnedReward({ xp: baseRewardXP, coins: baseRewardCoins });
    if (onEarnReward) {
      onEarnReward(baseRewardXP, baseRewardCoins);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const renderContent = (content: string) => (
    <div className="prose dark:prose-invert max-w-none math-render overflow-x-auto py-2 -my-2 text-slate-800 dark:text-slate-200">
      <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
        {content}
      </Markdown>
    </div>
  );

  // Build review items
  const reviewItems: MaturaTaskReviewItem[] = examTasks.map(t => {
    const ans = examAnswers[t.id];
    let earned = 0;
    if (t.isClosed) {
      earned = ans === t.correctAnswer ? t.points : 0;
    } else {
      earned = examOpenScores[t.id] || 0;
    }

    return {
      id: t.id,
      section: t.section,
      content: t.content,
      options: t.options,
      correctAnswer: t.correctAnswer,
      points: t.points,
      isClosed: t.isClosed,
      explanation: t.explanation,
      userAnswer: ans,
      userPointsEarned: earned,
      isFlagged: flaggedTasks.has(t.id),
    };
  });

  return (
    <div className="flex flex-col p-4 sm:p-6 min-h-full pb-24 max-w-3xl mx-auto w-full relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white mb-0.5">Symulator Egzaminu CKE</h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">Oficjalne arkusze CKE • Egzamin Ósmoklasisty i Matura</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Scratchpad Button */}
          {(view === 'single' || view === 'exam') && (
            <button
              type="button"
              onClick={() => setIsScratchpadOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold transition-all shadow-xs cursor-pointer"
              title="Otwórz brudnopis"
            >
              <Pen size={14} className="text-amber-500" />
              <span>Brudnopis</span>
            </button>
          )}

          <div className="w-10 h-10 bg-amber-500/10 rounded-xl border border-amber-500/20 flex items-center justify-center">
            <GraduationCap className="text-amber-700 dark:text-amber-400" size={20} />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-4" />
          <p className="text-slate-500 dark:text-slate-400 text-sm">Ładowanie oficjalnych arkuszy CKE...</p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {/* MENU VIEW */}
          {view === 'menu' && (
            <motion.div 
              key="menu"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex-1 flex flex-col gap-4 pt-2"
            >
              {/* Card 1: Pojedyncze zadania */}
              <button 
                type="button"
                onClick={() => setView('select_section_single')}
                className="w-full text-left bg-white dark:bg-[#131B29] hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 transition-all cursor-pointer group shadow-xs active:scale-[0.99]"
              >
                <div className="flex items-start justify-between">
                  <div className="w-11 h-11 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-3 flex items-center justify-center">
                    <Target className="text-amber-700 dark:text-amber-400" size={22} />
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-amber-800 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                    Trening
                  </span>
                </div>
                <h3 className="font-display font-bold text-slate-900 dark:text-white text-lg mb-1 tracking-tight group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  Pojedyncze zadania
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm leading-relaxed">
                  Rozwiązuj pojedyncze zadania z wybranego działu. Natychmiastowa weryfikacja i pełny oficjalny klucz rozwiązań.
                </p>
              </button>

              {/* Card 2: Mini Egzamin */}
              <button 
                type="button"
                onClick={() => setView('select_section_exam')}
                className="w-full text-left bg-white dark:bg-[#131B29] hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 transition-all cursor-pointer group shadow-xs active:scale-[0.99]"
              >
                <div className="flex items-start justify-between">
                  <div className="w-11 h-11 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-3 flex items-center justify-center">
                    <BookOpen className="text-amber-700 dark:text-amber-400" size={22} />
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-amber-800 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20 flex items-center gap-1.5">
                    <Clock size={12} /> 20 MIN
                  </span>
                </div>
                <h3 className="font-display font-bold text-slate-900 dark:text-white text-lg mb-1 tracking-tight group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  Mini Egzamin (Próbny arkusz)
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm leading-relaxed">
                  7-zadaniowy sprawdzian z zegarem, swobodną nawigacją po arkuszu, flagowaniem pytań i pełnym podsumowaniem punktów.
                </p>
              </button>

              {/* Card 3: Moje Błędy / Powtórki */}
              <button 
                type="button"
                onClick={startMistakesPractice}
                disabled={mistakesBank.length === 0}
                className={`w-full text-left bg-white dark:bg-[#131B29] border rounded-2xl p-5 sm:p-6 transition-all ${
                  mistakesBank.length > 0 
                    ? 'hover:bg-slate-50 dark:hover:bg-slate-800/60 border-slate-200 dark:border-slate-800 cursor-pointer group active:scale-[0.99]' 
                    : 'border-slate-200/60 dark:border-slate-800/60 opacity-50 cursor-not-allowed'
                } shadow-xs`}
              >
                <div className="flex items-start justify-between">
                  <div className={`w-11 h-11 rounded-xl mb-3 flex items-center justify-center border ${
                    mistakesBank.length > 0 
                      ? 'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400' 
                      : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                  }`}>
                    <RotateCcw size={22} />
                  </div>
                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full border ${
                    mistakesBank.length > 0 
                      ? 'bg-amber-500/10 text-amber-800 dark:text-amber-400 border-amber-500/20' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}>
                    {mistakesBank.length} DO POWTÓRKI
                  </span>
                </div>
                <h3 className="font-display font-bold text-slate-900 dark:text-white text-lg mb-1 tracking-tight">
                  Baza Błędów
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm leading-relaxed">
                  Wygeneruj mini arkusz składający się ze wszystkich zadań, w których popełniłeś błąd.
                </p>
              </button>
            </motion.div>
          )}

          {/* SECTION SELECTOR */}
          {(view === 'select_section_single' || view === 'select_section_exam') && (
            <motion.div 
              key="select_section"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              className="flex-1 flex flex-col"
            >
              <button 
                type="button"
                onClick={() => setView('menu')}
                className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-6 w-fit transition-colors cursor-pointer text-xs font-bold"
              >
                <ArrowLeft size={16} />
                <span>Wróć do menu</span>
              </button>
              
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                {view === 'select_section_single' ? 'Wybierz dział do ćwiczeń' : 'Wybierz dział dla Mini Egzaminu'}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mb-6">
                {view === 'select_section_single' 
                  ? 'Rozwiązujesz po kolei pojedyncze zadania z wybranego obszaru.' 
                  : 'Zestaw 7 pytań w formacie oficjalnego arkusza egzaminacyjnego.'}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {sections.map(sec => {
                  const count = sec === 'Wszystkie' 
                    ? tasks.length 
                    : tasks.filter(t => t.section === sec).length;

                  return (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => view === 'select_section_single' ? getRandomTask(sec) : startExam(sec)}
                      className="p-4 rounded-2xl bg-white dark:bg-[#131B29] border border-slate-200 dark:border-slate-800 text-left hover:border-amber-500/50 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all flex items-center justify-between group shadow-xs cursor-pointer"
                    >
                      <span className="text-slate-800 dark:text-slate-200 font-semibold text-sm group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                        {sec}
                      </span>
                      <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                        {count} zad.
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* SINGLE TASK VIEW */}
          {view === 'single' && currentTask && (
            <motion.div 
              key="single"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              className="flex-1 flex flex-col"
            >
              <div className="flex items-center justify-between mb-4">
                <button 
                  type="button"
                  onClick={() => setView('menu')}
                  className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer text-xs font-bold"
                >
                  <ArrowLeft size={16} />
                  <span>Wróć do menu</span>
                </button>

                {mistakesBank.includes(currentTask.id) && (
                  <span className="text-xs font-bold text-amber-800 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20 flex items-center gap-1">
                    <RotateCcw size={12} /> Zadanie z bazy błędów
                  </span>
                )}
              </div>

              <div className="bg-white dark:bg-[#131B29] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 mb-4 shadow-xs">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="bg-amber-500/10 text-amber-800 dark:text-amber-400 text-xs font-bold px-2.5 py-1 rounded-md border border-amber-500/20">
                      {currentTask.section}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 text-xs font-medium">
                      {currentTask.points} {currentTask.points === 1 ? 'punkt' : 'punkty'}
                    </span>
                  </div>
                  <span className="text-slate-400 text-xs font-mono">ID #{currentTask.id}</span>
                </div>
                
                <div className="text-slate-900 dark:text-white text-base leading-relaxed mb-6 font-medium">
                  {renderContent(currentTask.content)}
                </div>

                {/* Closed task options */}
                {currentTask.isClosed ? (
                  <div className="space-y-2.5">
                    {currentTask.options.map((opt, idx) => {
                      const optId = String.fromCharCode(65 + idx);
                      const isSelected = selectedAnswer === optId;
                      const isCorrect = currentTask.correctAnswer.includes(optId);
                      
                      let bgClass = "bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200";
                      if (showExplanation) {
                        if (isCorrect) bgClass = "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-bold";
                        else if (isSelected && !isCorrect) bgClass = "bg-rose-50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900 text-rose-800 dark:text-rose-300";
                        else bgClass = "bg-slate-50 dark:bg-slate-800/20 border-slate-200/50 dark:border-slate-800 opacity-40 text-slate-400";
                      } else if (isSelected) {
                        bgClass = "bg-amber-50 dark:bg-amber-950/20 border-amber-400 dark:border-amber-600 text-amber-900 dark:text-amber-200";
                      }

                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSingleAnswer(optId)}
                          disabled={showExplanation}
                          className={`w-full text-left p-3.5 rounded-xl border flex gap-3.5 items-start transition-all cursor-pointer ${bgClass}`}
                        >
                          <span className={`font-bold shrink-0 ${
                            showExplanation && isCorrect 
                              ? 'text-emerald-600 dark:text-emerald-400' 
                              : showExplanation && isSelected && !isCorrect 
                              ? 'text-rose-600 dark:text-rose-400' 
                              : 'text-amber-700 dark:text-amber-400'
                          }`}>
                            {optId}.
                          </span>
                          <div className="text-sm flex-1">
                            {renderContent(opt)}
                          </div>
                          {showExplanation && isCorrect && <CheckCircle2 className="text-emerald-600 dark:text-emerald-400 ml-auto shrink-0" size={18} />}
                          {showExplanation && isSelected && !isCorrect && <XCircle className="text-rose-600 dark:text-rose-400 ml-auto shrink-0" size={18} />}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  /* Open task instructions & self-grading */
                  <div className="space-y-4">
                    <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex items-start gap-3">
                      <HelpCircle className="text-amber-500 shrink-0 mt-0.5" size={18} />
                      <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                        To jest zadanie otwarte ({currentTask.points} pkt). Rozwiąż je na kartce lub w 
                        <strong className="text-slate-900 dark:text-white"> Brudnopisie</strong>, a następnie sprawdź oficjalne kryteria CKE.
                      </div>
                    </div>

                    {!showExplanation ? (
                      <button 
                        type="button"
                        onClick={() => setShowExplanation(true)}
                        className="w-full py-3.5 px-4 bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-xs"
                      >
                        Pokaż klucz oceniania
                      </button>
                    ) : (
                      <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                        <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider block mb-2">
                          Samodzielna ocena wg kryteriów CKE:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {Array.from({ length: currentTask.points + 1 }, (_, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => handleSingleSelfGrade(i)}
                              className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                singleSelfGrade === i
                                  ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-xs'
                                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:text-slate-900 dark:hover:text-white'
                              }`}
                            >
                              {i} pkt
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {showExplanation && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-[#131B29] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 mb-6 shadow-xs"
                >
                  <h3 className="text-slate-900 dark:text-white font-bold mb-3 flex items-center gap-2 text-sm">
                    <CheckCircle2 className="text-emerald-500" size={18} />
                    Klucz odpowiedzi i schemat punktowania CKE
                  </h3>
                  <div className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed mb-6">
                    {renderContent(currentTask.explanation)}
                  </div>
                  
                  <button 
                    type="button"
                    onClick={() => getRandomTask(selectedSection)}
                    className="w-full py-3.5 px-4 bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-xs"
                  >
                    Następne zadanie
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* EXAM VIEW */}
          {view === 'exam' && examTasks.length > 0 && (
            <motion.div 
              key="exam"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              className="flex-1 flex flex-col"
            >
              {!examFinished ? (
                <>
                  {/* Top Bar: Timer, Pause, Abort, Flag */}
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
                    <button 
                      type="button"
                      onClick={() => {
                        if (confirm("Czy na pewno chcesz przerwać arkusz? Twoje odpowiedzi zostaną utracone.")) {
                          setView('menu');
                        }
                      }}
                      className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                      <ArrowLeft size={15} />
                      <span>Przerwij</span>
                    </button>

                    {/* Timer Pill */}
                    <div className="flex items-center gap-2">
                      <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border font-mono font-bold text-xs ${
                        examTimeLeft < 180 
                          ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-800 animate-pulse' 
                          : examTimeLeft < 360
                          ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-400 border-amber-300 dark:border-amber-800'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}>
                        <Clock size={13} />
                        <span>{formatTimer(examTimeLeft)}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsExamPaused(prev => !prev)}
                        className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
                        title={isExamPaused ? 'Wznów egzamin' : 'Pauza'}
                      >
                        {isExamPaused ? <Play size={12} /> : <Pause size={12} />}
                      </button>
                    </div>
                  </div>

                  {/* Question Grid / Numbered Pills */}
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-3 mb-4">
                    {examTasks.map((t, idx) => {
                      const isCurrent = examCurrentIndex === idx;
                      const hasAnswer = t.isClosed 
                        ? !!examAnswers[t.id] 
                        : examOpenScores[t.id] !== undefined;
                      const isFlagged = flaggedTasks.has(t.id);

                      let pillStyle = "bg-white dark:bg-[#131B29] border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400";
                      if (isCurrent) {
                        pillStyle = "bg-amber-500 text-slate-950 border-amber-600 shadow-xs font-black";
                      } else if (hasAnswer) {
                        pillStyle = "bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 font-bold";
                      }

                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setExamCurrentIndex(idx)}
                          className={`relative shrink-0 w-9 h-9 rounded-xl border text-xs font-bold flex items-center justify-center transition-all cursor-pointer ${pillStyle}`}
                        >
                          {idx + 1}
                          {isFlagged && (
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full ring-2 ring-white dark:ring-[#0B0F17]" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Paused Overlay */}
                  {isExamPaused ? (
                    <div className="bg-white dark:bg-[#131B29] border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center my-auto shadow-xs">
                      <Pause className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1.5">Egzamin wstrzymany</h3>
                      <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Zegar został zatrzymany. Kliknij poniżej, aby powrócić do rozwiązywania.</p>
                      <button
                        type="button"
                        onClick={() => setIsExamPaused(false)}
                        className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold text-xs transition-colors cursor-pointer shadow-xs"
                      >
                        Wznów rozwiązywanie
                      </button>
                    </div>
                  ) : (
                    /* Active Exam Task Card */
                    <div className="bg-white dark:bg-[#131B29] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 mb-4 flex-1 flex flex-col justify-between shadow-xs">
                      <div>
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-2">
                            <span className="bg-amber-500/10 text-amber-800 dark:text-amber-400 text-xs font-bold px-2.5 py-1 rounded-md border border-amber-500/20">
                              {examTasks[examCurrentIndex].section}
                            </span>
                            <span className="text-slate-500 dark:text-slate-400 text-xs font-medium">
                              {examTasks[examCurrentIndex].points} {examTasks[examCurrentIndex].points === 1 ? 'pkt' : 'pkt'}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={toggleFlagCurrentTask}
                            className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                              flaggedTasks.has(examTasks[examCurrentIndex].id)
                                ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-400 border-amber-300 dark:border-amber-800 font-bold'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-slate-900 dark:hover:text-white'
                            }`}
                          >
                            <Flag size={12} />
                            <span>{flaggedTasks.has(examTasks[examCurrentIndex].id) ? 'Oznaczono' : 'Oznacz flagą'}</span>
                          </button>
                        </div>
                        
                        <div className="text-slate-900 dark:text-white text-base leading-relaxed mb-6 font-medium">
                          {renderContent(examTasks[examCurrentIndex].content)}
                        </div>

                        {examTasks[examCurrentIndex].isClosed ? (
                          <div className="space-y-2.5">
                            {examTasks[examCurrentIndex].options.map((opt, idx) => {
                              const optId = String.fromCharCode(65 + idx);
                              const isSelected = examAnswers[examTasks[examCurrentIndex].id] === optId;
                              
                              return (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => handleExamAnswer(optId)}
                                  className={`w-full text-left p-3.5 rounded-xl border flex gap-3.5 items-start transition-all cursor-pointer ${
                                    isSelected 
                                      ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-400 dark:border-amber-600 text-amber-950 dark:text-amber-200' 
                                      : 'bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                                  }`}
                                >
                                  <span className={`font-bold shrink-0 ${isSelected ? 'text-amber-800 dark:text-amber-400' : 'text-slate-500'}`}>
                                    {optId}.
                                  </span>
                                  <div className="text-sm flex-1 min-w-0 overflow-x-auto no-scrollbar">
                                    {renderContent(opt)}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                              Rozwiąż to zadanie w <strong className="text-slate-900 dark:text-white">Brudnopisie</strong> lub na kartce. 
                              Następnie oceń swoje rozwiązanie według kryteriów punktowania CKE:
                            </div>

                            <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider block mb-2.5">
                                Samodzielna ocena (maks. {examTasks[examCurrentIndex].points} pkt):
                              </span>
                              <div className="flex flex-wrap gap-2">
                                {Array.from({ length: examTasks[examCurrentIndex].points + 1 }, (_, i) => {
                                  const currentScore = examOpenScores[examTasks[examCurrentIndex].id];
                                  const isChecked = currentScore === i;

                                  return (
                                    <button
                                      key={i}
                                      type="button"
                                      onClick={() => handleOpenScore(i)}
                                      className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                        isChecked
                                          ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-xs'
                                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:text-slate-900 dark:hover:text-white'
                                      }`}
                                    >
                                      {i} pkt
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Bottom Exam Navigation */}
                      <div className="flex items-center justify-between gap-3 mt-8 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => setExamCurrentIndex(prev => Math.max(0, prev - 1))}
                          disabled={examCurrentIndex === 0}
                          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                        >
                          Poprzednie
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleFinishExam}
                            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-bold transition-colors cursor-pointer"
                          >
                            Zakończ arkusz
                          </button>

                          {examCurrentIndex < examTasks.length - 1 ? (
                            <button
                              type="button"
                              onClick={() => setExamCurrentIndex(prev => prev + 1)}
                              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors shadow-xs cursor-pointer"
                            >
                              Następne
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={handleFinishExam}
                              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors shadow-xs cursor-pointer"
                            >
                              Podsumuj i sprawdź
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* EXAM FINISHED REVIEW */
                <MaturaExamReview
                  tasks={reviewItems}
                  timeSpentSeconds={examTimeSpent}
                  onRetryMistakes={(missed) => {
                    const mapped = tasks.filter(t => missed.some(m => m.id === t.id));
                    setExamTasks(mapped);
                    setExamCurrentIndex(0);
                    setExamAnswers({});
                    setExamOpenScores({});
                    setFlaggedTasks(new Set());
                    setExamFinished(false);
                    setExamTimeLeft(mapped.length * 3 * 60);
                  }}
                  onBackToMenu={() => setView('menu')}
                  xpAwarded={earnedReward?.xp}
                  coinsAwarded={earnedReward?.coins}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Scratchpad Modal */}
      <ScratchpadModal
        isOpen={isScratchpadOpen}
        onClose={() => setIsScratchpadOpen(false)}
      />
    </div>
  );
}

export default MaturaSimulatorView;
