import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Lightbulb, 
  FileText, 
  ChevronDown, 
  ChevronUp,
  Check, 
  X, 
  RefreshCw, 
  Trophy, 
  Flame, 
  Clock, 
  Target, 
  Maximize2, 
  Minimize2, 
  BookOpen,
  Zap,
  Star,
  RotateCcw,
  Award,
  PenTool,
  Send,
  HelpCircle,
  Bot,
  Loader2,
  Coins,
  Eye,
  EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { triggerHaptic, playSuccessSound, parseSolutionSteps, FormattedSolutionStep } from '../utils';
import { MathText } from './MathText';
import { MathRenderer } from './MathRenderer';
import { Badge } from './Badge';
import { CkeScratchpad } from './CkeScratchpad';
import { OpenTaskWorkspace } from './OpenTaskWorkspace';
import { SessionRunner } from './SessionRunner';
import { UserState, MathTaskItem, TaskOption, TaskSolutionStep } from '../types';
import { useTheme } from '../context/ThemeContext';

interface TaskViewProps {
  taskData?: any;
  userState?: UserState;
  onCompleteTask: (taskIds?: string | string[], stars?: number, earnedXp?: number, earnedCoins?: number, nextLesson?: any) => void;
  onCancelTask: () => void;
}

interface TheoryCardItem {
  title: string;
  badge?: string;
  type?: 'formulas' | 'takeaway' | 'trap' | 'default';
  formulas?: string[];
  trap_error?: string;
  trap_correct?: string;
  trap_note?: string;
  content?: string;
}

function buildTheoryCards(theoryItem: any): TheoryCardItem[] {
  const pill = theoryItem?.theory_pill;
  if (pill) {
    const cards: TheoryCardItem[] = [];

    // Card 1: Wzory / Złoty Wzór
    let formulasList: string[] = pill.formulas || [];
    if (!formulasList || formulasList.length === 0) {
      formulasList = (pill.core_formula || '')
        .split(/\n+|\$\$\s*\$\$|\\quad(?!\w)|,\s*(?=\\[a-zA-Z]+|[a-zA-Z0-9])/)
        .map((f: string) => f.replace(/\$\$/g, '').trim())
        .filter((f: string) => f.length > 0 && f !== ',');
    }

    cards.push({
      title: pill.title || 'Złoty Wzór',
      badge: 'Złoty Wzór',
      type: 'formulas',
      formulas: formulasList
    });

    // Card 2: Kluczowa Strategia
    if (pill.key_takeaway) {
      cards.push({
        title: 'Kluczowa Strategia',
        badge: 'Wskazówka Egzaminatora',
        type: 'takeaway',
        content: pill.key_takeaway
      });
    }

    // Card 3: Uwaga na Pułapkę Egzaminacyjną
    if (pill.cke_trap || pill.trap_error) {
      cards.push({
        title: 'Uwaga na Pułapkę Egzaminacyjną',
        badge: 'Częsty Błąd',
        type: 'trap',
        trap_error: pill.trap_error,
        trap_correct: pill.trap_correct,
        trap_note: pill.trap_note || pill.cke_trap,
        content: pill.cke_trap
      });
    }

    if (cards.length > 0) return cards;
  }

  // Fallback to parsing officialKey if no structured theory_pill
  return parseTheoryCards(theoryItem?.officialKey || '', theoryItem?.question || '');
}

