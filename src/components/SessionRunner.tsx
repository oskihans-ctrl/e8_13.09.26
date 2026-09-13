import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  BookOpen, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  ArrowLeft,
  Sparkles, 
  Trophy, 
  Flame, 
  Coins, 
  Star, 
  RotateCcw, 
  Check, 
  Info,
  Clock,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { playSuccessSound, playErrorSound, triggerHaptic } from '../utils';
import { MathRenderer } from './MathRenderer';
import { Badge } from './Badge';
import { UserState, LessonTheoryPill } from '../types';
import { LessonFormulaSheet, drawSessionTasks, getLessonTheoryPill, getLessonTaskPool } from '../data/dzial1TaskPool';
import { addMistakeToBank, removeMistakeFromBank } from '../utils/mistakesBank';

/**
 * Helper to render micro-article text containing markdown bold (**bold**) and LaTeX ($...$)
 */
function renderMicroContent(rawText?: string) {
  if (!rawText) return null;
  const parts = rawText.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, index) => {
        if (!part) return null;
        if (part.startsWith('**') && part.endsWith('**')) {
          const boldText = part.slice(2, -2);
          return (
            <strong key={index} className="font-bold text-white">
              <MathRenderer content={boldText} />
            </strong>
          );
        }
        return <MathRenderer key={index} content={part} />;
      })}
    </>
  );
}

export interface SessionRunnerProps {
  sessionData: {
    lessonId: string;
    lessonTitle: string;
    tasks: any[];
    formulaSheet?: LessonFormulaSheet | null;
    theoryPill?: LessonTheoryPill | null;
    nextLesson?: any;
    allTaskIdsToMarkCompleted?: string[];
  };
  userState?: UserState;
  onCompleteSession: (
    taskIds?: string | string[],
    stars?: number,
    earnedXp?: number,
    earnedCoins?: number,
    nextLesson?: any,
    sessionDurationSeconds?: number
  ) => void;
  onCancelSession: () => void;
}

