import { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, 
  GraduationCap, 
  Target, 
  ArrowLeft, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Trophy, 
  Clock, 
  Flag, 
  Pen, 
  Pause, 
  Play, 
  AlertTriangle,
  RotateCcw,
  Sparkles,
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

  const addMistake = (taskId: string) => {
    if (!mistakesBank.includes(taskId)) {
      const updated = [...mistakesBank, taskId];
      saveMistakesBank(updated);
    }
  };

  const removeMistake = (taskId: string) => {
    if (mistakesBank.includes(taskId)) {
      const updated = mistakesBank.filter(id => id !== taskId);
      saveMistakesBank(updated);
    }
  };

  // Fetch or retrieve tasks with caching
  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      try {
        // Fast path: session cache
        const cached = sessionStorage.getItem('cached_zadania_matura');
        if (cached) {
          const parsed = JSON.parse(cached) as MaturaTask[];
          if (parsed && parsed.length > 0) {
            setTasks(parsed);
            setSections(['Wszystkie', ...Array.from(new Set(parsed.map(t => t.section)))]);
            setLoading(false);
            return;
          }
        }

        const tasksRef = collection(db, 'zadania_matura');
        const snap = await getDocs(tasksRef);
        
        let loaded: MaturaTask[] = [];
        if (snap.empty) {
          await seedMaturaTasks();
          const snap2 = await getDocs(tasksRef);
          loaded = snap2.docs.map(d => ({ id: d.id, ...d.data() } as MaturaTask));
        } else {
          loaded = snap.docs.map(d => ({ id: d.id, ...d.data() } as MaturaTask));
        }

        setTasks(loaded);
        setSections(['Wszystkie', ...Array.from(new Set(loaded.map(t => t.section)))]);
        try {
          sessionStorage.setItem('cached_zadania_matura', JSON.stringify(loaded));
        } catch {}
      } catch (err) {
        console.warn("Using offline/cached matura tasks due to network/permissions:", err);
        setTasks(zadania_matura);
        setSections(['Wszystkie', ...Array.from(new Set(zadania_matura.map(t => t.section)))]);
      }
      setLoading(false);
    };

    fetchTasks();
  }, []);

  // Exam timer effect
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
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [view, examFinished, isExamPaused]);

  // Start exam
  const startExam = (section: string) => {
    let filtered = tasks;
    if (section !== 'Wszystkie') {
      filtered = tasks.filter(t => t.section === section);
    }
    
    // Select 7 random tasks for a 20-minute mini-exam
    const shuffled = [...filtered].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, Math.min(7, shuffled.length));
    
    if (selected.length === 0) {
      alert("Brak zadań w wybranym dziale!");
      return;
    }

    setExamTasks(selected);
    setExamCurrentIndex(0);
    setExamAnswers({});
    setExamOpenScores({});
    setFlaggedTasks(new Set());
    setExamFinished(false);
    setExamTimeLeft(EXAM_DURATION_SECONDS);
    setIsExamPaused(false);
    setEarnedReward(null);
    setView('exam');
  };

  // Start mistakes practice
  const startMistakesPractice = () => {
    const mistakesTasksList = tasks.filter(t => mistakesBank.includes(t.id));
    if (mistakesTasksList.length === 0) return;

    setExamTasks(mistakesTasksList);
    setExamCurrentIndex(0);
    setExamAnswers({});
    setExamOpenScores({});
    setFlaggedTasks(new Set());
    setExamFinished(false);
    setExamTimeLeft(mistakesTasksList.length * 3 * 60); // 3 mins per question
    setIsExamPaused(false);
    setEarnedReward(null);
    setView('exam');
  };

  const handleExamAnswer = (optId: string) => {
    const currentTaskId = examTasks[examCurrentIndex].id;
    setExamAnswers(prev => ({
      ...prev,
      [currentTaskId]: optId
    }));
  };

  const handleOpenScore = (score: number) => {
    const currentTaskId = examTasks[examCurrentIndex].id;
    setExamOpenScores(prev => ({
      ...prev,
      [currentTaskId]: score
    }));
  };

  const toggleFlagCurrentTask = () => {
    const currentTaskId = examTasks[examCurrentIndex].id;
    setFlaggedTasks(prev => {
      const next = new Set(prev);
      if (next.has(currentTaskId)) {
        next.delete(currentTaskId);
      } else {
        next.add(currentTaskId);
      }
      return next;
    });
  };

  const handleFinishExam = () => {
    const timeSpent = EXAM_DURATION_SECONDS - examTimeLeft;
    setExamTimeSpent(timeSpent);
    setExamFinished(true);

    // Calculate score
    let totalScore = 0;
    const newMistakesToAdd: string[] = [];
    const correctlySolved: string[] = [];

    examTasks.forEach(task => {
      if (task.isClosed) {
        if (examAnswers[task.id] === task.correctAnswer) {
          totalScore += task.points;
          correctlySolved.push(task.id);
        } else {
          newMistakesToAdd.push(task.id);
        }
      } else {
        const openScore = examOpenScores[task.id] || 0;
        totalScore += openScore;
        if (openScore >= task.points) {
          correctlySolved.push(task.id);
        } else {
          newMistakesToAdd.push(task.id);
        }
      }
    });

    // Update mistakes bank: add newly missed, remove solved
    const updatedBank = Array.from(
      new Set([
        ...mistakesBank.filter(id => !correctlySolved.includes(id)),
        ...newMistakesToAdd,
      ])
    );
    saveMistakesBank(updatedBank);

    // Calculate and trigger rewards
    const xp = 40 + totalScore * 15;
    const coins = 10 + totalScore * 5;
    setEarnedReward({ xp, coins });
    if (onEarnReward) {
      onEarnReward(xp, coins);
    }
  };

  const getRandomTask = (section: string = selectedSection) => {
    let filtered = tasks;
    if (section !== 'Wszystkie') {
      filtered = tasks.filter(t => t.section === section);
    }
    if (filtered.length > 0) {
      const rnd = filtered[Math.floor(Math.random() * filtered.length)];
      setCurrentTask(rnd);
      setSelectedAnswer(null);
      setShowExplanation(false);
      setSingleSelfGrade(null);
      setSelectedSection(section);
      setView('single');
    } else {
      alert("Brak zadań w wybranym dziale!");
    }
  };

  const handleSingleAnswer = (optId: string) => {
    if (showExplanation || !currentTask) return;
    setSelectedAnswer(optId);
    setShowExplanation(true);

    const isCorrect = currentTask.correctAnswer.includes(optId);
    if (isCorrect) {
      removeMistake(currentTask.id);
    } else {
      addMistake(currentTask.id);
    }
  };

  const handleSingleSelfGrade = (score: number) => {
    if (!currentTask) return;
    setSingleSelfGrade(score);
    if (score >= currentTask.points) {
      removeMistake(currentTask.id);
    } else {
      addMistake(currentTask.id);
    }
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const renderContent = (content: string) => (
    <div className="prose prose-invert max-w-none math-render overflow-x-auto py-2 -my-2">
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
    <div className="flex flex-col p-4 sm:p-6 min-h-full pb-[140px] max-w-3xl mx-auto w-full relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-white mb-1">Symulator Egzaminu Ósmoklasisty</h1>
          <p className="text-[#8B8D98] text-xs sm:text-sm">Oficjalne arkusze CKE • Egzamin Ósmoklasisty</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Scratchpad Button */}
          {(view === 'single' || view === 'exam') && (
            <button
              onClick={() => setIsScratchpadOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 text-xs font-bold transition-all shadow-sm"
              title="Otwórz brudnopis"
            >
              <Pen size={14} className="text-blue-400" />
              <span>Brudnopis</span>
            </button>
          )}

          <div className="w-10 h-10 bg-blue-500/10 rounded-xl border border-blue-500/20 flex items-center justify-center">
            <GraduationCap className="text-blue-500" size={20} />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
          <p className="text-[#8B8D98] text-sm">Ładowanie arkuszy egzaminacyjnych...</p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {/* MENU VIEW */}
          {view === 'menu' && (
            <motion.div 
              key="menu"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="flex-1 flex flex-col gap-5 pt-4"
            >
              {/* Card 1: Pojedyncze zadania */}
              <button 
                onClick={() => setView('select_section_single')}
                className="w-full text-left bg-[#0F172A] hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 sm:p-6 transition-colors cursor-pointer group shadow-sm active:scale-[0.99]"
              >
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 bg-sky-500/10 border border-sky-500/30 rounded-xl mb-3.5 flex items-center justify-center">
                    <Target className="text-sky-400" size={22} />
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded-full border border-sky-500/20">
                    Trening
                  </span>
                </div>
                <h3 className="font-display font-bold text-white text-lg mb-1.5 tracking-wide group-hover:text-sky-300 transition-colors">
                  Pojedyncze zadania
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed font-normal">
                  Rozwiązuj losowe zadania z wybranego działu. Natychmiastowa weryfikacja i pełny klucz rozwiązań.
                </p>
              </button>

              {/* Card 2: Mini Matura */}
              <button 
                onClick={() => setView('select_section_exam')}
                className="w-full text-left bg-[#0F172A] hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 sm:p-6 transition-colors cursor-pointer group shadow-sm active:scale-[0.99]"
              >
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/30 rounded-xl mb-3.5 flex items-center justify-center">
                    <BookOpen className="text-indigo-400" size={22} />
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20 flex items-center gap-1.5">
                    <Clock size={12} /> 20 MIN
                  </span>
                </div>
                <h3 className="font-display font-bold text-white text-lg mb-1.5 tracking-wide group-hover:text-indigo-300 transition-colors">
                  Mini Egzamin E8 (Próbny arkusz)
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed font-normal">
                  7-zadaniowy sprawdzian z zegarem, swobodną nawigacją po arkuszu, flagowaniem pytań i podsumowaniem wyników.
                </p>
              </button>

              {/* Card 3: Moje Błędy / Powtórki */}
              <button 
                onClick={startMistakesPractice}
                disabled={mistakesBank.length === 0}
                className={`w-full text-left bg-[#0F172A] border rounded-2xl p-5 sm:p-6 transition-colors ${
                  mistakesBank.length > 0 
                    ? 'hover:bg-slate-850 border-slate-800 hover:border-slate-700 cursor-pointer group active:scale-[0.99]' 
                    : 'border-slate-800/60 opacity-50 cursor-not-allowed'
                } shadow-sm`}
              >
                <div className="flex items-start justify-between">
                  <div className={`w-12 h-12 rounded-xl mb-3.5 flex items-center justify-center border ${
                    mistakesBank.length > 0 
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
                      : 'bg-slate-800 border-slate-700 text-slate-500'
                  }`}>
                    <RotateCcw size={22} />
                  </div>
                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full border ${
                    mistakesBank.length > 0 
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                      : 'bg-slate-800 text-slate-500 border-slate-700'
                  }`}>
                    {mistakesBank.length} DO POWTÓRKI
                  </span>
                </div>
                <h3 className="font-display font-bold text-white text-lg mb-1.5 tracking-wide">
                  Baza Błędów
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed font-normal">
                  Wygeneruj mini arkusz składający się ze wszystkich zadań, na które odpowiedziałeś błędnie.
                </p>
              </button>
            </motion.div>
          )}

          {/* SECTION SELECTOR */}
          {(view === 'select_section_single' || view === 'select_section_exam') && (
            <motion.div 
              key="select_section"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col"
            >
              <button 
                onClick={() => setView('menu')}
                className="flex items-center gap-2 text-[#8B8D98] hover:text-white mb-6 w-fit transition-colors"
              >
                <ArrowLeft size={16} />
                <span className="text-sm font-bold">Wróć do menu</span>
              </button>
              
              <h2 className="text-xl font-bold text-white mb-1.5">
                {view === 'select_section_single' ? 'Wybierz dział do ćwiczeń' : 'Wybierz dział dla Mini Egzaminu E8'}
              </h2>
              <p className="text-[#8B8D98] text-sm mb-6">
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
                      onClick={() => view === 'select_section_single' ? getRandomTask(sec) : startExam(sec)}
                      className="p-4 rounded-2xl bg-[#1A1B23] border border-white/10 text-left hover:border-blue-500/50 hover:bg-white/[0.03] transition-all flex items-center justify-between group"
                    >
                      <span className="text-white font-semibold text-sm group-hover:text-blue-400 transition-colors">
                        {sec}
                      </span>
                      <span className="text-xs text-[#8B8D98] bg-white/5 px-2 py-1 rounded-lg border border-white/5">
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
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col"
            >
              <div className="flex items-center justify-between mb-4">
                <button 
                  onClick={() => setView('menu')}
                  className="flex items-center gap-2 text-[#8B8D98] hover:text-white transition-colors"
                >
                  <ArrowLeft size={16} />
                  <span className="text-sm font-bold">Wróć do menu</span>
                </button>

                {mistakesBank.includes(currentTask.id) && (
                  <span className="text-xs font-bold text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded-full border border-sky-500/30 flex items-center gap-1">
                    <RotateCcw size={12} /> Zadanie z powtórek
                  </span>
                )}
              </div>

              <div className="bg-[#1A1B23] border border-white/10 rounded-[24px] p-5 sm:p-6 mb-4">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="bg-blue-500/10 text-blue-400 text-xs font-bold px-2.5 py-1 rounded-md border border-blue-500/20">
                      {currentTask.section}
                    </span>
                    <span className="text-[#8B8D98] text-xs font-medium">
                      {currentTask.points} {currentTask.points === 1 ? 'punkt' : 'punkty'}
                    </span>
                  </div>
                  <span className="text-[#8B8D98] text-xs font-mono">ID #{currentTask.id}</span>
                </div>
                
                <div className="text-white text-base leading-relaxed mb-6">
                  {renderContent(currentTask.content)}
                </div>

                {/* Closed task options */}
                {currentTask.isClosed ? (
                  <div className="space-y-3">
                    {currentTask.options.map((opt, idx) => {
                      const optId = String.fromCharCode(65 + idx);
                      const isSelected = selectedAnswer === optId;
                      const isCorrect = currentTask.correctAnswer.includes(optId);
                      
                      let bgClass = "bg-[#141A23] hover:bg-white/5 border-white/10";
                      if (showExplanation) {
                        if (isCorrect) bgClass = "bg-green-500/10 border-green-500/40 text-emerald-300";
                        else if (isSelected && !isCorrect) bgClass = "bg-red-500/10 border-red-500/40 text-red-300";
                        else bgClass = "bg-[#141A23] border-white/5 opacity-40";
                      } else if (isSelected) {
                        bgClass = "bg-blue-500/20 border-blue-500/50";
                      }

                      return (
                        <button
                          key={idx}
                          onClick={() => handleSingleAnswer(optId)}
                          disabled={showExplanation}
                          className={`w-full text-left p-4 rounded-xl border flex gap-3.5 items-start transition-all ${bgClass}`}
                        >
                          <span className={`font-bold shrink-0 ${
                            showExplanation && isCorrect 
                              ? 'text-green-400' 
                              : showExplanation && isSelected && !isCorrect 
                              ? 'text-red-400' 
                              : 'text-blue-400'
                          }`}>
                            {optId}.
                          </span>
                          <div className="text-white/90 text-sm flex-1">
                            {renderContent(opt)}
                          </div>
                          {showExplanation && isCorrect && <CheckCircle2 className="text-green-400 ml-auto shrink-0" size={20} />}
                          {showExplanation && isSelected && !isCorrect && <XCircle className="text-red-400 ml-auto shrink-0" size={20} />}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  /* Open task instructions & self-grading */
                  <div className="space-y-4">
                    <div className="bg-white/5 border border-white/5 rounded-xl p-4 flex items-start gap-3">
                      <HelpCircle className="text-blue-400 shrink-0 mt-0.5" size={18} />
                      <div className="text-xs sm:text-sm text-[#8B8D98]">
                        To jest zadanie otwarte ({currentTask.points} pkt). Rozwiąż je na kartce lub w 
                        <strong className="text-white"> Brudnopisie</strong>, a następnie sprawdź oficjalne kryteria oceniania CKE.
                      </div>
                    </div>

                    {!showExplanation ? (
                      <button 
                        onClick={() => setShowExplanation(true)}
                        className="w-full py-3.5 px-4 bg-sky-500 hover:bg-sky-400 active:scale-[0.99] text-slate-950 font-bold text-sm uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-sm"
                      >
                        Pokaż klucz oceniania
                      </button>
                    ) : (
                      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
                        <span className="text-xs font-bold text-white uppercase tracking-wider block mb-2">
                          Samodzielna ocena wg kryteriów CKE:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {Array.from({ length: currentTask.points + 1 }, (_, i) => (
                            <button
                              key={i}
                              onClick={() => handleSingleSelfGrade(i)}
                              className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                singleSelfGrade === i
                                  ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-sm'
                                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
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
                  className="bg-[#0F172A] border border-slate-800 rounded-2xl p-5 sm:p-6 mb-6"
                >
                  <h3 className="text-white font-bold mb-3 flex items-center gap-2 text-sm">
                    <CheckCircle2 className="text-emerald-400" size={18} />
                    Klucz odpowiedzi i schemat punktowania
                  </h3>
                  <div className="text-slate-400 text-xs sm:text-sm leading-relaxed mb-6">
                    {renderContent(currentTask.explanation)}
                  </div>
                  
                  <button 
                    onClick={() => getRandomTask(selectedSection)}
                    className="w-full py-3.5 px-4 bg-white hover:bg-slate-100 active:scale-[0.99] text-slate-950 font-bold text-sm uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-sm"
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
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col"
            >
              {!examFinished ? (
                <>
                  {/* Top Bar: Timer, Pause, Abort, Flag */}
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
                    <button 
                      onClick={() => {
                        if (confirm("Czy na pewno chcesz przerwać arkusz? Twoje odpowiedzi zostaną utracone.")) {
                          setView('menu');
                        }
                      }}
                      className="flex items-center gap-1.5 text-[#8B8D98] hover:text-white text-xs font-bold transition-colors"
                    >
                      <ArrowLeft size={15} />
                      <span>Przerwij</span>
                    </button>

                    {/* Timer Pill */}
                    <div className="flex items-center gap-2">
                      <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border font-mono font-bold text-xs ${
                        examTimeLeft < 180 
                          ? 'bg-red-500/10 text-red-400 border-red-500/30 animate-pulse' 
                          : examTimeLeft < 360
                          ? 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                          : 'bg-purple-500/10 text-purple-300 border-purple-500/20'
                      }`}>
                        <Clock size={13} />
                        <span>{formatTimer(examTimeLeft)}</span>
                      </div>

                      <button
                        onClick={() => setIsExamPaused(prev => !prev)}
                        className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-[#8B8D98] hover:text-white flex items-center justify-center transition-colors"
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

                      let pillStyle = "bg-white/5 border-white/10 text-[#8B8D98]";
                      if (isCurrent) {
                        pillStyle = "bg-purple-600 text-white border-purple-400 shadow-md ring-2 ring-purple-500/30";
                      } else if (hasAnswer) {
                        pillStyle = "bg-purple-950/60 border-purple-500/40 text-purple-300";
                      }

                      return (
                        <button
                          key={t.id}
                          onClick={() => setExamCurrentIndex(idx)}
                          className={`relative shrink-0 w-9 h-9 rounded-xl border text-xs font-bold flex items-center justify-center transition-all ${pillStyle}`}
                        >
                          {idx + 1}
                          {isFlagged && (
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-sky-400 rounded-full ring-2 ring-[#0A0A0C]" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Paused Overlay */}
                  {isExamPaused ? (
                    <div className="bg-[#1A1B23] border border-white/10 rounded-[24px] p-8 text-center my-auto">
                      <Pause className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-white mb-2">Egzamin wstrzymany</h3>
                      <p className="text-[#8B8D98] text-sm mb-6">Zegar został zatrzymany. Kliknij poniżej, aby powrócić do rozwiązywania.</p>
                      <button
                        onClick={() => setIsExamPaused(false)}
                        className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold transition-colors"
                      >
                        Wznów rozwiązywanie
                      </button>
                    </div>
                  ) : (
                    /* Active Exam Task Card */
                    <div className="bg-[#1A1B23] border border-white/10 rounded-[24px] p-5 sm:p-6 mb-4 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
                          <div className="flex items-center gap-2">
                            <span className="bg-purple-500/10 text-purple-300 text-xs font-bold px-2.5 py-1 rounded-md border border-purple-500/20">
                              {examTasks[examCurrentIndex].section}
                            </span>
                            <span className="text-[#8B8D98] text-xs font-medium">
                              {examTasks[examCurrentIndex].points} {examTasks[examCurrentIndex].points === 1 ? 'pkt' : 'pkt'}
                            </span>
                          </div>

                          <button
                            onClick={toggleFlagCurrentTask}
                            className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                              flaggedTasks.has(examTasks[examCurrentIndex].id)
                                ? 'bg-sky-500/15 text-sky-400 border-sky-500/30'
                                : 'bg-white/5 text-[#8B8D98] border-white/10 hover:text-white'
                            }`}
                          >
                            <Flag size={12} />
                            <span>{flaggedTasks.has(examTasks[examCurrentIndex].id) ? 'Oznaczono' : 'Oznacz flagą'}</span>
                          </button>
                        </div>
                        
                        <div className="text-white text-base leading-relaxed mb-6">
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
                                  onClick={() => handleExamAnswer(optId)}
                                  className={`w-full text-left p-3.5 rounded-xl border flex gap-3.5 items-start transition-all ${
                                    isSelected 
                                      ? 'bg-purple-500/20 border-purple-500/60 ring-1 ring-purple-500/30' 
                                      : 'bg-[#141A23] hover:bg-white/5 border-white/10'
                                  }`}
                                >
                                  <span className={`font-bold shrink-0 ${isSelected ? 'text-purple-400' : 'text-blue-400'}`}>
                                    {optId}.
                                  </span>
                                  <div className="text-white/90 text-sm flex-1 min-w-0 overflow-x-auto no-scrollbar">
                                    {renderContent(opt)}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="bg-white/5 border border-white/5 rounded-xl p-4 text-xs sm:text-sm text-[#8B8D98]">
                              Rozwiąż to zadanie w <strong className="text-white">Brudnopisie</strong> lub na kartce. 
                              Następnie oceń swoje rozwiązanie według kryteriów punktowania:
                            </div>

                            <div className="bg-white/[0.02] border border-white/10 rounded-xl p-4">
                              <span className="text-xs font-bold text-white uppercase tracking-wider block mb-2.5">
                                Samodzielna ocena (maks. {examTasks[examCurrentIndex].points} pkt):
                              </span>
                              <div className="flex flex-wrap gap-2">
                                {Array.from({ length: examTasks[examCurrentIndex].points + 1 }, (_, i) => {
                                  const currentScore = examOpenScores[examTasks[examCurrentIndex].id];
                                  const isChecked = currentScore === i;

                                  return (
                                    <button
                                      key={i}
                                      onClick={() => handleOpenScore(i)}
                                      className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                                        isChecked
                                          ? 'bg-purple-600 text-white border-purple-400 shadow-md'
                                          : 'bg-white/5 text-[#8B8D98] border-white/10 hover:text-white'
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
                      <div className="flex items-center justify-between gap-3 mt-8 pt-4 border-t border-white/5">
                        <button
                          onClick={() => setExamCurrentIndex(prev => Math.max(0, prev - 1))}
                          disabled={examCurrentIndex === 0}
                          className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold text-white transition-colors"
                        >
                          Poprzednie
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleFinishExam}
                            className="px-3.5 py-2.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-bold transition-colors"
                          >
                            Zakończ arkusz
                          </button>

                          {examCurrentIndex < examTasks.length - 1 ? (
                            <button
                              onClick={() => setExamCurrentIndex(prev => prev + 1)}
                              className="px-4 py-2.5 rounded-xl bg-white text-black hover:bg-gray-200 text-xs font-bold transition-colors shadow-md"
                            >
                              Następne
                            </button>
                          ) : (
                            <button
                              onClick={handleFinishExam}
                              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors shadow-md shadow-purple-600/20"
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