function parseTheoryCards(officialKey: string, question: string): TheoryCardItem[] {
  const sanitized = (officialKey || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .trim();

  if (sanitized.includes('•')) {
    const rawBullets = sanitized.split(/\n?•\s*/).filter(b => b.trim().length > 0);
    const bullets = rawBullets.filter(b => !b.toLowerCase().startsWith('pigułka wiedzy'));

    return bullets.map(b => {
      const lines = b.split('\n').map(l => l.trim()).filter(Boolean);
      let title = lines[0] || 'Kluczowa Reguła';

      if (title.includes(':')) {
        const colonIdx = title.indexOf(':');
        const afterColon = title.substring(colonIdx + 1).trim();
        title = title.substring(0, colonIdx).trim();
        if (afterColon) {
          lines[0] = afterColon;
        } else {
          lines.shift();
        }
      } else {
        lines.shift();
      }

      const content = lines.join('\n\n');
      const isTrap = title.toLowerCase().includes('pułapk') || title.toLowerCase().includes('błąd');

      return {
        title,
        badge: isTrap ? 'Częsty Błąd' : 'Kluczowa Reguła',
        type: isTrap ? 'trap' : 'default',
        content,
        trap_note: isTrap ? content : undefined
      };
    });
  }

  return [{
    title: 'Pigułka wiedzy',
    badge: 'Podsumowanie',
    type: 'default',
    content: sanitized || question
  }];
}

export function TaskView({ taskData, userState, onCompleteTask, onCancelTask }: TaskViewProps) {
  const { zenMode, toggleZenMode } = useTheme();

  if (taskData?.isSession) {
    return (
      <SessionRunner 
        sessionData={taskData} 
        userState={userState} 
        onCompleteSession={onCompleteTask} 
        onCancelSession={onCancelTask} 
      />
    );
  }

  // Determine tasks pool for this lesson
  const rawLessonTasks: any[] = (taskData?.lessonTasks && Array.isArray(taskData.lessonTasks) && taskData.lessonTasks.length > 0)
    ? taskData.lessonTasks
    : (taskData ? [taskData] : []);

  const theoryTask = rawLessonTasks.find((t: any) => t.type === 'theory' || t.id?.includes('THEORY'));
  const practiceTasksList = rawLessonTasks.filter((t: any) => t.type !== 'theory' && !t.id?.includes('THEORY'));

  // Initial mode
  const startsWithTheory = Boolean(taskData?.type === 'theory' || taskData?.id?.includes('THEORY'));
  const [isInTheoryMode, setIsInTheoryMode] = useState<boolean>(startsWithTheory);
  const [currentTheoryIndex, setCurrentTheoryIndex] = useState<number>(0);

  // Practice tasks queue
  const initialPracticeQueue = practiceTasksList.length > 0 
    ? practiceTasksList 
    : (startsWithTheory ? [] : [taskData]);

  const [practiceQueue, setPracticeQueue] = useState<any[]>(initialPracticeQueue);
  const [currentTaskIndex, setCurrentTaskIndex] = useState<number>(0);

  // Retry buffer & phase
  const [mistakesBuffer, setMistakesBuffer] = useState<any[]>([]);
  const [isRetryPhase, setIsRetryPhase] = useState<boolean>(false);
  const [showRetryInterstitial, setShowRetryInterstitial] = useState<boolean>(false);

  // Statistics for Star Rating and Rewards
  const [firstPassMistakesCount, setFirstPassMistakesCount] = useState<number>(0);
  const [firstAttemptCorrectCount, setFirstAttemptCorrectCount] = useState<number>(0);
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([]);
  const [accumulatedXp, setAccumulatedXp] = useState<number>(startsWithTheory ? 5 : 0);
  const [accumulatedCoins, setAccumulatedCoins] = useState<number>(2);

  // Active question interaction state
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [numericValue, setNumericValue] = useState<string>('');
  const [openProofText, setOpenProofText] = useState<string>('');
  const [isEvaluated, setIsEvaluated] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [shakeIncorrect, setShakeIncorrect] = useState<boolean>(false);
  const [showSolutionSteps, setShowSolutionSteps] = useState<boolean>(false);

  // Scratchpad Bottom Sheet state
  const [isScratchpadOpen, setIsScratchpadOpen] = useState<boolean>(false);
  const [scratchpadDataUrl, setScratchpadDataUrl] = useState<string>('');

  // Scroll refs for question and solution steps
  const mainScrollRef = useRef<HTMLDivElement>(null);
  const solutionRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to feedback/solution when evaluated or steps toggled
  useEffect(() => {
    if (isEvaluated) {
      const timer = setTimeout(() => {
        if (solutionRef.current) {
          solutionRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [isEvaluated, showSolutionSteps]);

  // Hints drawer state
  const [showHintModal, setShowHintModal] = useState<boolean>(false);
  const [unlockedHintLevel, setUnlockedHintLevel] = useState<number>(1);
  
  // Socratic AI Tutor state
  const [showOpenProofTutorSheet, setShowOpenProofTutorSheet] = useState<boolean>(false);
  const [aiTutorResponse, setAiTutorResponse] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);

  // Celebration state
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  const activeTask: any = isInTheoryMode 
    ? (theoryTask || taskData)
    : (practiceQueue[currentTaskIndex] || taskData || {});

  // Determine Task Type (supporting both standard and legacy)
  const taskType: string = (() => {
    if (activeTask.task_type) return activeTask.task_type;
    if (activeTask.type === 'theory' || activeTask.id?.includes('THEORY')) return 'THEORY';
    if (activeTask.type === 'closed' || (activeTask.options && activeTask.options.length > 0)) {
      const correctCount = (activeTask.options || []).filter((o: any) => o.is_correct).length;
      return correctCount > 1 ? 'MULTI_CHOICE' : 'SINGLE_CHOICE';
    }
    if (activeTask.type === 'open_proof' || activeTask.id?.startsWith('DOWOD_') || activeTask.requiresProof) {
      return 'OPEN_PROOF';
    }
    if (activeTask.type === 'open' || activeTask.id?.startsWith('OTW_')) {
      return 'NUMERIC_INPUT';
    }
    return 'SINGLE_CHOICE';
  })();

  const rawOptions: any[] = activeTask?.options || [];
  const normalizedOptions: TaskOption[] = rawOptions.map((opt: any, idx: number) => {
    if (typeof opt === 'string') {
      const letter = String.fromCharCode(65 + idx);
      return { id: letter, text: opt, content_latex: opt, is_correct: false };
    }
    return {
      id: opt.id || String.fromCharCode(65 + idx),
      text: opt.text || opt.content_latex || '',
      content_latex: opt.content_latex || opt.text || '',
      is_correct: Boolean(opt.is_correct)
    };
  });

  const correctOptions = normalizedOptions.filter(o => o.is_correct).map(o => o.id);
  const requiredCount = correctOptions.length > 0 ? correctOptions.length : 1;

  // Reset answer states upon new task
  useEffect(() => {
    setSelectedOptions([]);
    setNumericValue('');
    setOpenProofText('');
    setIsEvaluated(false);
    setIsCorrect(null);
    setShowSolutionSteps(false);
    setShowHintModal(false);
    setUnlockedHintLevel(1);
    setShowOpenProofTutorSheet(false);
    setAiTutorResponse('');
    setIsAiLoading(false);
  }, [currentTaskIndex, isInTheoryMode]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === 'Escape') {
        if (showHintModal) setShowHintModal(false);
        else if (showOpenProofTutorSheet) setShowOpenProofTutorSheet(false);
        else if (isScratchpadOpen) setIsScratchpadOpen(false);
        else onCancelTask();
        return;
      }

      if (isInTheoryMode) {
        if (e.key === 'ArrowRight' || e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const theoryCards = buildTheoryCards(theoryTask || activeTask);
          if (currentTheoryIndex < theoryCards.length - 1) {
            triggerHaptic('light');
            setCurrentTheoryIndex(prev => prev + 1);
          } else {
            triggerHaptic('medium');
            if (practiceQueue.length > 0) {
              setCurrentTaskIndex(0);
              setIsInTheoryMode(false);
            } else {
              triggerCelebration();
            }
          }
        } else if (e.key === 'ArrowLeft' && currentTheoryIndex > 0) {
          e.preventDefault();
          triggerHaptic('light');
          setCurrentTheoryIndex(prev => prev - 1);
        }
        return;
      }

      // Practice mode shortcuts
      if (!isEvaluated) {
        if (taskType === 'SINGLE_CHOICE') {
          const keyUpper = e.key.toUpperCase();
          const matchedOpt = normalizedOptions.find(o => o.id === keyUpper);
          if (matchedOpt) {
            triggerHaptic('light');
            setSelectedOptions([matchedOpt.id]);
          }
        }

        if (e.key === 'Enter') {
          e.preventDefault();
          if (isReadyToVerify) {
            handleVerifyAnswer();
          }
        }
      } else {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleNextQuestion();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isEvaluated, 
    selectedOptions, 
    numericValue, 
    openProofText, 
    isInTheoryMode, 
    currentTheoryIndex,
    currentTaskIndex,
    showHintModal,
    showOpenProofTutorSheet,
    isScratchpadOpen
  ]);

  const handleSelectOption = (id: string) => {
    if (isEvaluated) return;
    triggerHaptic('light');

    if (taskType === 'MULTI_CHOICE') {
      if (selectedOptions.includes(id)) {
        setSelectedOptions(selectedOptions.filter(item => item !== id));
      } else {
        if (selectedOptions.length < requiredCount) {
          setSelectedOptions([...selectedOptions, id]);
        } else {
          // Replace oldest selection
          setSelectedOptions([...selectedOptions.slice(1), id]);
        }
      }
    } else {
      setSelectedOptions([id]);
    }
  };

  const isReadyToVerify: boolean = (() => {
    if (taskType === 'MULTI_CHOICE') {
      return selectedOptions.length === requiredCount;
    }
    if (taskType === 'SINGLE_CHOICE') {
      return selectedOptions.length === 1;
    }
    if (taskType === 'NUMERIC_INPUT') {
      return numericValue.trim().length > 0;
    }
    if (taskType === 'OPEN_PROOF') {
      return openProofText.trim().length > 3 || scratchpadDataUrl.length > 50;
    }
    return selectedOptions.length > 0 || numericValue.trim().length > 0;
  })();

  const handleVerifyAnswer = () => {
    if (!isReadyToVerify || isEvaluated) return;

    let evaluatedCorrect = false;

    if (taskType === 'MULTI_CHOICE') {
      const sortedSelected = [...selectedOptions].sort();
      const sortedCorrect = [...correctOptions].sort();
      evaluatedCorrect = sortedSelected.length === sortedCorrect.length && 
        sortedSelected.every((val, index) => val === sortedCorrect[index]);
    } else if (taskType === 'SINGLE_CHOICE') {
      const chosen = selectedOptions[0];
      const correctOption = normalizedOptions.find(o => o.is_correct)?.id;
      evaluatedCorrect = chosen === correctOption;
    } else if (taskType === 'NUMERIC_INPUT') {
      const cleanInput = numericValue.replace(/\s+/g, '').replace(',', '.').toLowerCase();
      const expectedAnswers = [
        activeTask.correct_answer,
        activeTask.answer,
        activeTask.officialKey
      ].filter(Boolean).map(ans => String(ans).replace(/\s+/g, '').replace(',', '.').toLowerCase());

      evaluatedCorrect = expectedAnswers.some(ans => cleanInput === ans);
    } else if (taskType === 'OPEN_PROOF') {
      // In demo mode open proofs award self-assessment / proof completion
      evaluatedCorrect = true;
    }

    setIsCorrect(evaluatedCorrect);
    setIsEvaluated(true);

    if (evaluatedCorrect) {
      triggerHaptic('success');
      playSuccessSound();

      if (!isRetryPhase) {
        setFirstAttemptCorrectCount(prev => prev + 1);
        setAccumulatedXp(prev => prev + 10);
        setAccumulatedCoins(prev => prev + 2);
      } else {
        setAccumulatedXp(prev => prev + 5);
      }

      if (activeTask.id && !completedTaskIds.includes(activeTask.id)) {
        setCompletedTaskIds(prev => [...prev, activeTask.id]);
      }
    } else {
      triggerHaptic('error');
      setShakeIncorrect(true);
      setTimeout(() => setShakeIncorrect(false), 500);

      if (!isRetryPhase) {
        setFirstPassMistakesCount(prev => prev + 1);
        setMistakesBuffer(prev => {
          if (!prev.some(t => t.id === activeTask.id)) {
            return [...prev, activeTask];
          }
          return prev;
        });
      }
    }
  };

  const handleNextQuestion = () => {
    triggerHaptic('light');

    if (currentTaskIndex < practiceQueue.length - 1) {
      setCurrentTaskIndex(prev => prev + 1);
    } else {
      // End of this practice sequence
      if (!isRetryPhase && mistakesBuffer.length > 0) {
        setShowRetryInterstitial(true);
      } else {
        triggerCelebration();
      }
    }
  };

  const handleStartRetryPhase = () => {
    triggerHaptic('medium');
    setPracticeQueue([...mistakesBuffer]);
    setMistakesBuffer([]);
    setCurrentTaskIndex(0);
    setIsRetryPhase(true);
    setShowRetryInterstitial(false);
  };

  const triggerCelebration = () => {
    setIsCompleted(true);
    triggerHaptic('success');

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#F59E0B', '#10B981', '#38BDF8', '#F8FAFC']
      });
    } catch {
      // Silent catch
    }
  };

  const handleContinue = () => {
    triggerHaptic('medium');
    const calculatedStars = firstPassMistakesCount === 0 ? 3 : firstPassMistakesCount <= 2 ? 2 : 1;
    onCompleteTask(
      completedTaskIds.length > 0 ? completedTaskIds : (activeTask?.id ? [activeTask.id] : []),
      calculatedStars,
      accumulatedXp,
      accumulatedCoins
    );
  };

  const handleAskAiTutor = async () => {
    setIsAiLoading(true);
    setShowOpenProofTutorSheet(true);
    triggerHaptic('light');

    try {
      const res = await fetch('/api/gemini/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskQuestion: activeTask.math_statement || activeTask.question || '',
          taskInstruction: activeTask.instruction || '',
          studentProof: openProofText || 'Uczeń rozpoczął szkicowanie w brudnopisie.',
          taskType: 'OPEN_PROOF'
        })
      });

      if (res.ok) {
        const data = await res.json();
        setAiTutorResponse(data.reply || data.hint || 'Sprowadź wyrażenie do postaci iloczynowej.');
      } else {
        setAiTutorResponse(activeTask.hints?.level_1 || 'Zwróć uwagę na założenia i przekształcenia algebraiczne.');
      }
    } catch (e) {
      setAiTutorResponse(activeTask.hints?.level_1 || 'Zwróć uwagę na założenia i przekształcenia algebraiczne.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const solutionSteps: FormattedSolutionStep[] = parseSolutionSteps(
    activeTask.solution_steps,
    activeTask.explanation || activeTask.officialKey || ''
  );

  // --------------------------------------------------------------------------
  // 1. CELEBRATION / LESSON SUMMARY SCREEN (Refined Notion/Linear Craft)
  // --------------------------------------------------------------------------
  if (isCompleted) {
    const calculatedStars = firstPassMistakesCount === 0 ? 3 : firstPassMistakesCount <= 2 ? 2 : 1;
    const totalEarnedXp = accumulatedXp;
    const totalEarnedCoins = accumulatedCoins;
    const streakDays = userState?.streakDays || 1;

    return (
      <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 select-none overflow-hidden animate-in fade-in duration-200">
        <div className="w-full max-w-lg bg-white dark:bg-[#131B29] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col justify-between items-center text-center overflow-hidden relative">
          
          <div className="p-6 sm:p-8 flex flex-col items-center w-full">
            {/* Minimalist bulb / star achievement icon */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-500 mb-4 shadow-sm"
            >
              <Trophy size={32} />
            </motion.div>

            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full mb-2">
              Lekcja Ukończona
            </span>

            <h2 className="font-display font-black text-2xl sm:text-3xl text-slate-900 dark:text-white mb-1.5 tracking-tight">
              Świetna robota!
            </h2>

            <p className="text-slate-600 dark:text-slate-400 text-sm max-w-xs leading-relaxed mb-5">
              Opanowałeś kluczowe reguły CKE i utrwaliłeś schematy rozwiązań.
            </p>

            {/* Star Rating System */}
            <div className="flex items-center justify-center gap-2 mb-6">
              {[1, 2, 3].map((starIndex) => (
                <motion.div
                  key={starIndex}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.15 + starIndex * 0.08, type: 'spring', stiffness: 260, damping: 18 }}
                >
                  <Star 
                    size={28} 
                    className={starIndex <= calculatedStars ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-700'} 
                  />
                </motion.div>
              ))}
            </div>

            {/* Statistics Bento Grid */}
            <div className="grid grid-cols-3 gap-2.5 w-full mb-6">
              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-3 flex flex-col items-center justify-center">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center mb-1 text-amber-600 dark:text-amber-400">
                  <Sparkles size={14} />
                </div>
                <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">+{totalEarnedXp}</span>
                <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">XP</span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-3 flex flex-col items-center justify-center">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center mb-1 text-amber-600 dark:text-amber-400">
                  <Coins size={14} />
                </div>
                <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">+{totalEarnedCoins}</span>
                <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">Monet</span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-3 flex flex-col items-center justify-center">
                <div className="w-7 h-7 rounded-lg bg-orange-500/10 flex items-center justify-center mb-1 text-orange-500">
                  <Flame size={14} className="fill-orange-500" />
                </div>
                <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">{streakDays} dni</span>
                <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">Seria</span>
              </div>
            </div>

            {/* Bezbłędne zaliczenie odznaka */}
            {calculatedStars === 3 && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs font-semibold mb-4">
                <CheckCircle2 size={13} className="text-emerald-500" />
                <span>Zaliczone bezbłędnie (100%)</span>
              </div>
            )}
          </div>

          {/* Action Footer */}
          <footer className="w-full p-4 bg-slate-50 dark:bg-[#0B0F17] border-t border-slate-200 dark:border-slate-800 flex flex-col items-center">
            <button 
              onClick={handleContinue}
              className="w-full py-3.5 px-6 bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-slate-950 font-bold text-sm sm:text-base rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <span>WRÓĆ DO MAPY NAUKI</span>
              <ArrowRight size={16} />
            </button>
          </footer>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // 2. RETRY INTERSTITIAL SCREEN
  // --------------------------------------------------------------------------
  if (showRetryInterstitial) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 select-none overflow-hidden">
        <div className="w-full max-w-lg bg-white dark:bg-[#131B29] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col justify-between items-center text-center overflow-hidden">
          
          <header className="w-full px-5 pt-4 pb-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
              <RotateCcw size={14} /> Pętla Poprawkowa CKE
            </span>
            <button 
              onClick={onCancelTask}
              className="w-7 h-7 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <X size={15} />
            </button>
          </header>

          <div className="p-6 sm:p-8 flex flex-col items-center w-full">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mb-4">
              <RotateCcw size={28} />
            </div>

            <h2 className="font-display font-black text-2xl text-slate-900 dark:text-white mb-2 tracking-tight">
              Czas na szybką powtórkę!
            </h2>

            <p className="text-slate-600 dark:text-slate-400 text-sm max-w-sm leading-relaxed mb-5">
              Popraw błędy, aby ukończyć lekcję. Pętla poprawek to klucz do trwałej pamięci i wysokiego wyniku.
            </p>

            <div className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-4 text-left mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <AlertTriangle size={14} className="text-amber-500" />
                  Zadania do poprawy:
                </span>
                <span className="text-xs font-bold text-amber-800 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
                  {mistakesBuffer.length} {mistakesBuffer.length === 1 ? 'zadanie' : 'zadania'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Za każdą udaną poprawkę otrzymujesz <strong className="text-slate-900 dark:text-white">+5 XP</strong> oraz odblokowujesz oficjalny Ekran Sukcesu.
              </p>
            </div>
          </div>

          <footer className="w-full p-4 bg-slate-50 dark:bg-[#0B0F17] border-t border-slate-200 dark:border-slate-800 flex justify-center">
            <button 
              onClick={handleStartRetryPhase}
              className="w-full py-3.5 px-6 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 active:scale-[0.98] shadow-xs cursor-pointer"
            >
              <span>Popraw błędy teraz</span>
              <ArrowRight size={16} />
            </button>
          </footer>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // 3. THEORY FLASHCARDS (PIGUŁKA WIEDZY - Notion Style)
  // --------------------------------------------------------------------------
  if (isInTheoryMode) {
    const theoryItem = theoryTask || activeTask;
    const cards = buildTheoryCards(theoryItem);
    const currentCard = cards[currentTheoryIndex] || cards[0];
    const isLastCard = currentTheoryIndex === cards.length - 1;

    return (
      <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/70 backdrop-blur-md flex items-center justify-center p-0 md:p-6 lg:p-8 select-none overflow-hidden animate-in fade-in duration-150">
        <div className="w-full h-full md:h-[90vh] md:max-h-[850px] md:max-w-[760px] bg-white dark:bg-[#131B29] md:rounded-3xl md:border md:border-slate-200 md:dark:border-slate-800 shadow-2xl flex flex-col justify-start items-stretch overflow-hidden relative">
          
          <header className="shrink-0 px-4 pt-3.5 pb-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131B29] flex items-center justify-between z-20">
            <button 
              onClick={onCancelTask}
              className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-1.5 rounded-full transition-colors active:scale-95 cursor-pointer"
            >
              <X size={14} /> Zamknij
            </button>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full flex items-center gap-1">
                <BookOpen size={12} />
                <span>{theoryItem.topic || 'Pigułka wiedzy'}</span>
              </span>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {currentTheoryIndex + 1} / {cards.length}
              </span>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 flex flex-col justify-start items-stretch gap-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTheoryIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xs flex-1 min-h-0 flex flex-col justify-between relative overflow-y-auto"
              >
                <div className="flex-1 flex flex-col justify-start">
                  <div className="flex items-center justify-between gap-2 mb-3 text-xs font-bold">
                    <div className="flex items-center gap-2">
                      {currentCard.type === 'trap' ? (
                        <>
                          <AlertTriangle size={14} className="text-rose-500" />
                          <span className="text-rose-700 dark:text-rose-400 font-bold uppercase tracking-wider">{currentCard.badge || 'Częsty Błąd'}</span>
                        </>
                      ) : currentCard.type === 'formulas' ? (
                        <>
                          <Sparkles size={14} className="text-amber-500" />
                          <span className="text-amber-700 dark:text-amber-400 font-bold uppercase tracking-wider">{currentCard.badge || 'Złoty Wzór'}</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={14} className="text-emerald-500" />
                          <span className="text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-wider">{currentCard.badge || 'Kluczowa Reguła'}</span>
                        </>
                      )}
                    </div>

                    {/* Pagination dots */}
                    <div className="flex items-center gap-1.5">
                      {cards.map((_, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setCurrentTheoryIndex(idx);
                            triggerHaptic('light');
                          }}
                          className={`h-1.5 rounded-full transition-all duration-200 ${
                            idx === currentTheoryIndex ? 'w-5 bg-amber-500' : 'w-1.5 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400'
                          }`}
                          aria-label={`Przejdź do kroku ${idx + 1}`}
                        />
                      ))}
                    </div>
                  </div>

                  <h3 className="font-display font-black text-lg sm:text-xl text-slate-900 dark:text-white mb-3 leading-snug">
                    {currentCard.title}
                  </h3>

                  {/* Card Type: formulas */}
                  {currentCard.type === 'formulas' && currentCard.formulas && currentCard.formulas.length > 0 ? (
                    <div className="w-full bg-white dark:bg-[#131B29] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs my-auto">
                      <div className="divide-y divide-slate-100 dark:divide-slate-800 flex flex-col">
                        {currentCard.formulas.map((formula, idx) => (
                          <div
                            key={idx}
                            className="w-full py-2.5 px-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                          >
                            <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 shrink-0 w-5 text-left">
                              {idx + 1}.
                            </span>
                            <div className="flex-1 flex items-center justify-center py-1 text-center overflow-visible min-h-[36px]">
                              <MathRenderer 
                                content={formula.startsWith('$') ? formula : `$${formula}$`} 
                                className="text-slate-900 dark:text-white font-bold text-xs sm:text-sm text-center"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : currentCard.type === 'trap' ? (
                    /* Card Type: trap */
                    <div className="flex flex-col gap-2.5 w-full my-auto">
                      {currentCard.trap_error && (
                        <div className="p-3 sm:p-3.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-xl overflow-hidden">
                          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 mb-1.5 shrink-0">
                            <X size={14} className="stroke-[3]" />
                            <span>Częsty błąd maturalny</span>
                          </div>
                          <div className="text-slate-900 dark:text-rose-100 font-medium text-xs sm:text-sm leading-relaxed break-words py-0.5 max-w-full">
                            <MathRenderer 
                              content={currentCard.trap_error.startsWith('$') ? currentCard.trap_error : `$${currentCard.trap_error}$`} 
                              className="flex flex-wrap items-center gap-x-1.5 gap-y-1 break-words max-w-full"
                            />
                          </div>
                        </div>
                      )}

                      {currentCard.trap_correct && (
                        <div className="p-3 sm:p-3.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-xl overflow-hidden">
                          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-1.5 shrink-0">
                            <Check size={14} className="stroke-[3]" />
                            <span>Prawidłowy tok rozumowania</span>
                          </div>
                          <div className="text-slate-900 dark:text-emerald-100 font-medium text-xs sm:text-sm leading-relaxed break-words py-0.5 max-w-full">
                            <MathRenderer 
                              content={currentCard.trap_correct.startsWith('$') ? currentCard.trap_correct : `$${currentCard.trap_correct}$`} 
                              className="flex flex-wrap items-center gap-x-1.5 gap-y-1 break-words max-w-full"
                            />
                          </div>
                        </div>
                      )}

                      {(currentCard.trap_note || currentCard.content) && (
                        <div className="p-3.5 bg-white dark:bg-[#131B29] border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed break-words max-w-full shadow-xs">
                          <MathRenderer content={currentCard.trap_note || currentCard.content || ''} className="break-words" />
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Card Type: takeaway or default */
                    <div className="bg-white dark:bg-[#131B29] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 my-auto text-slate-800 dark:text-slate-200 text-sm sm:text-base leading-relaxed break-words shadow-xs">
                      <MathRenderer content={currentCard.content || ''} className="leading-relaxed" />
                    </div>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </main>

          <footer className="shrink-0 p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131B29] flex gap-3 z-20 pb-safe-bottom">
            {currentTheoryIndex > 0 && (
              <button
                onClick={() => {
                  setCurrentTheoryIndex(i => i - 1);
                  triggerHaptic('light');
                }}
                className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold px-5 py-3 rounded-xl text-sm transition-all flex items-center justify-center active:scale-95 cursor-pointer"
              >
                Wstecz
              </button>
            )}

            <button
              onClick={() => {
                triggerHaptic('light');
                if (!isLastCard) {
                  setCurrentTheoryIndex(i => i + 1);
                } else {
                  if (practiceQueue.length > 0) {
                    setCurrentTaskIndex(0);
                    setIsInTheoryMode(false);
                  } else {
                    triggerCelebration();
                  }
                }
              }}
              className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 px-6 rounded-xl text-sm transition-all flex items-center justify-center gap-2 group active:scale-[0.98] shadow-xs cursor-pointer"
            >
              <span>
                {!isLastCard 
                  ? 'Następna reguła' 
                  : practiceQueue.length > 0 
                    ? `Rozpocznij zadania (1/${practiceQueue.length})` 
                    : 'Rozpocznij zadania'}
              </span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </footer>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // 4. GŁÓWNA RAMKA ZADANIA CKE (Clean Light / Dark & Zen Mode)
  // --------------------------------------------------------------------------
  const progressPercent = practiceQueue.length > 0 
    ? ((currentTaskIndex + (isEvaluated && isCorrect ? 1 : 0)) / practiceQueue.length) * 100 
    : 100;

  const pointsCount = activeTask.points || (activeTask.cke_source?.includes('2 pkt') || taskType === 'MULTI_CHOICE' || taskType === 'OPEN_PROOF' ? 2 : 1);
  const pointsBadge = `${pointsCount} pkt`;
  const instructionText = activeTask.instruction || '';
  const mathStatement = activeTask.math_statement || activeTask.question || '';

  const isShortOptions = normalizedOptions.every(opt => (opt.content_latex || '').length < 35 && !opt.content_latex.includes('\n'));

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/75 backdrop-blur-md flex items-center justify-center p-0 md:p-6 lg:p-8 select-none overflow-hidden animate-in fade-in duration-150">
      <div className={`w-full h-full md:h-[90vh] md:max-h-[850px] md:max-w-[760px] bg-slate-50 dark:bg-[#0B0F17] md:rounded-3xl md:border md:border-slate-200 md:dark:border-slate-800 md:shadow-2xl flex flex-col justify-between items-stretch overflow-hidden relative ${shakeIncorrect ? 'animate-quiz-shake' : ''}`}>
        
        {/* -------------------------------------------------------------------- */}
        {/* SECTION 1: HEADER (Zgodny z WCAG i trybem Zen Focus)                  */}
        {/* -------------------------------------------------------------------- */}
        <header className="shrink-0 px-4 pt-3 pb-2.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131B29] flex flex-col gap-2 z-20">
          <div className="flex items-center justify-between">
            {/* Przycisk zamknięcia */}
            <button 
              type="button"
              onClick={onCancelTask}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors active:scale-95 cursor-pointer"
              title="Zamknij zadanie"
            >
              <X size={15} />
            </button>

            {/* Badges: Punkty & Stopień trudności */}
            <div className="flex items-center gap-1.5">
              <Badge variant="amber">
                {pointsBadge}
              </Badge>
              {(activeTask.difficulty === 'Wymagające' || activeTask.difficulty === 'HARD' || activeTask.tags?.includes('Wymagające')) && (
                <Badge variant="rose">
                  Wymagające
                </Badge>
              )}
            </div>

            {/* Narzędzia: Przełącznik Zen/Focus Mode & Wskaźnik postępu */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  toggleZenMode();
                }}
                className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  zenMode 
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300' 
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
                title={zenMode ? 'Wyłącz Tryb Zen (Focus)' : 'Włącz Tryb Zen (Focus – czysty egzamin)'}
              >
                {zenMode ? <Eye size={14} /> : <EyeOff size={14} />}
                <span className="hidden sm:inline">{zenMode ? 'Zen: WŁ' : 'Zen'}</span>
              </button>

              {isRetryPhase ? (
                <Badge variant="rose" icon={<RotateCcw size={10} />}>
                  Poprawka: {currentTaskIndex + 1}/{practiceQueue.length}
                </Badge>
              ) : (
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  {currentTaskIndex + 1}/{practiceQueue.length}
                </span>
              )}
            </div>
          </div>

          {/* Pasek postępu lekcji (Amber 10%) */}
          {!zenMode && (
            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-amber-500 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(8, progressPercent))}%` }}
              />
            </div>
          )}
        </header>

        {/* -------------------------------------------------------------------- */}
        {/* SECTION 2: GŁÓWNA TREŚĆ ZADANIA (KARTA PYTANIA I MATERIAŁ)           */}
        {/* -------------------------------------------------------------------- */}
        <main 
          ref={mainScrollRef} 
          className="flex-1 min-h-0 overflow-y-auto px-4 pt-4 pb-3 flex flex-col justify-between items-stretch gap-3"
        >
          {/* Karta pytania egzaminacyjnego (Baza 60%, ramka 30%) */}
          <div className="depth-card rounded-2xl p-4 sm:p-5 flex flex-col gap-3 shrink-0">
            {/* Metadane CKE */}
            <div className="flex items-center gap-2 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 flex-wrap pb-1.5 border-b border-slate-100 dark:border-slate-800/80">
              <span className="font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide">
                {taskType === 'OPEN_PROOF' ? 'Zadanie Otwarte • Dowód' : 'Zadanie Egzaminacyjne'}
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {pointsBadge}
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="text-slate-600 dark:text-slate-400 font-medium">
                {activeTask.source || activeTask.cke_source || 'CKE Egzamin • Zadanie'}
              </span>
            </div>

            {/* Tekst polecenia / lektury / instrukcji */}
            {instructionText && (
              <div className="reading-prose text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                <MathRenderer content={instructionText} />
              </div>
            )}

            {/* Właściwa treść matematyczna / problemowa */}
            <div className="text-slate-900 dark:text-white font-bold text-base sm:text-lg leading-relaxed">
              <MathRenderer content={mathStatement} />
            </div>

            {/* Pasek narzędzi pomocniczych: Brudnopis i Podpowiedź */}
            <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setIsScratchpadOpen(true);
                  }}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl transition-all active:scale-95 cursor-pointer shadow-xs"
                >
                  <PenTool size={13} className="text-amber-500" />
                  <span>Brudnopis</span>
                  {scratchpadDataUrl.length > 50 && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Zawiera zapisane obliczenia" />
                  )}
                </button>

                {activeTask.hints?.level_1 && (
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setShowHintModal(true);
                    }}
                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl transition-all active:scale-95 cursor-pointer shadow-xs"
                  >
                    <Lightbulb size={13} className="text-amber-500" />
                    <span>Wskazówka CKE</span>
                  </button>
                )}
              </div>

              {taskType === 'MULTI_CHOICE' && (
                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                  Zaznaczono: <strong className="text-slate-900 dark:text-white font-bold">{selectedOptions.length}</strong> / {requiredCount}
                </span>
              )}
            </div>
          </div>

          {/* ------------------------------------------------------------------ */}
          {/* DYNAMICZNY MODUŁ ODPOWIEDZI (ABCD / WIELOKROTNY WYBÓR / OTWARTE)    */}
          {/* ------------------------------------------------------------------ */}

          {/* 1. SINGLE_CHOICE MODULE (Czyste karty ABCD, brak neonu) */}
          {taskType === 'SINGLE_CHOICE' && (
            <motion.div
              key={`single-options-${activeTask?.id || currentTaskIndex}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className={isShortOptions ? "grid grid-cols-2 gap-2 sm:gap-2.5 w-full my-auto" : "grid grid-cols-1 gap-2 w-full my-auto"}
            >
              {normalizedOptions.map(opt => {
                const isSelected = selectedOptions.includes(opt.id);
                const isOptionCorrect = opt.is_correct;

                let cardClasses = isShortOptions 
                  ? "h-[54px] sm:h-[58px] px-3.5 rounded-xl border text-left flex items-center gap-3 transition-all select-none overflow-hidden cursor-pointer shadow-xs "
                  : "p-3.5 sm:p-4 rounded-xl border text-left flex items-center gap-3.5 transition-all select-none cursor-pointer shadow-xs ";
                let badgeClasses = "w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center text-center leading-none shrink-0 border select-none ";

                if (!isEvaluated) {
                  if (isSelected) {
                    cardClasses += "bg-amber-50/90 dark:bg-amber-950/40 border-2 border-amber-500 text-slate-950 dark:text-white shadow-[0_4px_16px_rgba(245,158,11,0.22)] scale-[1.01]";
                    badgeClasses += "bg-amber-500 text-slate-950 border-amber-500 font-extrabold shadow-xs";
                  } else {
                    cardClasses += "bg-white dark:bg-[#131B29] hover:bg-slate-50 dark:hover:bg-slate-800/90 border-1.5 border-slate-300 dark:border-slate-800 hover:border-amber-500 dark:hover:border-slate-600 shadow-[0_4px_12px_rgba(15,23,42,0.08)] hover:shadow-[0_8px_20px_rgba(15,23,42,0.12)] text-slate-900 dark:text-slate-100";
                    badgeClasses += "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-bold";
                  }
                } else {
                  if (isOptionCorrect) {
                    cardClasses += "bg-emerald-50 dark:bg-emerald-950/30 border-2 border-emerald-500 text-emerald-950 dark:text-emerald-100 shadow-[0_4px_16px_rgba(16,185,129,0.15)]";
                    badgeClasses += "bg-emerald-500 text-white border-emerald-500 font-bold shadow-xs";
                  } else if (isSelected && !isOptionCorrect) {
                    cardClasses += "bg-rose-50 dark:bg-rose-950/30 border-2 border-rose-500 text-rose-950 dark:text-rose-100 shadow-[0_4px_16px_rgba(244,63,94,0.15)]";
                    badgeClasses += "bg-rose-500 text-white border-rose-500 font-bold shadow-xs";
                  } else {
                    cardClasses += "bg-white/40 dark:bg-[#131B29]/40 opacity-40 border-slate-200 dark:border-slate-800 text-slate-400";
                    badgeClasses += "bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-800";
                  }
                }

                return (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={isEvaluated}
                    onClick={() => handleSelectOption(opt.id)}
                    className={cardClasses}
                  >
                    <div className={badgeClasses}>
                      {opt.id}
                    </div>
                    <div className="flex-1 text-xs sm:text-sm font-semibold truncate overflow-x-auto">
                      <MathRenderer content={opt.content_latex} />
                    </div>
                    {!isEvaluated && (
                      <span className="hidden md:inline-flex items-center justify-center text-center text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-1.5 py-0.5 rounded leading-none mr-1 select-none shadow-2xs">
                        {opt.id}
                      </span>
                    )}
                    {isEvaluated && isOptionCorrect && (
                      <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                    )}
                    {isEvaluated && isSelected && !isOptionCorrect && (
                      <X size={18} className="text-rose-500 shrink-0" />
                    )}
                  </button>
                );
              })}
            </motion.div>
          )}

          {/* 2. MULTI_CHOICE MODULE */}
          {taskType === 'MULTI_CHOICE' && (
            <motion.div
              key={`multi-options-${activeTask?.id || currentTaskIndex}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="grid grid-cols-1 gap-2 w-full my-auto"
            >
              {normalizedOptions.map(opt => {
                const isSelected = selectedOptions.includes(opt.id);
                const isOptionCorrect = opt.is_correct;

                let cardClasses = "p-3.5 rounded-xl border text-left flex items-center gap-3.5 transition-all select-none cursor-pointer shadow-xs ";
                let checkboxClasses = "w-6 h-6 rounded-md font-bold text-xs flex items-center justify-center shrink-0 border ";

                if (!isEvaluated) {
                  if (isSelected) {
                    cardClasses += "bg-amber-50/80 dark:bg-amber-950/30 border-2 border-amber-500 text-slate-900 dark:text-white shadow-xs";
                    checkboxClasses += "bg-amber-500 text-slate-950 border-amber-500 font-extrabold";
                  } else {
                    cardClasses += "bg-white dark:bg-[#131B29] hover:bg-slate-50 dark:hover:bg-slate-800/90 border border-slate-200 dark:border-slate-800 hover:border-amber-500/80 dark:hover:border-slate-600 hover:shadow-xs text-slate-800 dark:text-slate-100";
                    checkboxClasses += "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700";
                  }
                } else {
                  if (isOptionCorrect) {
                    cardClasses += "bg-emerald-50 dark:bg-emerald-950/30 border-2 border-emerald-500 text-emerald-950 dark:text-emerald-100";
                    checkboxClasses += "bg-emerald-500 text-white border-emerald-500";
                  } else if (isSelected && !isOptionCorrect) {
                    cardClasses += "bg-rose-50 dark:bg-rose-950/30 border-2 border-rose-500 text-rose-950 dark:text-rose-100";
                    checkboxClasses += "bg-rose-500 text-white border-rose-500";
                  } else {
                    cardClasses += "bg-white/40 dark:bg-[#131B29]/40 opacity-40 border-slate-200 dark:border-slate-800 text-slate-400";
                    checkboxClasses += "bg-slate-100 dark:bg-slate-800 text-transparent border-slate-200 dark:border-slate-800";
                  }
                }

                return (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={isEvaluated}
                    onClick={() => handleSelectOption(opt.id)}
                    className={cardClasses}
                  >
                    <div className={checkboxClasses}>
                      {isSelected ? <Check size={14} className="stroke-[3]" /> : opt.id}
                    </div>
                    <div className="flex-1 text-xs sm:text-sm font-semibold leading-snug">
                      <MathRenderer content={opt.content_latex} />
                    </div>
                    {isEvaluated && isOptionCorrect && (
                      <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                    )}
                    {isEvaluated && isSelected && !isOptionCorrect && (
                      <X size={18} className="text-rose-500 shrink-0" />
                    )}
                  </button>
                );
              })}
            </motion.div>
          )}

          {/* 3. UNIVERSAL OPEN TASK WORKSPACE */}
          {(taskType === 'OPEN_TASK' || taskType === 'OPEN_PROOF' || taskType === 'NUMERIC_INPUT' || (taskType !== 'SINGLE_CHOICE' && taskType !== 'MULTI_CHOICE')) && (
            <OpenTaskWorkspace
              task={activeTask}
              isEvaluated={isEvaluated}
              isCorrect={isCorrect}
              value={numericValue}
              onChangeValue={(val) => {
                setNumericValue(val);
                setOpenProofText(val);
              }}
              savedCanvasDataUrl={scratchpadDataUrl}
              onSaveCanvasData={(dataUrl) => setScratchpadDataUrl(dataUrl)}
              onOpenScratchpad={() => setIsScratchpadOpen(true)}
              onSubmit={handleVerifyAnswer}
              onAskAiTutor={taskType === 'OPEN_PROOF' ? handleAskAiTutor : undefined}
            />
          )}
        </main>

        {/* -------------------------------------------------------------------- */}
        {/* SECTION 3: DOLNY PANEL EWALUACJI I PRZYCISK SPRAWDŹ (WCAG AA)        */}
        {/* -------------------------------------------------------------------- */}
        {!isEvaluated ? (
          <footer className="shrink-0 p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131B29] z-20 flex flex-col gap-2.5 pb-safe-bottom">
            {/* Przycisk Sprawdź: Zgodny z WCAG AA (Ciemny tusz text-slate-950 na żółci/bursztynie) */}
            <button
              type="button"
              disabled={!isReadyToVerify}
              onClick={handleVerifyAnswer}
              className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-2 select-none cursor-pointer ${
                isReadyToVerify
                  ? 'btn-depth-primary'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-300/40 dark:border-slate-700/60 cursor-not-allowed opacity-70'
              }`}
            >
              <span>SPRAWDŹ ODPOWIEDŹ</span>
              <span className="hidden md:inline-flex text-[10px] font-mono font-bold opacity-75 bg-slate-950/15 px-1.5 py-0.5 rounded">Enter ↵</span>
              <ArrowRight size={16} />
            </button>
          </footer>
        ) : (
          /* BOTTOM SHEET DLA OCENIONEJ ODPOWIEDZI */
          <motion.footer
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className={`shrink-0 p-4 sm:p-5 border-t z-30 flex flex-col gap-3 rounded-t-3xl shadow-xl max-h-[60vh] pb-safe-bottom ${
              isCorrect
                ? 'bg-emerald-50/95 dark:bg-[#0E1C1A] border-emerald-500/30'
                : 'bg-rose-50/95 dark:bg-[#181216] border-rose-500/30'
            }`}
          >
            {/* Header ewaluacji */}
            <div className="flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                  isCorrect ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                }`}>
                  {isCorrect ? <Check size={16} className="stroke-[3]" /> : <X size={16} className="stroke-[3]" />}
                </div>
                <span className={`font-display font-black text-base ${
                  isCorrect ? 'text-emerald-900 dark:text-emerald-200' : 'text-rose-900 dark:text-rose-200'
                }`}>
                  {isCorrect 
                    ? (isRetryPhase ? 'Poprawione! Świetna robota' : 'Poprawna odpowiedź!') 
                    : 'Niepoprawna odpowiedź'}
                </span>
              </div>

              <div>
                {isCorrect ? (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                    {isRetryPhase ? '+5 XP' : '+10 XP'}
                  </span>
                ) : (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-full">
                    Pętla powtórkowa
                  </span>
                )}
              </div>
            </div>

            {/* Przewijany kontener z rozwiązaniem krok po kroku */}
            <div ref={solutionRef} className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-2.5 pr-1 max-h-[30vh]">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <BookOpen size={13} className="text-amber-500" />
                  {isCorrect ? 'Oficjalny tok myślenia CKE:' : 'Wyjaśnienie i rozwiązanie:'}
                </span>
                {isCorrect && solutionSteps.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setShowSolutionSteps(!showSolutionSteps)}
                    className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>{showSolutionSteps ? 'Zwiń kroki' : `Wszystkie kroki (${solutionSteps.length})`}</span>
                    {showSolutionSteps ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                )}
              </div>

              {/* Kroki rozwiązania w czytelnych kartach */}
              {!isCorrect ? (
                <div className="flex flex-col gap-2">
                  {solutionSteps.map((step, idx) => (
                    <div
                      key={idx}
                      className="bg-white dark:bg-[#131B29] border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex flex-col gap-1.5 shadow-xs"
                    >
                      {Boolean(step.title || (step.label && !step.label.toLowerCase().includes('wyjaśnienie'))) && (
                        <div className="flex items-center gap-2 flex-wrap">
                          {step.label && !step.label.toLowerCase().includes('wyjaśnienie') && (
                            <span className="bg-amber-500/10 text-amber-800 dark:text-amber-400 font-bold text-[10px] px-2 py-0.5 rounded-md border border-amber-500/20 uppercase">
                              {step.label}
                            </span>
                          )}
                          {step.title && (
                            <span className="font-bold text-slate-900 dark:text-white text-xs leading-snug">
                              {step.title}
                            </span>
                          )}
                        </div>
                      )}
                      <div className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed overflow-x-auto pl-0.5">
                        <MathRenderer content={step.content} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="bg-white dark:bg-[#131B29] border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex flex-col gap-1 shadow-xs">
                    {solutionSteps[0]?.title && (
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-slate-900 dark:text-white text-xs">{solutionSteps[0].title}</span>
                      </div>
                    )}
                    <div className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed overflow-x-auto">
                      <MathRenderer content={solutionSteps[0]?.content || activeTask.explanation || 'Poprawna odpowiedź.'} />
                    </div>
                  </div>

                  <AnimatePresence>
                    {showSolutionSteps && solutionSteps.length > 1 && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="space-y-2 pt-1"
                      >
                        {solutionSteps.slice(1).map((step, idx) => (
                          <div
                            key={idx}
                            className="bg-white dark:bg-[#131B29] border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex flex-col gap-1 shadow-xs"
                          >
                            {step.title && (
                              <span className="font-bold text-slate-900 dark:text-white text-xs">{step.title}</span>
                            )}
                            <div className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed overflow-x-auto">
                              <MathRenderer content={step.content} />
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Przycisk akcji przejścia do następnego pytania */}
            <button
              type="button"
              onClick={handleNextQuestion}
              className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-2 group shrink-0 cursor-pointer ${
                isCorrect
                  ? 'btn-depth-primary'
                  : 'btn-depth-secondary bg-slate-900 hover:bg-slate-800 dark:bg-rose-600 dark:hover:bg-rose-500 text-white border-slate-700 dark:border-rose-700'
              }`}
            >
              <span>
                {currentTaskIndex < practiceQueue.length - 1 
                  ? 'Następne zadanie' 
                  : (!isRetryPhase && mistakesBuffer.length > 0)
                    ? 'Przejdź do powtórki'
                    : 'Ukończ lekcję'}
              </span>
              <span className="hidden md:inline-flex text-[10px] font-mono font-bold opacity-75 bg-black/20 px-1.5 py-0.5 rounded">Spacja ␣</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.footer>
        )}

        {/* -------------------------------------------------------------------- */}
        {/* PŁYWAJĄCY TUTOR AI (Dyskretna pigułka / Floating Pill w rogu)        */}
        {/* -------------------------------------------------------------------- */}
        {taskType === 'OPEN_PROOF' && !isEvaluated && !showOpenProofTutorSheet && (
          <button
            type="button"
            onClick={handleAskAiTutor}
            className="fixed bottom-24 right-5 sm:bottom-28 sm:right-8 z-40 bg-white dark:bg-[#131B29] border border-amber-500/40 text-slate-900 dark:text-white px-3.5 py-2 rounded-full shadow-lg flex items-center gap-2 text-xs font-bold hover:scale-105 active:scale-95 transition-all cursor-pointer"
            title="Zapytaj Sokratejskiego Tutora AI o naprowadzenie na właściwy krok"
          >
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <Bot size={15} className="text-amber-500" />
            <span>Tutor AI</span>
          </button>
        )}

        {/* CKE SCRATCHPAD BOTTOM SHEET */}
        <CkeScratchpad
          isOpen={isScratchpadOpen}
          onClose={() => setIsScratchpadOpen(false)}
          savedDataUrl={scratchpadDataUrl}
          onSaveData={(dataUrl) => setScratchpadDataUrl(dataUrl)}
          isOpenProof={taskType === 'OPEN_PROOF'}
          taskQuestion={activeTask.math_statement || activeTask.question}
          taskInstruction={activeTask.instruction}
          staticHint={activeTask.hints?.level_1}
          studentText={openProofText}
        />

        {/* STATIC HINT MODAL */}
        <AnimatePresence>
          {showHintModal && (
            <div className="fixed inset-0 z-50 flex flex-col justify-end pointer-events-auto">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowHintModal(false)}
                className="absolute inset-0 bg-slate-900/60 dark:bg-black/70 backdrop-blur-xs"
              />

              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 26, stiffness: 300 }}
                className="relative z-10 w-full max-w-xl mx-auto bg-white dark:bg-[#131B29] border-t border-slate-200 dark:border-slate-800 rounded-t-3xl p-5 shadow-2xl flex flex-col gap-4 pb-safe-bottom"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lightbulb size={18} className="text-amber-500" />
                    <span className="font-display font-bold text-slate-900 dark:text-white text-base">
                      Wskazówki CKE do zadania
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowHintModal(false)}
                    className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>

                <div className="bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-xs text-slate-800 dark:text-slate-200 leading-relaxed shadow-xs">
                  <div className="font-bold text-amber-600 dark:text-amber-400 mb-1 flex items-center gap-1">
                    <span>Wskazówka (Karta Wzorów CKE):</span>
                  </div>
                  <MathRenderer content={activeTask.hints?.level_1 || 'Zwróć uwagę na sprowadzenie wyrażeń do wspólnej postaci i odpowiednie wzory maturalne.'} />
                </div>

                {unlockedHintLevel >= 2 ? (
                  <div className="bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-xs text-slate-800 dark:text-slate-200 leading-relaxed shadow-xs">
                    <div className="font-bold text-amber-600 dark:text-amber-400 mb-1 flex items-center gap-1">
                      <span>Krok rozwiązania:</span>
                    </div>
                    <MathRenderer content={activeTask.hints?.level_2 || 'Podstaw odpowiednie wzory skróconego mnożenia lub twierdzenia o potęgach i logarytmach.'} />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setUnlockedHintLevel(2);
                    }}
                    className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-xs font-bold text-slate-700 dark:text-slate-200 transition-all text-center cursor-pointer shadow-xs"
                  >
                    Odblokuj kolejny krok (Poziom 2)
                  </button>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* SOCRATIC AI TUTOR BOTTOM SHEET */}
        <AnimatePresence>
          {taskType === 'OPEN_PROOF' && showOpenProofTutorSheet && (
            <div className="fixed inset-0 z-50 flex flex-col justify-end pointer-events-auto">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowOpenProofTutorSheet(false)}
                className="absolute inset-0 bg-slate-900/60 dark:bg-black/70 backdrop-blur-xs"
              />

              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 26, stiffness: 300 }}
                className="relative z-10 w-full max-w-xl mx-auto max-h-[40vh] bg-white dark:bg-[#131B29] border-t border-slate-200 dark:border-slate-800 rounded-t-3xl p-4 sm:p-5 shadow-2xl flex flex-col gap-3 overflow-y-auto pb-safe-bottom"
              >
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Bot size={18} className="text-amber-500" />
                    <span className="font-display font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                      Wskazówka Sokratejskiego Tutora AI
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowOpenProofTutorSheet(false)}
                    className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>

                <div className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed py-1">
                  {isAiLoading ? (
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 py-3 font-semibold">
                      <Loader2 size={16} className="animate-spin" />
                      <span>Tutor analizuje Twoje rozumowanie i szuka kluczowego kroku...</span>
                    </div>
                  ) : (
                    <MathRenderer content={aiTutorResponse || activeTask.hints?.level_1 || 'Zwróć uwagę na rozkład na czynniki lub wyłączenie wspólnego składnika przed nawias.'} />
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