export const SessionRunner: React.FC<SessionRunnerProps> = ({
  sessionData,
  userState,
  onCompleteSession,
  onCancelSession
}) => {
  const {
    lessonId = '1.1',
    lessonTitle = 'Lekcja 1.1',
    tasks = [],
    formulaSheet,
    nextLesson,
    allTaskIdsToMarkCompleted = []
  } = sessionData;

  // Mastery Learning: Każda lekcja wymaga zdobycia dokładnie 4 poprawnych odpowiedzi
  const TARGET_CORRECT_ANSWERS = 4;
  const [taskQueue, setTaskQueue] = useState<any[]>(() => {
    if (tasks && tasks.length >= 4) return [...tasks];
    const pool = getLessonTaskPool(lessonId);
    if (pool.length > 0) {
      const drawn = drawSessionTasks(lessonId);
      return drawn.sessionTasks.length > 0 ? drawn.sessionTasks : [...tasks];
    }
    return [...tasks];
  });
  const [currentQueueIndex, setCurrentQueueIndex] = useState<number>(0);
  const [currentStep, setCurrentStep] = useState<number>(0); // 0: Pigułka wiedzy, 1: Zadania
  const [theorySubStep, setTheorySubStep] = useState<number>(0); // 0: Istota i Strategia, 1: Wzory, 2: Przykład i Pułapka
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isEvaluated, setIsEvaluated] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  // Active Time Tracking Engine: Tracks active study time with 120s inactivity & visibility auto-pause
  const [activeSeconds, setActiveSeconds] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const lastActivityRef = React.useRef<number>(Date.now());

  // Theory Pill resolution: provided in payload or fetched from lesson curriculum
  const theoryPill: LessonTheoryPill = useMemo(() => {
    if (sessionData.theoryPill) return sessionData.theoryPill;
    return getLessonTheoryPill(lessonId);
  }, [sessionData.theoryPill, lessonId]);

  // AI Tutor for Open Tasks
  const [openAnswerText, setOpenAnswerText] = useState<string>('');
  const [isTutorScanning, setIsTutorScanning] = useState<boolean>(false);
  const [tutorEvaluation, setTutorEvaluation] = useState<any | null>(null);
  const [showModelSolution, setShowModelSolution] = useState<boolean>(false);

  // Statistics: postęp mierzony liczbą poprawnych odpowiedzi (wymóg: 4)
  const [correctAnswersCount, setCorrectAnswersCount] = useState<number>(0);
  const [earnedXp, setEarnedXp] = useState<number>(0);
  const [earnedCoins, setEarnedCoins] = useState<number>(0);

  // Modals & Drawers
  const [showExitModal, setShowExitModal] = useState<boolean>(false);
  const [showFormulaSheet, setShowFormulaSheet] = useState<boolean>(false);
  const [isSessionComplete, setIsSessionComplete] = useState<boolean>(false);

  // Scroll Container Ref do resetowania pozycji przewijania przy każdym nowym kroku
  const taskAreaRef = React.useRef<HTMLElement>(null);

  const isTheoryStep = currentStep === 0;
  const currentTask = taskQueue[currentQueueIndex] || taskQueue[0] || tasks[0];
  const isOpenTask = currentTask?.type === 'OPEN_PROOF' || (!currentTask?.options || currentTask?.options.length === 0);

  // Reset pozycji przewijania do samej góry przy przejściu do nowego kroku lub podkarty teorii
  useEffect(() => {
    if (taskAreaRef.current) {
      taskAreaRef.current.scrollTop = 0;
    }
  }, [currentStep, theorySubStep]);

  // Active Time Tracking Listener
  useEffect(() => {
    const markActive = () => {
      lastActivityRef.current = Date.now();
      if (isPaused && document.visibilityState === 'visible') {
        setIsPaused(false);
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        setIsPaused(true);
      } else {
        lastActivityRef.current = Date.now();
        setIsPaused(false);
      }
    };

    window.addEventListener('mousemove', markActive, { passive: true });
    window.addEventListener('mousedown', markActive, { passive: true });
    window.addEventListener('keydown', markActive, { passive: true });
    window.addEventListener('touchstart', markActive, { passive: true });
    window.addEventListener('scroll', markActive, { passive: true });
    document.addEventListener('visibilitychange', handleVisibility);

    const timer = setInterval(() => {
      if (isSessionComplete) return;

      const idleDuration = Date.now() - lastActivityRef.current;
      const isHidden = document.visibilityState === 'hidden';

      if (idleDuration > 120000 || isHidden) {
        setIsPaused(true);
      } else {
        setIsPaused(false);
        setActiveSeconds(prev => prev + 1);
      }
    }, 1000);

    return () => {
      clearInterval(timer);
      window.removeEventListener('mousemove', markActive);
      window.removeEventListener('mousedown', markActive);
      window.removeEventListener('keydown', markActive);
      window.removeEventListener('touchstart', markActive);
      window.removeEventListener('scroll', markActive);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [isSessionComplete, isPaused]);

  const formattedSessionTime = useMemo(() => {
    const m = Math.floor(activeSeconds / 60);
    const s = activeSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }, [activeSeconds]);

  const formatSourceTag = (source?: string, points?: number, isOpen?: boolean) => {
    if (!source) return `CKE Egzamin Ósmoklasisty • Zadanie 1 • ${points || (isOpen ? 2 : 1)} pkt`;
    const pts = points || (isOpen ? 2 : 1);
    if (source.toLowerCase().includes('pkt')) return source;
    return `${source} • ${pts} pkt`;
  };

  // Reset state on step change
  useEffect(() => {
    setSelectedOption(null);
    setOpenAnswerText('');
    setIsTutorScanning(false);
    setTutorEvaluation(null);
    setShowModelSolution(false);
    setIsEvaluated(false);
    setIsCorrect(null);
    if (currentStep === 0) {
      setTheorySubStep(0);
    }
  }, [currentStep]);

  // Reset entire session state when lessonId changes (e.g. proceeding to next lesson)
  useEffect(() => {
    setCurrentStep(0);
    setTheorySubStep(0);
    setActiveSeconds(0);
    setIsPaused(false);
    setSelectedOption(null);
    setOpenAnswerText('');
    setIsTutorScanning(false);
    setTutorEvaluation(null);
    setShowModelSolution(false);
    setIsEvaluated(false);
    setIsCorrect(null);
    setCorrectAnswersCount(0);
    setEarnedXp(0);
    setEarnedCoins(0);
    setShowExitModal(false);
    setShowFormulaSheet(false);
    setIsSessionComplete(false);
  }, [lessonId]);

  // Dynamically resolve next lesson in chain (e.g. 1.1 -> 1.2 -> ... -> 1.7)
  const resolvedNextLesson = useMemo(() => {
    if (nextLesson && nextLesson.isSession && nextLesson.tasks && nextLesson.tasks.length > 0) {
      return nextLesson;
    }

    // Try auto-resolving next lesson in Dział 1: Liczby Rzeczywiste
    const match = String(lessonId).match(/^(?:lesson-)?(\d+)\.(\d+)$/);
    if (match) {
      const topicNum = parseInt(match[1], 10);
      const lessonNum = parseInt(match[2], 10);
      if (topicNum === 1 && lessonNum < 7) {
        const nextId = `1.${lessonNum + 1}`;
        const poolResult = drawSessionTasks(nextId);
        if (poolResult.sessionTasks && poolResult.sessionTasks.length > 0) {
          const titles: Record<string, string> = {
            '1.1': 'Lekcja 1.1: Potęgi i wykładniki',
            '1.2': 'Lekcja 1.2: Pierwiastki i działania',
            '1.3': 'Lekcja 1.3: Logarytmy i ich własności',
            '1.4': 'Lekcja 1.4: Procenty i punkty procentowe',
            '1.5': 'Lekcja 1.5: Wartość bezwzględna i oś liczbowa',
            '1.6': 'Lekcja 1.6: Błąd bezwzględny, względny i szacowanie',
            '1.7': 'Lekcja 1.7: Wielki Sprawdzian Działu 1'
          };
          return {
            isSession: true,
            lessonId: nextId,
            lessonTitle: titles[nextId] || `Lekcja ${nextId}`,
            tasks: poolResult.sessionTasks,
            formulaSheet: poolResult.formulaSheet,
            allTaskIdsToMarkCompleted: poolResult.sessionTasks.map((t: any) => t.id),
            nextLesson: lessonNum + 1 < 7 ? {
              isSession: true,
              lessonId: `1.${lessonNum + 2}`
            } : null
          };
        }
      }
    }

    // Fallback: if nextLesson provided with tasks
    if (nextLesson) {
      return {
        isSession: true,
        lessonId: nextLesson.lessonId || nextLesson.id || 'next',
        lessonTitle: nextLesson.lessonTitle || nextLesson.title || 'Kolejna Lekcja',
        tasks: nextLesson.tasks || nextLesson.lessonTasks || nextLesson.allTasks || (nextLesson.firstTask ? [nextLesson.firstTask] : []),
        formulaSheet: nextLesson.formulaSheet || null,
        nextLesson: nextLesson.nextLesson || null
      };
    }

    return null;
  }, [lessonId, nextLesson]);

  // Keyboard navigation for desktop: 1-4 / A-D to select, Enter/Space to check or proceed
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showExitModal || isSessionComplete) return;

      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT')) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          e.preventDefault();
          if (!isEvaluated && !isTutorScanning && openAnswerText.trim()) {
            handleCheckOpenAnswerWithTutor();
          }
        }
        return;
      }

      const key = e.key.toUpperCase();
      const code = e.code;

      // Handle Option Selection (1, 2, 3, 4 or A, B, C, D)
      if (!isEvaluated && currentTask?.options && !isOpenTask) {
        let chosenOptionId: string | null = null;
        if (key === '1' || key === 'A') {
          chosenOptionId = currentTask.options[0]?.id || 'A';
        } else if (key === '2' || key === 'B') {
          chosenOptionId = currentTask.options[1]?.id || 'B';
        } else if (key === '3' || key === 'C') {
          chosenOptionId = currentTask.options[2]?.id || 'C';
        } else if (key === '4' || key === 'D') {
          chosenOptionId = currentTask.options[3]?.id || 'D';
        }

        if (chosenOptionId) {
          e.preventDefault();
          handleSelectOption(chosenOptionId);
          return;
        }
      }

      // Handle Check or Next Step (Enter or Space)
      if (key === 'ENTER' || code === 'Space') {
        e.preventDefault();
        if (isTheoryStep) {
          triggerHaptic('medium');
          playSuccessSound();
          setCurrentStep(1);
          return;
        }
        if (!isEvaluated) {
          if (isOpenTask) {
            if (openAnswerText.trim() && !isTutorScanning) {
              handleCheckOpenAnswerWithTutor();
            }
          } else if (selectedOption) {
            handleCheckAnswer();
          }
        } else if (isEvaluated) {
          handleNextStep();
        }
        return;
      }

      // Handle Formula Sheet Toggle (F or W)
      if (key === 'F' || key === 'W') {
        e.preventDefault();
        setShowFormulaSheet(prev => !prev);
        return;
      }

      // Handle Escape (Exit modal)
      if (key === 'ESCAPE') {
        e.preventDefault();
        if (showFormulaSheet) {
          setShowFormulaSheet(false);
        } else {
          setShowExitModal(prev => !prev);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEvaluated, selectedOption, openAnswerText, isTutorScanning, isOpenTask, currentTask, showExitModal, isSessionComplete, showFormulaSheet]);

  // Handle option click
  const handleSelectOption = (optionId: string) => {
    if (isEvaluated) return;
    triggerHaptic('light');
    setSelectedOption(optionId);
  };

  // Check answer for standard multiple-choice tasks
  const handleCheckAnswer = () => {
    if (!selectedOption || isEvaluated) return;

    const taskCorrectId = currentTask?.correct_answer || 'A';
    const correct = selectedOption === taskCorrectId;

    setIsEvaluated(true);
    setIsCorrect(correct);

    if (correct) {
      triggerHaptic('success');
      playSuccessSound();
      setCorrectAnswersCount(prev => prev + 1);
      setEarnedXp(prev => prev + 10);
      setEarnedCoins(prev => prev + 3);

      if (currentTask?.id) {
        removeMistakeFromBank(currentTask.id);
      }

      try {
        confetti({
          particleCount: 28,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#10B981', '#06B6D4', '#3B82F6', '#F59E0B']
        });
      } catch (e) {}
    } else {
      triggerHaptic('error');
      playErrorSound();
      setEarnedXp(prev => prev + 2); // Small effort XP

      if (currentTask?.id) {
        addMistakeToBank(currentTask.id);
      }

      // Zasada Mastery Learning: błędna odpowiedź nie przesuwa paska postępu,
      // a zadanie (lub inne wylosowane z tej samej lekcji) trafia na koniec kolejki
      const lessonPool = getLessonTaskPool(lessonId);
      const usedIds = taskQueue.map((t: any) => t.id);
      const unusedInPool = lessonPool.filter((t: any) => !usedIds.includes(t.id));
      if (unusedInPool.length > 0) {
        const nextPoolTask = unusedInPool[0];
        const formattedTask = {
          ...currentTask,
          id: nextPoolTask.id,
          title: `Zadanie powtórkowe • ${nextPoolTask.tierLabel}`,
          instruction: nextPoolTask.instruction || 'Dokończ zdanie. Wybierz właściwą odpowiedź spośród podanych.',
          math_statement: nextPoolTask.question,
          question: nextPoolTask.question,
          options: nextPoolTask.options || [],
          correct_answer: nextPoolTask.correct_answer,
          numeric_correct_answer: nextPoolTask.correct_answer,
          explanation: nextPoolTask.explanation,
          officialKey: nextPoolTask.officialKey || nextPoolTask.explanation,
          hints: {
            level_1: nextPoolTask.hint_1,
            level_2: nextPoolTask.hint_2
          },
          isRetry: true
        };
        setTaskQueue(prev => [...prev, formattedTask]);
      } else {
        setTaskQueue(prev => [...prev, { ...currentTask, isRetry: true }]);
      }
    }
  };

  // Check open task answer with AI Tutor
  const handleCheckOpenAnswerWithTutor = async () => {
    if (!openAnswerText.trim() || isTutorScanning || isEvaluated) return;

    setIsTutorScanning(true);
    triggerHaptic('medium');

    let evalData: any = null;

    try {
      const response = await fetch('/api/evaluate-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: currentTask?.question || currentTask?.math_statement,
          officialKey: currentTask?.officialKey || currentTask?.explanation,
          studentAnswer: openAnswerText,
          taskType: 'OPEN_PROOF',
          maxPoints: currentTask?.points || 2,
          ai_tutor_rubric: currentTask?.ai_tutor_rubric,
          attemptCount: 1
        })
      });

      if (response.ok) {
        evalData = await response.json();
      } else {
        console.warn('AI Tutor response not OK, using client-side rubric evaluation');
      }
    } catch (err) {
      console.warn('AI Tutor service unavailable, activating client-side evaluation fallback');
    }

    // If server evaluation didn't succeed, generate resilient rubric evaluation
    if (!evalData) {
      const text = openAnswerText.toLowerCase();
      const hasAlgebraProgress = 
        text.includes('3n^2') || 
        text.includes('3n²') || 
        text.includes('4n(n+1)') || 
        text.includes('4k(k+1)') || 
        text.includes('4k(') || 
        text.includes('4n(') || 
        text.includes('5(n-1)') || 
        text.includes('5n(') || 
        text.includes('2^96') || 
        text.includes('2^{96}') || 
        text.includes('2^20') || 
        text.includes('2^{20}') || 
        text.includes('2k') ||
        text.includes('wyłącz') || 
        text.includes('wspólny') ||
        text.includes('rozł') || 
        text.includes('kwadrat') || 
        text.includes('iloczyn') ||
        text.includes('reszt');

      const hasConclusion = 
        text.includes('podziel') || 
        text.includes('całkowit') || 
        text.includes('wniosek') || 
        text.includes('udowodnion') || 
        text.includes('cnd') || 
        text.includes('c.n.d') || 
        text.includes('reszta 2') || 
        text.includes('8k') || 
        text.includes('30k') || 
        text.includes('21k') || 
        text.includes('k \\in') || 
        text.includes('c \\in') || 
        text.includes('n \\in');

      let fallbackScore = 0;
      if (hasAlgebraProgress && hasConclusion) {
        fallbackScore = 2;
      } else if (hasAlgebraProgress || text.length > 25) {
        fallbackScore = 1;
      }

      evalData = {
        score: fallbackScore,
        maxPoints: currentTask?.points || 2,
        isPassed: fallbackScore >= 1,
        gradeTitle: fallbackScore === 2 
          ? '2 / 2 PKT – Pełny dowód i wniosek' 
          : (fallbackScore === 1 ? '1 / 2 PKT – Zasadniczy postęp' : '0 / 2 PKT – Próba rozwiązania'),
        summary: fallbackScore === 2 
          ? (currentTask?.ai_tutor_rubric?.criterion_2_points || 'Perfekcyjne rozwiązanie! Odpowiedź w pełni zgodna ze schematem maturalnym.')
          : fallbackScore === 1 
          ? (currentTask?.ai_tutor_rubric?.criterion_1_point || 'Zasadniczy postęp w dowodzie. Poprawne przekształcenie algebraiczne.')
          : 'Dowód wymaga dopracowania kluczowych przekształceń algebraicznych.',
        strengths: fallbackScore >= 1 ? ['Podjęto poprawną metodę algebraiczną', 'Zastosowano rozkład na czynniki'] : [],
        errors: fallbackScore < 2 ? ['Pamiętaj o formalnym wniosku końcowym powołującym się na podzielność przez liczbę całkowitą'] : [],
        maturaFeedback: fallbackScore === 2 
          ? 'Egzaminator maturalny przyznaje pełne 2 punkty za kompletny dowód i prawidłowy wniosek.'
          : fallbackScore === 1 
          ? 'Egzaminator maturalny docenia poprawny tok algebraiczny. Do pełnych 2 punktów sformułuj precyzyjny wniosek końcowy.'
          : 'Brak kluczowego przekształcenia algebraicznego. Spróbuj wyłączyć wspólny czynnik przed nawias.',
        ckeFeedback: fallbackScore === 2 
          ? 'Egzaminator maturalny przyznaje pełne 2 punkty za kompletny dowód i prawidłowy wniosek.'
          : fallbackScore === 1 
          ? 'Egzaminator maturalny docenia poprawny tok algebraiczny. Do pełnych 2 punktów sformułuj precyzyjny wniosek końcowy.'
          : 'Brak kluczowego przekształcenia algebraicznego. Spróbuj wyłączyć wspólny czynnik przed nawias.',
        suggestion: 'Zapoznaj się z wzorcowym modelem rozwiązania poniżej.',
        hintForNextAttempt: ''
      };
    }

    setTutorEvaluation(evalData);
    setIsEvaluated(true);
    setIsTutorScanning(false);

    const passed = evalData.isPassed ?? (evalData.score >= 1);
    setIsCorrect(passed);

    if (evalData.score >= (currentTask?.points || 2)) {
      triggerHaptic('success');
      playSuccessSound();
      setCorrectAnswersCount(prev => prev + 1);
      setEarnedXp(prev => prev + 25);
      setEarnedCoins(prev => prev + 8);
      if (currentTask?.id) removeMistakeFromBank(currentTask.id);
      try {
        confetti({
          particleCount: 35,
          spread: 70,
          origin: { y: 0.8 },
          colors: ['#10B981', '#06B6D4', '#F59E0B']
        });
      } catch (e) {}
    } else if (evalData.score > 0) {
      triggerHaptic('medium');
      playSuccessSound();
      setCorrectAnswersCount(prev => prev + 1);
      setEarnedXp(prev => prev + 15);
      setEarnedCoins(prev => prev + 4);
      if (currentTask?.id) removeMistakeFromBank(currentTask.id);
    } else {
      triggerHaptic('error');
      playErrorSound();
      setEarnedXp(prev => prev + 3);
      if (currentTask?.id) addMistakeToBank(currentTask.id);

      // Re-queue open task
      const lessonPool = getLessonTaskPool(lessonId);
      const usedIds = taskQueue.map((t: any) => t.id);
      const unusedInPool = lessonPool.filter((t: any) => !usedIds.includes(t.id));
      if (unusedInPool.length > 0) {
        const nextPoolTask = unusedInPool[0];
        setTaskQueue(prev => [...prev, {
          ...currentTask,
          id: nextPoolTask.id,
          question: nextPoolTask.question,
          math_statement: nextPoolTask.question,
          explanation: nextPoolTask.explanation,
          officialKey: nextPoolTask.officialKey || nextPoolTask.explanation,
          isRetry: true
        }]);
      } else {
        setTaskQueue(prev => [...prev, { ...currentTask, isRetry: true }]);
      }
    }
  };

  // Next step or finish – Mastery Learning (wymóg 4 poprawnych odpowiedzi)
  const handleNextStep = () => {
    if (isTheoryStep) {
      if (!taskQueue || taskQueue.length === 0) {
        setIsSessionComplete(true);
        setEarnedXp(prev => Math.max(prev, 15));
        setEarnedCoins(prev => Math.max(prev, 5));
        return;
      }
      setCurrentStep(1);
      setCurrentQueueIndex(0);
      setSelectedOption(null);
      setIsEvaluated(false);
      setIsCorrect(null);
      return;
    }

    if (correctAnswersCount >= TARGET_CORRECT_ANSWERS) {
      // Zdobyto 4 poprawne odpowiedzi – lekcja zaliczona!
      setIsSessionComplete(true);
      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.5 },
          colors: ['#10B981', '#06B6D4', '#F59E0B', '#8B5CF6']
        });
      } catch (e) {}
    } else {
      // Przejdź do kolejnego zadania z kolejki
      setCurrentQueueIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsEvaluated(false);
      setIsCorrect(null);
      setOpenAnswerText('');
      setTutorEvaluation(null);
      setShowModelSolution(false);
    }
  };

  // Final finish - Always marks lesson completed and returns to learning map
  const handleFinishSession = (_goToNextLesson = false) => {
    const finalEarnedXp = Math.max(40, earnedXp + 20);
    const finalEarnedCoins = Math.max(15, earnedCoins + 6);

    // Zdobyto bezwzględnie 4 poprawne odpowiedzi -> 3 gwiazdki
    const stars = 3;

    const cleanLessonId = lessonId.replace('lesson-', '');
    // All task IDs in current session plus lesson completion tags
    const completedIds = [
      `LESSON-${lessonId}`,
      `LESSON-${cleanLessonId}`,
      `LESSON-${lessonId.toLowerCase()}`,
      ...taskQueue.map(t => t.id),
      ...allTaskIdsToMarkCompleted
    ];

    onCompleteSession(completedIds, stars, finalEarnedXp, finalEarnedCoins, null, activeSeconds);
  };

  // Render Celebration Screen - Unified 150ms fade-in, zero CLS/stagger jitter
  if (isSessionComplete) {
    const totalTasksCount = TARGET_CORRECT_ANSWERS;
    const finalScorePct = 100;
    const calculatedXp = Math.max(35, earnedXp + 20);
    const calculatedCoins = Math.max(12, earnedCoins + 6);
    const streakDays = (userState?.streakDays || 0) + 1;

    return (
      <div 
        id="session-celebration-screen"
        className="fixed inset-0 z-50 bg-[#070A0F]/95 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 text-white select-none overflow-y-auto"
      >
        <div className="w-full max-w-md bg-[#0B0F19] rounded-3xl border border-white/10 flex flex-col items-center justify-center p-6 sm:p-8 text-white select-none relative shadow-2xl my-auto">
          <div className="w-full flex flex-col items-center justify-center text-center">
            
            {/* 1. Profesjonalny puchar Lucide Trophy w złotym okręgu sukcesu */}
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="relative mt-2 mb-6 flex items-center justify-center"
            >
              {/* Radial ambient glow */}
              <div className="absolute w-44 h-44 rounded-full bg-sky-500/20 blur-2xl pointer-events-none" />
              <div className="absolute w-36 h-36 rounded-full border border-sky-400/20 animate-spin pointer-events-none" style={{ animationDuration: '24s' }} />

              {/* Glowing blue success circle with centered Lucide Trophy */}
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-sky-400/25 via-blue-500/15 to-cyan-600/20 flex items-center justify-center border-2 border-sky-400/80 shadow-[0_0_40px_rgba(14,165,233,0.4)] z-10">
                <Trophy size={50} className="text-sky-400 drop-shadow-md shrink-0" strokeWidth={2} />
              </div>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2"
            >
              Lekcja {lessonId.replace('lesson-', '')} ukończona!
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="text-slate-400 text-sm sm:text-base max-w-xs mb-5"
            >
              Świetna robota! Opanowałeś kolejną porcję pewniaków egzaminacyjnych E8 z Działu 1.
            </motion.p>

            {/* 2. Równy rozmiar 4 kafelków: XP, Monety, Seria, Czas Sesji */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="w-full grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5"
            >
              <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-3 flex flex-col items-center justify-center min-h-[90px] shadow-sm">
                <div className="w-7 h-7 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center mb-1 text-cyan-400">
                  <Star className="w-3.5 h-3.5" />
                </div>
                <span className="text-lg sm:text-xl font-bold text-white tracking-tight leading-tight">+{calculatedXp}</span>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mt-0.5">XP</span>
              </div>

              <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-3 flex flex-col items-center justify-center min-h-[90px] shadow-sm">
                <div className="w-7 h-7 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center mb-1 text-sky-400">
                  <Coins className="w-3.5 h-3.5" />
                </div>
                <span className="text-lg sm:text-xl font-bold text-white tracking-tight leading-tight">+{calculatedCoins}</span>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mt-0.5">Monet</span>
              </div>

              <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-3 flex flex-col items-center justify-center min-h-[90px] shadow-sm">
                <div className="w-7 h-7 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center mb-1 text-orange-400">
                  <Flame className="w-3.5 h-3.5" />
                </div>
                <span className="text-lg sm:text-xl font-bold text-white tracking-tight leading-tight">{streakDays} dni</span>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mt-0.5">Seria</span>
              </div>

              <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-3 flex flex-col items-center justify-center min-h-[90px] shadow-sm">
                <div className="w-7 h-7 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mb-1 text-emerald-400">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <span className="text-lg sm:text-xl font-bold text-white tracking-tight leading-tight">{formattedSessionTime}</span>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mt-0.5">Czas</span>
              </div>
            </motion.div>

            {/* 3. Zaokrąglona pastylka o stonowanym tle z zielonym akcentem */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="flex items-center justify-center mb-6"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-emerald-500/30 text-emerald-300 text-xs font-semibold shadow-[0_0_15px_rgba(16,185,129,0.12)]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>
                  {finalScorePct === 100 
                    ? 'Zaliczone bezbłędnie (100%)' 
                    : `Poprawność: ${correctAnswersCount}/${totalTasksCount} (${finalScorePct}%)`}
                </span>
              </div>
            </motion.div>

            {/* Wyłącznie JEDEN, szeroki przycisk akcji: WRÓĆ DO MAPY NAUKI */}
            <div className="w-full pt-3 border-t border-slate-800/80">
              <button
                id="session-celebration-return-button"
                onClick={() => handleFinishSession(false)}
                className="w-full py-4 px-6 rounded-2xl font-black text-slate-950 bg-emerald-400 hover:bg-emerald-300 active:scale-[0.98] transition shadow-[0_0_25px_rgba(16,185,129,0.35)] flex items-center justify-center gap-2 text-base cursor-pointer tracking-wide"
              >
                <span>WRÓĆ DO MAPY NAUKI</span>
                <Check className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // Tier color mapping
  const tier = currentTask?.tier || 'A';
  const tierBadgeColor = 
    tier === 'C' 
      ? 'bg-rose-500/15 text-rose-300 border-rose-500/30' 
      : tier === 'B' 
        ? 'bg-sky-500/15 text-sky-300 border-sky-500/30' 
        : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';

  return (
    <div 
      id="session-runner-modal"
      className="fixed inset-0 z-50 bg-[#070A0F] flex items-center justify-center p-0 md:p-6 lg:p-8"
    >
      <div 
        id="session-runner-container"
        className={`w-full h-full md:h-[92vh] md:max-h-[920px] ${
          isTheoryStep ? 'md:max-w-[1100px]' : 'md:max-w-[750px]'
        } bg-[#0B0F19] md:rounded-[32px] md:border md:border-white/10 md:shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_40px_rgba(0,229,255,0.06)] flex flex-col justify-between overflow-hidden relative text-white transition-all duration-200`}
      >
      {/* ================= DEDICATED FOCUS SESSION BAR ================= */}
      <header 
        id="session-header"
        className="w-full shrink-0 bg-[#0B0F19] border-b border-white/10 z-20 sticky top-0"
      >
        <div className={`w-full mx-auto px-4 sm:px-6 pt-3 pb-2.5 flex items-center justify-between gap-3 transition-all ${
          isTheoryStep ? 'max-w-5xl lg:max-w-6xl' : 'max-w-2xl'
        }`}>
          {/* Przycisk wyjścia X po lewej stronie */}
          <button
            id="session-exit-button"
            onClick={() => setShowExitModal(true)}
            className="w-9 h-9 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition active:scale-95 shrink-0 flex items-center justify-center cursor-pointer"
            title="Przerwij sesję"
            aria-label="Przerwij sesję"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Standaryzowany, czytelny pasek postępu – Mastery Learning (4 poprawne zadania) */}
          <div className="flex-1 flex flex-col items-center gap-1 min-w-0 px-2">
            {isTheoryStep ? (
              <div className="flex items-center gap-1.5 w-full max-w-xs justify-center">
                <span className="text-xs font-bold text-cyan-400">Krok 1: Pigułka wiedzy</span>
                <span className="text-xs text-slate-400">• Wprowadzenie i Wzory</span>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-1.5 w-full max-w-xs">
                  {[0, 1, 2, 3].map((segIdx) => {
                    const isDone = correctAnswersCount > segIdx;
                    const isNext = correctAnswersCount === segIdx;

                    return (
                      <div
                        key={segIdx}
                        className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                          isDone
                            ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.7)]'
                            : isNext
                              ? 'bg-cyan-500/40 border border-cyan-400/60'
                              : 'bg-slate-800'
                        }`}
                      />
                    );
                  })}
                </div>
                <div className="text-xs font-semibold text-slate-300 select-none flex items-center gap-1.5">
                  <span>Cel lekcji:</span>
                  <span className="text-emerald-400 font-bold">{correctAnswersCount} / 4</span>
                  <span className="text-slate-400">poprawnych zadań</span>
                </div>
              </>
            )}
          </div>

          {/* Przycisk Wzory po prawej stronie */}
          <button
            id="session-formulas-button"
            onClick={() => setShowFormulaSheet(true)}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-800/80 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 shrink-0 shadow-sm cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <span>Wzory</span>
          </button>
        </div>
      </header>

      {/* ================= MAIN TASK AREA ================= */}
      <main 
        id="session-task-area"
        ref={taskAreaRef}
        className={`w-full mx-auto flex-1 overflow-y-auto overscroll-y-contain touch-pan-y flex flex-col justify-start transition-all ${
          isTheoryStep 
            ? 'max-w-5xl lg:max-w-6xl px-4 sm:px-6 md:pb-8 pb-32 sm:pb-36' 
            : `max-w-2xl px-4 ${isEvaluated ? 'pb-12 sm:pb-16' : 'pb-20 sm:pb-24'}`
        }`}
        style={{
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y'
        }}
      >
        {isTheoryStep ? (
          <div id="session-theory-pill-content" className="w-full">
            {/* ----------------- MOBILE VIEW (< 768px): 4 LOGICZNE MIKRO-KARTY ----------------- */}
            <div id="session-theory-mobile" className="block md:hidden space-y-4 pt-2">
              {/* Czysty pasek 4 segmentów postępu (bez świecenia) */}
              <div className="grid grid-cols-4 gap-1.5 py-1">
                {[
                  { id: 0, title: 'Istota' },
                  { id: 1, title: 'Wzory' },
                  { id: 2, title: 'Przykład' },
                  { id: 3, title: 'Pułapka' }
                ].map((step) => {
                  const isActive = theorySubStep === step.id;
                  const isDone = theorySubStep > step.id;
                  return (
                    <button
                      key={step.id}
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        setTheorySubStep(step.id);
                      }}
                      className="py-1 flex flex-col gap-1 cursor-pointer group"
                      aria-label={`Przejdź do: ${step.title}`}
                    >
                      <div className={`h-1.5 rounded-full transition-colors ${
                        isActive 
                          ? 'bg-cyan-400' 
                          : isDone 
                            ? 'bg-slate-400' 
                            : 'bg-slate-800'
                      }`} />
                      <span className={`text-[10px] text-center font-medium transition-colors ${
                        isActive ? 'text-cyan-300 font-semibold' : 'text-slate-500'
                      }`}>
                        {step.title}
                      </span>
                    </button>
                  );
                })}
              </div>

              <AnimatePresence mode="wait">
                {/* Karta 1: Istota & Strategia */}
                {theorySubStep === 0 && (
                  <motion.div
                    key="mobile-substep-0"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-4"
                  >
                    <section className="flex flex-col gap-2.5">
                      <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-tight">
                        {theoryPill.title || lessonTitle}
                      </h1>
                      {(theoryPill.concept_essence || theoryPill.intuition) && (
                        <div className="rounded-2xl p-4 bg-slate-900/60 border border-slate-800 text-slate-200 text-sm sm:text-base leading-relaxed">
                          {renderMicroContent(theoryPill.concept_essence || theoryPill.intuition)}
                        </div>
                      )}
                    </section>

                    {(theoryPill.matura_context || theoryPill.keyTakeaway) && (
                      <section className="rounded-2xl p-4 bg-slate-900/40 border border-slate-800 flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
                          <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <span>Strategia maturalna</span>
                        </div>
                        <div className="text-sm text-slate-300 leading-relaxed font-normal">
                          {renderMicroContent(theoryPill.matura_context || theoryPill.keyTakeaway)}
                        </div>
                      </section>
                    )}
                  </motion.div>
                )}

                {/* Karta 2: Wzory */}
                {theorySubStep === 1 && (
                  <motion.div
                    key="mobile-substep-1"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-4"
                  >
                    {(theoryPill.core_formulas || theoryPill.coreFormulaLatex) && (
                      <section className="rounded-2xl p-4 sm:p-5 bg-slate-900/60 border border-slate-800 text-center relative overflow-hidden">
                        <div className="flex items-center justify-center gap-2 mb-2 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                          <BookOpen className="w-4 h-4 text-cyan-400" />
                          <span>Wzory</span>
                        </div>
                        <div className="w-full max-w-full overflow-x-auto py-2 px-2 sm:px-4 text-center">
                          <MathRenderer content={theoryPill.core_formulas || theoryPill.coreFormulaLatex} displayMode={true} />
                        </div>
                        {theoryPill.formula_notes && (
                          <p className="mt-3 text-xs sm:text-sm text-slate-400 border-t border-slate-800 pt-3 font-normal leading-relaxed text-left">
                            {renderMicroContent(theoryPill.formula_notes)}
                          </p>
                        )}
                      </section>
                    )}
                  </motion.div>
                )}

                {/* Karta 3: Przykład z arkusza (bez syndromu matrioszki) */}
                {theorySubStep === 2 && (
                  <motion.div
                    key="mobile-substep-2"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-4"
                  >
                    {theoryPill.worked_example && (
                      <section className="rounded-2xl p-4 sm:p-5 bg-slate-900/60 border border-slate-800 flex flex-col gap-4">
                        <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                          <FileText className="w-4 h-4 text-cyan-400" />
                          <span>Przykład z arkusza</span>
                        </div>

                        {/* Treść zadania - estetyczny akapit z lewym akcentem */}
                        <div className="border-l-2 border-cyan-500/40 pl-3 py-0.5">
                          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                            Treść zadania
                          </span>
                          <div className="text-sm text-slate-100 font-medium leading-relaxed">
                            {renderMicroContent(theoryPill.worked_example.problem)}
                          </div>
                        </div>

                        {/* Minimalistyczna lista pionowa kroków z cyframi w kółkach */}
                        <div className="space-y-3 pt-1 border-t border-slate-800/80">
                          {theoryPill.worked_example.step1 && (
                            <div className="flex items-start gap-2.5 text-sm text-slate-200">
                              <span className="shrink-0 w-5 h-5 rounded-full bg-slate-800 border border-slate-700 text-cyan-300 font-bold text-xs flex items-center justify-center mt-0.5">
                                1
                              </span>
                              <div className="flex-1 leading-relaxed">
                                {renderMicroContent(theoryPill.worked_example.step1)}
                              </div>
                            </div>
                          )}

                          {theoryPill.worked_example.step2 && (
                            <div className="flex items-start gap-2.5 text-sm text-slate-200">
                              <span className="shrink-0 w-5 h-5 rounded-full bg-slate-800 border border-slate-700 text-cyan-300 font-bold text-xs flex items-center justify-center mt-0.5">
                                2
                              </span>
                              <div className="flex-1 leading-relaxed">
                                {renderMicroContent(theoryPill.worked_example.step2)}
                              </div>
                            </div>
                          )}

                          {theoryPill.worked_example.steps?.map((st) => (
                            <div key={st.step_num} className="flex items-start gap-2.5 text-sm text-slate-200">
                              <span className="shrink-0 w-5 h-5 rounded-full bg-slate-800 border border-slate-700 text-cyan-300 font-bold text-xs flex items-center justify-center mt-0.5">
                                {st.step_num}
                              </span>
                              <div className="flex-1 leading-relaxed">
                                {renderMicroContent(st.explanation)}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Wynik końcowy - naturalne podsumowanie na dole */}
                        {theoryPill.worked_example.result && (
                          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs sm:text-sm">
                            <span className="text-slate-400 font-medium">Odpowiedź:</span>
                            <span className="font-semibold text-emerald-400">
                              <MathRenderer content={`$${theoryPill.worked_example.result}$`} />
                            </span>
                          </div>
                        )}
                      </section>
                    )}
                  </motion.div>
                )}

                {/* Karta 4: Pułapka egzaminacyjna (samodzielny ekran z dużym marginesem) */}
                {theorySubStep === 3 && (
                  <motion.div
                    key="mobile-substep-3"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-4"
                  >
                    {(theoryPill.exam_trap || theoryPill.trapAlert) && (
                      <section className="rounded-2xl p-5 bg-sky-500/5 border border-sky-500/25 flex flex-col gap-3">
                        <div className="flex items-center gap-2 text-sky-400 text-xs font-semibold uppercase tracking-wider">
                          <AlertTriangle className="w-4 h-4 text-sky-400 shrink-0" />
                          <span>Pułapka egzaminacyjna</span>
                        </div>
                        <div className="text-sm sm:text-base text-sky-100/95 leading-relaxed font-normal">
                          {renderMicroContent(theoryPill.exam_trap || theoryPill.trapAlert)}
                        </div>
                      </section>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ----------------- DESKTOP & TABLET VIEW (>= 768px): ADAPTACYJNY BENTO GRID ----------------- */}
            <div id="session-theory-desktop" className="hidden md:grid md:grid-cols-12 md:gap-6 pt-3 pb-6">
              {/* LEWA KOLUMNA: Teoria i Wzory */}
              <div className="md:col-span-6 lg:col-span-5 flex flex-col gap-4">
                {/* Tytuł i Istota Pojęcia */}
                <section className="flex flex-col gap-2.5">
                  <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight leading-tight">
                    {theoryPill.title || lessonTitle}
                  </h1>
                  {(theoryPill.concept_essence || theoryPill.intuition) && (
                    <div className="rounded-2xl p-4 lg:p-5 bg-slate-900/60 border border-slate-800 text-slate-200 text-sm lg:text-base leading-relaxed font-normal shadow-sm">
                      {renderMicroContent(theoryPill.concept_essence || theoryPill.intuition)}
                    </div>
                  )}
                </section>

                {/* Kafelek WZORY */}
                {(theoryPill.core_formulas || theoryPill.coreFormulaLatex) && (
                  <section className="rounded-2xl p-4 lg:p-5 bg-slate-900/60 border border-slate-800 text-center relative overflow-hidden flex flex-col justify-center">
                    <div className="flex items-center justify-center gap-2 mb-2 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                      <BookOpen className="w-4 h-4 text-cyan-400" />
                      <span>Wzory</span>
                    </div>
                    <div className="w-full max-w-full overflow-x-auto py-2 px-2 lg:px-4 text-center">
                      <MathRenderer content={theoryPill.core_formulas || theoryPill.coreFormulaLatex} displayMode={true} />
                    </div>
                    {theoryPill.formula_notes && (
                      <p className="mt-3 text-xs lg:text-sm text-slate-400 border-t border-slate-800 pt-3 font-normal leading-relaxed text-left">
                        {renderMicroContent(theoryPill.formula_notes)}
                      </p>
                    )}
                  </section>
                )}
              </div>

              {/* PRAWA KOLUMNA: Praktyka maturalna, Przykład, Pułapka i Przycisk CTA */}
              <div className="md:col-span-6 lg:col-span-7 flex flex-col gap-4">
                {/* Karta STRATEGIA MATURALNA */}
                {(theoryPill.matura_context || theoryPill.keyTakeaway) && (
                  <section className="rounded-2xl p-4 lg:p-5 bg-slate-900/40 border border-slate-800 flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
                      <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>Strategia maturalna</span>
                    </div>
                    <div className="text-sm lg:text-base text-slate-300 leading-relaxed font-normal">
                      {renderMicroContent(theoryPill.matura_context || theoryPill.keyTakeaway)}
                    </div>
                  </section>
                )}

                {/* Karta PRZYKŁAD Z ARKUSZA */}
                {theoryPill.worked_example && (
                  <section className="rounded-2xl p-5 bg-slate-900/60 border border-slate-800 flex flex-col gap-4">
                    <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                      <FileText className="w-4 h-4 text-cyan-400" />
                      <span>Przykład z arkusza</span>
                    </div>

                    <div className="border-l-2 border-cyan-500/40 pl-3.5 py-0.5">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                        Treść zadania
                      </span>
                      <div className="text-sm lg:text-base text-slate-100 font-medium leading-relaxed">
                        {renderMicroContent(theoryPill.worked_example.problem)}
                      </div>
                    </div>

                    <div className="space-y-3 pt-1 border-t border-slate-800/80">
                      {theoryPill.worked_example.step1 && (
                        <div className="flex items-start gap-3 text-sm lg:text-base text-slate-200">
                          <span className="shrink-0 w-5 h-5 rounded-full bg-slate-800 border border-slate-700 text-cyan-300 font-bold text-xs flex items-center justify-center mt-0.5">
                            1
                          </span>
                          <div className="flex-1 leading-relaxed">
                            {renderMicroContent(theoryPill.worked_example.step1)}
                          </div>
                        </div>
                      )}

                      {theoryPill.worked_example.step2 && (
                        <div className="flex items-start gap-3 text-sm lg:text-base text-slate-200">
                          <span className="shrink-0 w-5 h-5 rounded-full bg-slate-800 border border-slate-700 text-cyan-300 font-bold text-xs flex items-center justify-center mt-0.5">
                            2
                          </span>
                          <div className="flex-1 leading-relaxed">
                            {renderMicroContent(theoryPill.worked_example.step2)}
                          </div>
                        </div>
                      )}

                      {theoryPill.worked_example.steps?.map((st) => (
                        <div key={st.step_num} className="flex items-start gap-3 text-sm lg:text-base text-slate-200">
                          <span className="shrink-0 w-5 h-5 rounded-full bg-slate-800 border border-slate-700 text-cyan-300 font-bold text-xs flex items-center justify-center mt-0.5">
                            {st.step_num}
                          </span>
                          <div className="flex-1 leading-relaxed">
                            {renderMicroContent(st.explanation)}
                          </div>
                        </div>
                      ))}
                    </div>

                    {theoryPill.worked_example.result && (
                      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs lg:text-sm">
                        <span className="text-slate-400 font-medium">Odpowiedź:</span>
                        <span className="font-semibold text-emerald-400">
                          <MathRenderer content={`$${theoryPill.worked_example.result}$`} />
                        </span>
                      </div>
                    )}
                  </section>
                )}

                {/* Karta PUŁAPKA EGZAMINACYJNA */}
                {(theoryPill.exam_trap || theoryPill.trapAlert) && (
                  <section className="rounded-2xl p-4 lg:p-5 bg-sky-500/5 border border-sky-500/25 flex flex-col gap-2.5">
                    <div className="flex items-center gap-2 text-sky-400 text-xs font-semibold uppercase tracking-wider">
                      <AlertTriangle className="w-4 h-4 text-sky-400 shrink-0" />
                      <span>Pułapka egzaminacyjna</span>
                    </div>
                    <div className="text-sm lg:text-base text-sky-100/95 leading-relaxed font-normal">
                      {renderMicroContent(theoryPill.exam_trap || theoryPill.trapAlert)}
                    </div>
                  </section>
                )}

                {/* Przycisk CTA zintegrowany na dole prawej kolumny na desktopie */}
                <div className="pt-2">
                  <button
                    id="session-desktop-start-tasks-button"
                    type="button"
                    onClick={() => {
                      triggerHaptic('medium');
                      playSuccessSound();
                      setCurrentStep(1);
                    }}
                    className="w-full h-[50px] px-6 rounded-xl font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 active:scale-[0.98] transition flex items-center justify-center gap-2.5 text-sm sm:text-base cursor-pointer tracking-wide"
                  >
                    <span>Rozpocznij zadania</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : !currentTask ? (
          <div className="pt-10 pb-8 flex flex-col items-center justify-center text-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <CheckCircle2 size={32} />
            </div>
            <h2 className="text-xl font-bold text-white">Pigułka wiedzy opanowana!</h2>
            <p className="text-sm text-slate-300 max-w-md">
              Zadania dla tej lekcji zostaną wczytane z bazy Firebase. Teoria została zaliczona na Twoim profilu.
            </p>
            <button
              onClick={() => {
                setIsSessionComplete(true);
                setEarnedXp(prev => Math.max(prev, 15));
              }}
              className="mt-2 px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm uppercase tracking-wider transition active:scale-98 cursor-pointer"
            >
              Zakończ sesję lekcyjną
            </button>
          </div>
        ) : (
          <>
            {/* Sztywny margines górny + Tytuł lekcji i pojedyncza linia metadanych */}
            <div className="pt-5 pb-3 flex flex-col gap-2 shrink-0">
              <h1 className="text-base sm:text-lg font-bold text-white leading-snug break-words">
                {lessonTitle}
              </h1>
              
              {/* Autentyczna, elegancka etykieta źródła zadania (Source Tag) */}
              <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-cyan-300 font-medium text-[11px] sm:text-xs shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                  <span>{formatSourceTag(currentTask?.source || currentTask?.cke_source, currentTask?.points, isOpenTask)}</span>
                </span>
                {isOpenTask ? (
                  <span className="px-2 py-0.5 rounded-md bg-sky-500/15 border border-sky-500/30 text-sky-300 text-[10px] font-bold uppercase tracking-wider">
                    Zadanie Otwarte • 2 pkt
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/50 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                    Pewniak E8
                  </span>
                )}
                {currentTask?.tierLabel && (
                  <span className="text-[11px] text-slate-500 hidden sm:inline">
                    • {currentTask.tierLabel}
                  </span>
                )}
              </div>
            </div>
            {/* Task Question Statement */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 sm:p-6 shadow-sm">
              <div className="text-base sm:text-lg font-medium text-slate-100 leading-relaxed break-words">
                <MathRenderer content={currentTask?.question || currentTask?.math_statement || ''} />
              </div>
            </div>

        {/* OPEN TASK WORKSPACE OR MULTIPLE CHOICE OPTIONS */}
        {isOpenTask ? (
          <div className="space-y-4 pt-1">
            {/* Answer input area */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-medium">Zapisz swoje rozwiązanie i tok rozumowania:</span>
                <span className="text-cyan-400 font-medium">Dowód algebraiczny</span>
              </div>

              <div className="relative rounded-2xl bg-slate-900/80 border border-slate-800 focus-within:border-cyan-400/80 focus-within:shadow-[0_0_20px_rgba(6,182,212,0.2)] transition-all">
                <textarea
                  id="session-open-task-input"
                  value={openAnswerText}
                  onChange={(e) => setOpenAnswerText(e.target.value)}
                  disabled={isEvaluated || isTutorScanning}
                  placeholder="Zapisz swoje przekształcenia i uzasadnienie podzielności..."
                  rows={4}
                  className="w-full bg-transparent p-4 text-sm sm:text-base text-slate-100 placeholder:text-slate-500 resize-none focus:outline-none font-mono"
                />

                {/* Quick Math Symbol Chips */}
                {!isEvaluated && (
                  <div className="flex items-center gap-1.5 p-2.5 pt-0 border-t border-slate-800/60 overflow-x-auto select-none">
                    <span className="text-[10px] uppercase font-bold text-slate-500 mr-1 shrink-0">Wstaw:</span>
                    {[
                      { label: 'n(n+1)', insert: 'n(n+1)' },
                      { label: '2k', insert: '2k' },
                      { label: '·', insert: ' \\cdot ' },
                      { label: '∈ ℕ', insert: ' \\in \\mathbb{N}' },
                      { label: '∈ ℤ', insert: ' \\in \\mathbb{Z}' },
                      { label: '⇒', insert: ' \\implies ' },
                      { label: '4k(k+1)', insert: '4k(k+1)' },
                      { label: 'podzielna przez', insert: ' jest podzielna przez ' }
                    ].map((btn, bIdx) => (
                      <button
                        key={bIdx}
                        type="button"
                        disabled={isEvaluated || isTutorScanning}
                        onClick={() => setOpenAnswerText(prev => prev + btn.insert)}
                        className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold shrink-0 border border-slate-700/60 active:scale-95 transition-all cursor-pointer"
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* AI Tutor Scanning State (pulsujący gradient błękitno-indygo) */}
            {isTutorScanning && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-[#071927] via-[#0b1626] to-[#121633] border border-cyan-500/50 shadow-[0_0_35px_rgba(6,182,212,0.25)] flex flex-col items-center text-center my-3 relative overflow-hidden animate-pulse"
              >
                <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/30 to-indigo-600/40 border border-cyan-400/60 flex items-center justify-center mb-3 shadow-[0_0_25px_rgba(6,182,212,0.5)]">
                  <Sparkles className="w-7 h-7 text-cyan-300 animate-spin-slow shrink-0" />
                  <div className="absolute inset-0 rounded-2xl border border-cyan-400/40 animate-ping opacity-25" />
                </div>
                <h4 className="font-bold text-white text-base sm:text-lg mb-1">
                  Twój Osobisty Tutor AI sprawdza poprawność dowodu i argumentację...
                </h4>
                <p className="text-xs sm:text-sm text-cyan-300/85 max-w-md">
                  Weryfikuję przekształcenia algebraiczne, tożsamości oraz precyzję dowodu zgodnie z kryteriami egzaminu ósmoklasisty CKE.
                </p>
              </motion.div>
            )}

            {/* Tutor Feedback Card */}
            {isEvaluated && tutorEvaluation && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl bg-[#0f172a] border border-slate-700/80 p-4 sm:p-5 shadow-xl space-y-3.5"
              >
                {/* Header + Score Badge */}
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                      <Sparkles size={18} />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm sm:text-base leading-tight">
                        Ocena Tutora AI
                      </h4>
                      <span className="text-[11px] text-slate-400">
                        Standardy oceniania egzaminu ósmoklasisty CKE
                      </span>
                    </div>
                  </div>

                  {/* Score badge */}
                  <div className={`px-3 py-1.5 rounded-xl border text-xs sm:text-sm font-bold flex items-center gap-1.5 ${
                    tutorEvaluation.score === (currentTask?.points || 2)
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                      : tutorEvaluation.score > 0
                        ? 'bg-sky-500/15 border-sky-500/40 text-sky-300 shadow-[0_0_15px_rgba(14,165,233,0.2)]'
                        : 'bg-rose-500/15 border-rose-500/40 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.2)]'
                  }`}>
                    {tutorEvaluation.score === (currentTask?.points || 2) ? (
                      <CheckCircle2 size={16} />
                    ) : tutorEvaluation.score > 0 ? (
                      <Sparkles size={16} />
                    ) : (
                      <AlertTriangle size={16} />
                    )}
                    <span>{tutorEvaluation.gradeTitle || `${tutorEvaluation.score} / ${currentTask?.points || 2} PKT`}</span>
                  </div>
                </div>

                {/* Tutor Explanation & Strengths/Errors */}
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-white/5 text-xs sm:text-sm text-slate-200 leading-relaxed">
                  <p className="font-medium text-slate-300">
                    {tutorEvaluation.ckeFeedback || tutorEvaluation.summary}
                  </p>

                  {tutorEvaluation.strengths && tutorEvaluation.strengths.length > 0 && (
                    <div className="mt-2.5 pt-2.5 border-t border-white/5 space-y-1">
                      <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wide block">
                        Mocne strony Twojego dowodu:
                      </span>
                      {tutorEvaluation.strengths.map((str: string, sIdx: number) => (
                        <div key={sIdx} className="flex items-start gap-1.5 text-xs text-slate-300">
                          <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                          <span>{str}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {tutorEvaluation.errors && tutorEvaluation.errors.length > 0 && (
                    <div className="mt-2.5 pt-2.5 border-t border-white/5 space-y-1">
                      <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wide block">
                        Zalecenie do zapisu egzaminacyjnego:
                      </span>
                      {tutorEvaluation.errors.map((err: string, eIdx: number) => (
                        <div key={eIdx} className="flex items-start gap-1.5 text-xs text-slate-300">
                          <AlertTriangle size={14} className="text-sky-400 shrink-0 mt-0.5" />
                          <span>{err}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Model Solution Dropdown */}
                <div className="rounded-xl border border-cyan-500/25 bg-cyan-950/20 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowModelSolution(prev => !prev)}
                    className="w-full p-3 flex items-center justify-between text-left text-xs sm:text-sm font-bold text-cyan-300 hover:bg-cyan-500/10 transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <BookOpen size={16} />
                      <span>Wzorcowy dowód maturalny (Krok po kroku)</span>
                    </span>
                    <span className="text-xs font-normal text-cyan-400/80">
                      {showModelSolution ? 'Zwiń ▲' : 'Rozwiń ▼'}
                    </span>
                  </button>
                  {showModelSolution && (
                    <div className="p-3.5 pt-0 border-t border-cyan-500/20 text-xs sm:text-sm text-slate-200 space-y-2.5 max-h-56 overflow-y-auto">
                      {currentTask?.modelSolutionSteps && currentTask.modelSolutionSteps.length > 0 ? (
                        <div className="space-y-2">
                          {currentTask.modelSolutionSteps.map((step: any, sIdx: number) => (
                            <div key={sIdx} className="p-2.5 rounded-lg bg-black/40 border border-white/5">
                              <span className="text-[11px] font-bold text-cyan-400 block mb-0.5">
                                Krok {step.step_num}: {step.description}
                              </span>
                              {step.latex && <MathRenderer content={`$${step.latex}$`} />}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-lg bg-black/40 border border-white/5">
                          <MathRenderer content={currentTask?.officialKey || currentTask?.explanation || ''} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        ) : (
          /* Options List (A, B, C, D) - unified 150ms fade-in, no staggered delays between tiles */
          <motion.div 
            key={`session-options-${currentStep}-${currentTask?.id || ''}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="space-y-3 pt-1"
          >
            {currentTask?.options?.map((option: any) => {
              const isSelected = selectedOption === option.id;
              const isOptionCorrect = option.id === currentTask?.correct_answer;

              // Highlight border and background during evaluation
              let borderStyle = 'border-slate-800 hover:border-slate-700 bg-slate-900/50';
              if (isSelected && !isEvaluated) {
                borderStyle = 'border-cyan-400 bg-cyan-950/30 shadow-[0_0_15px_rgba(34,211,238,0.2)]';
              } else if (isEvaluated) {
                if (isOptionCorrect) {
                  borderStyle = 'border-emerald-500 bg-emerald-950/40 shadow-[0_0_15px_rgba(16,185,129,0.3)]';
                } else if (isSelected && !isOptionCorrect) {
                  borderStyle = 'border-rose-500 bg-rose-950/40 shadow-[0_0_15px_rgba(244,63,94,0.3)]';
                } else {
                  borderStyle = 'border-slate-800/60 opacity-40 bg-slate-900/20';
                }
              }

              return (
                <button
                  key={option.id}
                  id={`session-option-${option.id}`}
                  onClick={() => handleSelectOption(option.id)}
                  disabled={isEvaluated}
                  className={`w-full min-h-[58px] p-3 sm:p-4 rounded-2xl border text-left flex items-center justify-between gap-3 transition-all duration-150 ${borderStyle} active:scale-[0.99]`}
                >
                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    <span 
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border transition-colors ${
                        isSelected && !isEvaluated
                          ? 'bg-cyan-500 border-cyan-400 text-slate-950'
                          : isEvaluated && isOptionCorrect
                            ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                            : isEvaluated && isSelected && !isOptionCorrect
                              ? 'bg-rose-500 border-rose-400 text-white'
                              : 'bg-slate-800 border-slate-700 text-slate-300'
                      }`}
                    >
                      {option.id}
                    </span>
                    <div className="text-sm sm:text-base text-slate-100 font-medium break-words flex-1">
                      <MathRenderer content={option.content_latex || option.text || ''} />
                    </div>
                  </div>

                  {/* Keyboard badge for desktop */}
                  {!isEvaluated && (
                    <span className="hidden md:inline-flex items-center text-[11px] font-mono font-bold text-slate-400 bg-slate-800/80 border border-slate-700/60 px-2 py-0.5 rounded shrink-0 mr-1">
                      {option.id}
                    </span>
                  )}

                  {/* Selection / Status Icon */}
                  {isSelected && !isEvaluated && (
                    <div className="w-5 h-5 rounded-full bg-cyan-400/20 flex items-center justify-center shrink-0">
                      <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                    </div>
                  )}
                  {isEvaluated && isOptionCorrect && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  )}
                  {isEvaluated && isSelected && !isOptionCorrect && (
                    <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
          </>
        )}
      </main>

      {/* ================= STICKY BOTTOM CTA FOR THEORY STEP (MOBILE ONLY) ================= */}
      {isTheoryStep && (
        <footer 
          id="session-theory-sticky-cta"
          className="md:hidden w-full shrink-0 sticky bottom-0 z-30 bg-[#0B0F19]/95 backdrop-blur-md border-t border-slate-800 px-4 py-3"
        >
          <div className="w-full max-w-lg mx-auto flex items-center gap-2">
            {theorySubStep > 0 && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setTheorySubStep(prev => Math.max(0, prev - 1));
                }}
                className="h-[48px] px-4 rounded-xl font-semibold text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 flex items-center justify-center gap-1.5 text-sm shrink-0 cursor-pointer active:scale-95 transition"
                aria-label="Wróć do poprzedniej karty"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Wróć</span>
              </button>
            )}

            {theorySubStep < 3 ? (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setTheorySubStep(prev => Math.min(3, prev + 1));
                }}
                className="flex-1 h-[48px] px-4 rounded-xl font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 active:scale-[0.98] transition flex items-center justify-center gap-2 text-sm cursor-pointer tracking-wide"
              >
                <span>Dalej</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            ) : (
              <button
                type="button"
                id="session-start-tasks-button"
                onClick={() => {
                  triggerHaptic('medium');
                  playSuccessSound();
                  setCurrentStep(1);
                }}
                className="flex-1 h-[48px] px-4 rounded-xl font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 active:scale-[0.98] transition flex items-center justify-center gap-2 text-sm cursor-pointer tracking-wide"
              >
                <span>Rozpocznij zadania</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            )}
          </div>
        </footer>
      )}

      {/* ================= BOTTOM ACTION & FEEDBACK DRAWER ================= */}
      {!isTheoryStep && (
        <footer 
          id="session-footer-drawer"
          className="w-full shrink-0 relative z-30"
        >
        <AnimatePresence mode="wait">
          {!isEvaluated ? (
            /* Normal Action Bar */
            <div 
              id="session-check-bar"
              className="w-full bg-[#0B0F19]/95 backdrop-blur-md border-t border-slate-800 p-4"
            >
              <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-2.5">
                {isOpenTask ? (
                  <button
                    id="session-check-tutor-button"
                    onClick={handleCheckOpenAnswerWithTutor}
                    disabled={!openAnswerText.trim() || isTutorScanning}
                    className={`w-full py-4 px-6 rounded-2xl font-bold text-base transition-all duration-200 flex items-center justify-center gap-2 ${
                      openAnswerText.trim() && !isTutorScanning
                        ? 'bg-gradient-to-r from-cyan-400 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 text-slate-950 shadow-[0_0_25px_rgba(34,211,238,0.4)] active:scale-[0.99] cursor-pointer'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                    }`}
                  >
                    <Sparkles className="w-5 h-5 text-slate-950 stroke-[2.2]" />
                    <span>{isTutorScanning ? 'ANALIZA W TOKU...' : 'SPRAWDŹ Z TUTOREM AI'}</span>
                  </button>
                ) : (
                  <button
                    id="session-check-button"
                    onClick={handleCheckAnswer}
                    disabled={!selectedOption}
                    className={`w-full py-4 px-6 rounded-2xl font-bold text-base transition-all duration-200 flex items-center justify-center gap-2 ${
                      selectedOption
                        ? 'bg-cyan-400 hover:bg-cyan-300 text-slate-950 shadow-[0_0_20px_rgba(34,211,238,0.4)] active:scale-[0.99]'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                    }`}
                  >
                    <span>SPRAWDŹ</span>
                    <span className="hidden md:inline-flex text-[10px] font-mono font-bold opacity-75 bg-black/25 px-1.5 py-0.5 rounded">Enter ↵</span>
                    <Check className="w-5 h-5 stroke-[2.5]" />
                  </button>
                )}
                <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-500">
                  <Info className="w-3.5 h-3.5" />
                  <span>{isOpenTask ? 'Naciśnij Ctrl+Enter aby sprawdzić dowód z Tutorem AI' : 'Wybierz opcję klawiszami 1-4 / A-D'}</span>
                </div>
              </div>
            </div>
          ) : isOpenTask ? (
            /* Open Task Next Step Bar */
            <div 
              id="session-open-next-bar"
              className="w-full bg-[#0B0F19]/95 backdrop-blur-md border-t border-slate-800 p-4"
            >
              <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
                <button
                  id="session-open-next-step-button"
                  onClick={handleNextStep}
                  className="w-full py-4 px-6 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition active:scale-[0.99] shadow-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 shadow-[0_0_25px_rgba(34,211,238,0.35)] cursor-pointer"
                >
                  <span>DALEJ</span>
                  <span className="hidden md:inline-flex text-[10px] font-mono font-bold opacity-80 bg-black/25 px-1.5 py-0.5 rounded">Spacja ␣</span>
                  <ArrowRight className="w-5 h-5 stroke-[2.5]" />
                </button>
              </div>
            </div>
          ) : (
            /* Feedback Drawer (Sliding up from bottom for MCQ) */
            <motion.div
              key="feedback-drawer"
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className={`w-full border-t-2 p-3.5 sm:p-5 max-h-[44vh] overflow-y-auto ${
                isCorrect 
                  ? 'bg-[#0a231c] border-emerald-500 shadow-[0_-10px_30px_rgba(16,185,129,0.15)]' 
                  : 'bg-[#2a131a] border-rose-500 shadow-[0_-10px_30px_rgba(244,63,94,0.15)]'
              }`}
            >
              <div className="w-full max-w-2xl mx-auto flex flex-col gap-3">
                {/* Result header */}
                <div className="flex items-center gap-3">
                  {isCorrect ? (
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-6 h-6 text-rose-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-bold text-base sm:text-lg ${isCorrect ? 'text-emerald-300' : 'text-rose-300'}`}>
                      {isCorrect ? 'Świetnie! Dobra odpowiedź' : 'Niepoprawna odpowiedź'}
                    </h3>
                    {!isCorrect && (
                      <p className="text-xs text-rose-200/90 font-medium mt-0.5">
                        Prawidłowa odpowiedź to: <span className="font-bold text-white px-2 py-0.5 rounded bg-rose-950/80 border border-rose-700/60 ml-1">{currentTask?.correct_answer}</span>
                        <span className="text-rose-300/80 block sm:inline sm:ml-2 mt-0.5 sm:mt-0 font-normal">• Zadanie trafiło na koniec kolejki</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Exam Trap Alert on Error */}
                {!isCorrect && (currentTask?.hints?.level_2 || currentTask?.hint_2 || formulaSheet?.ckeTrap?.description || theoryPill?.trapAlert) && (
                  <div className="p-3 rounded-xl bg-sky-950/40 border border-sky-500/40 text-xs text-sky-200 leading-relaxed">
                    <span className="font-bold text-sky-300 flex items-center gap-1.5 mb-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-sky-400" />
                      Pułapka egzaminacyjna CKE:
                    </span>
                    <span>
                      {currentTask?.hints?.level_2 || currentTask?.hint_2 || formulaSheet?.ckeTrap?.description || theoryPill?.trapAlert}
                    </span>
                  </div>
                )}

                {/* Explanation text on error (or collapsible) */}
                {!isCorrect && currentTask?.explanation && (
                  <div className="p-3.5 rounded-xl bg-black/50 border border-rose-500/30 text-xs sm:text-sm text-slate-200 leading-relaxed max-h-36 sm:max-h-44 overflow-y-auto overflow-x-auto w-full max-w-full">
                    <span className="font-bold text-rose-300 block mb-1.5">Metodyczne wyjaśnienie zadania:</span>
                    <MathRenderer content={currentTask.explanation} />
                  </div>
                )}

                {/* Full-width action button */}
                <button
                  id="session-next-step-button"
                  onClick={handleNextStep}
                  className={`w-full py-3.5 sm:py-4 px-6 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition active:scale-[0.99] shadow-lg cursor-pointer ${
                    isCorrect
                      ? 'bg-emerald-400 hover:bg-emerald-300 text-slate-950 shadow-[0_0_25px_rgba(16,185,129,0.35)]'
                      : 'bg-rose-500 hover:bg-rose-400 text-white shadow-[0_0_25px_rgba(244,63,94,0.35)]'
                  }`}
                >
                  <span>
                    {isCorrect
                      ? correctAnswersCount >= TARGET_CORRECT_ANSWERS
                        ? 'UKOŃCZ LEKCJĘ (4/4 ZALICZONE) ✓'
                        : `KOLEJNE ZADANIE (${correctAnswersCount}/4) →`
                      : `SPRÓBUJ KOLEJNEGO ZADANIA (${correctAnswersCount}/4) →`}
                  </span>
                  <span className="hidden md:inline-flex text-[10px] font-mono font-bold opacity-80 bg-black/25 px-1.5 py-0.5 rounded">Spacja ␣</span>
                  <ArrowRight className="w-5 h-5 stroke-[2.5]" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </footer>
      )}

      {/* ================= EXIT CONFIRMATION MODAL ================= */}
      <AnimatePresence>
        {showExitModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center"
            >
              <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-6 h-6 text-rose-400" />
              </div>
              <h2 className="text-lg font-bold text-white mb-2">Przerwać sesję?</h2>
              <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                Postęp z tej sesji nie zostanie zapisany w Twoim profilu. Czy na pewno chcesz wyjść do menu?
              </p>
              <div className="flex flex-col gap-2.5">
                <button
                  id="session-modal-stay-button"
                  onClick={() => setShowExitModal(false)}
                  className="w-full py-3.5 px-4 rounded-xl font-bold bg-cyan-400 text-slate-950 hover:bg-cyan-300 transition"
                >
                  WRÓĆ DO SESJI
                </button>
                <button
                  id="session-modal-quit-button"
                  onClick={() => {
                    setShowExitModal(false);
                    onCancelSession();
                  }}
                  className="w-full py-3 px-4 rounded-xl font-semibold text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition text-sm"
                >
                  PRZERWIJ I WYJDŹ
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= FORMULA SHEET DRAWER ================= */}
      <AnimatePresence>
        {showFormulaSheet && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              className="bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
            >
              {/* Drawer Header */}
              <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
                <div className="flex items-center gap-2.5">
                  <BookOpen className="w-5 h-5 text-cyan-400" />
                  <div>
                    <h3 className="font-bold text-white text-base">Wzory i Własności E8</h3>
                    <p className="text-xs text-slate-400">{formulaSheet?.title || lessonTitle}</p>
                  </div>
                </div>
                <button
                  id="session-formulas-close-button"
                  onClick={() => setShowFormulaSheet(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="p-5 overflow-y-auto space-y-4">
                {/* Core Formula from Theory Pill */}
                {theoryPill?.coreFormulaLatex && (
                  <div className="bg-cyan-950/25 border border-cyan-500/40 rounded-xl p-4 text-center">
                    <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block mb-2">
                      Główny Wzór Lekcji (Pigułka Wiedzy)
                    </span>
                    <div className="w-full max-w-full overflow-x-auto py-1 px-2 text-center">
                      <MathRenderer content={theoryPill.coreFormulaLatex} displayMode={true} />
                    </div>
                  </div>
                )}

                {/* Additional Formulas List if provided */}
                {formulaSheet?.formulas && formulaSheet.formulas.length > 0 && (
                  <div className="space-y-2.5">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                      Wzory i Tożsamości E8
                    </span>
                    {formulaSheet.formulas.map((f, i) => (
                      <div 
                        key={i} 
                        className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col gap-1"
                      >
                        <span className="text-xs text-slate-400 font-medium">{f.title}</span>
                        <div className="w-full max-w-full overflow-x-auto py-1 px-2 text-center">
                          <MathRenderer content={f.latex} displayMode={true} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Golden Rule */}
                {(theoryPill?.keyTakeaway || formulaSheet?.goldenRule) && (
                  <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-xs sm:text-sm text-emerald-200/90 leading-relaxed">
                    <span className="font-bold text-emerald-300 block mb-1">Złota Strategia E8:</span>
                    {theoryPill?.keyTakeaway || formulaSheet?.goldenRule}
                  </div>
                )}

                {/* Exam Trap */}
                {(theoryPill?.trapAlert || formulaSheet?.ckeTrap) && (
                  <div className="p-4 rounded-xl bg-sky-950/20 border border-sky-500/30 space-y-2">
                    <div className="flex items-center gap-1.5 text-sky-400 font-bold text-xs">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Uwaga na Pułapkę Egzaminacyjną!</span>
                    </div>
                    {theoryPill?.trapAlert ? (
                      <p className="text-slate-300 leading-relaxed text-xs">
                        {theoryPill.trapAlert}
                      </p>
                    ) : formulaSheet?.ckeTrap ? (
                      <div className="space-y-1 text-xs">
                        <div className="text-rose-300">
                          <span className="font-semibold">Błąd Typowy: </span>
                          <MathRenderer content={`$${formulaSheet.ckeTrap.error}$`} />
                        </div>
                        <div className="text-emerald-300">
                          <span className="font-semibold">Poprawnie: </span>
                          <MathRenderer content={`$${formulaSheet.ckeTrap.correct}$`} />
                        </div>
                        <p className="text-slate-300 mt-1 leading-relaxed text-[11px]">
                          {formulaSheet.ckeTrap.description}
                        </p>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex justify-end">
                <button
                  onClick={() => setShowFormulaSheet(false)}
                  className="w-full sm:w-auto py-2.5 px-6 rounded-xl font-semibold text-sm bg-slate-800 hover:bg-slate-700 text-white transition"
                >
                  Zamknij kartę wzorów
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
};
