import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import {
  Sparkles,
  Flame,
  Check,
  ArrowRight,
  ArrowLeft,
  Brain,
  GraduationCap,
  Zap,
  Target,
  LogIn,
  Lightbulb,
  ShieldCheck,
  Trophy,
  BookOpen
} from 'lucide-react';
import { triggerHaptic, playSuccessSound } from '../utils';
import { Badge } from './Badge';

export interface OnboardingPreferences {
  targetExam: 'matura_2025' | 'poprawka' | 'e8';
  targetScore: '30' | '70' | '100';
  dailyMinutes: 5 | 10 | 15;
}

interface OnboardingOverlayProps {
  onClose: () => void;
  onNavigate?: (tab: 'nauka' | 'dashboard' | 'arena' | 'profile') => void;
  onComplete?: (prefs: OnboardingPreferences, shouldOpenAuth?: boolean) => void;
  onOpenAuthModal?: () => void;
  hasProgress?: boolean;
  onLogin?: () => void;
}

interface GoalOption {
  id: string;
  exam: 'e8' | 'poprawka' | 'matura_2025';
  score: '30' | '70' | '100';
  title: string;
  subtitle: string;
  icon: typeof Target;
  badgeText: string;
  badgeVariant: 'cyan' | 'amber';
}

export function OnboardingOverlay({
  onClose,
  onNavigate,
  onComplete,
  onOpenAuthModal,
  onLogin
}: OnboardingOverlayProps) {
  // 4 Steps Flow:
  // Step 1: Wybór celu egzaminacyjnego (Egzamin Ósmoklasisty E8)
  // Step 2: Zadanie demonstracyjne (Micro-Challenge 30s)
  // Step 3: Interaktywny przewodnik po aplikacji (3 karty w pigułce)
  // Step 4: Finałowa zachęta do rejestracji / logowania (Loss Aversion)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // User Selections
  const [targetExam, setTargetExam] = useState<'e8' | 'poprawka' | 'matura_2025'>('e8');
  const [targetScore, setTargetScore] = useState<'30' | '70' | '100'>('70');
  const [selectedGoalId, setSelectedGoalId] = useState<string>('e8_85');

  // Step 2: Micro-task interaction
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isTaskSolved, setIsTaskSolved] = useState<boolean>(false);
  const [showWrongTip, setShowWrongTip] = useState<boolean>(false);

  // Step 3: Guide active card tab (optional cycling or seeing all 3)
  const [activeGuideCard, setActiveGuideCard] = useState<number>(0);

  // Auto-advance timer refs
  const advanceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    };
  }, []);

  // 4 Egzamin Osmoklasisty Goals
  const goalOptions: GoalOption[] = [
    {
      id: 'e8_85',
      exam: 'e8',
      score: '70',
      title: '85%+ • Wymarzone Liceum',
      subtitle: 'Klasa dwujęzyczna / mat-fiz • Opanowanie 7 działów egzaminacyjnych',
      icon: GraduationCap,
      badgeText: 'NAJPOPULARNIEJSZY',
      badgeVariant: 'cyan'
    },
    {
      id: 'e8_60',
      exam: 'e8',
      score: '30',
      title: '60%+ • Spokojny wybór szkoły',
      subtitle: 'Zero stresu o punkty rekrutacyjne • Pewniaki z potęg, geometrii i równań',
      icon: ShieldCheck,
      badgeText: 'PEWNY START',
      badgeVariant: 'amber'
    },
    {
      id: 'e8_100',
      exam: 'e8',
      score: '100',
      title: '100% • Prestiż i olimpijska forma',
      subtitle: 'Top 1% w Polsce • Perfekcyjne zadania otwarte i dowodzenie',
      icon: Trophy,
      badgeText: 'TOP WYNIK',
      badgeVariant: 'cyan'
    },
    {
      id: 'poprawka',
      exam: 'poprawka',
      score: '30',
      title: 'Ekspresowa Powtórka CKE',
      subtitle: 'Tryb przyspieszony • Błyskawiczny trening zadań zamkniętych',
      icon: Zap,
      badgeText: 'SZYBKI TRENING',
      badgeVariant: 'amber'
    }
  ];

  // Step 1: Click and AUTO-ADVANCE to Step 2
  const handleSelectGoal = (option: GoalOption) => {
    setSelectedGoalId(option.id);
    setTargetExam(option.exam);
    setTargetScore(option.score);
    triggerHaptic('light');

    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    advanceTimerRef.current = setTimeout(() => {
      setCurrentStep(2);
    }, 280);
  };

  // Step 2: Micro-task answer logic
  const handleSelectAnswer = (ans: string) => {
    if (isTaskSolved) return;
    setSelectedAnswer(ans);

    if (ans === '2^7') {
      setIsTaskSolved(true);
      setShowWrongTip(false);
      triggerHaptic('success');
      playSuccessSound();
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.5 }
      });

      // Automatic smooth glide to step 3 after 700ms
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = setTimeout(() => {
        setCurrentStep(3);
      }, 700);
    } else {
      setShowWrongTip(true);
      triggerHaptic('warning');
    }
  };

  const handleFinishOnboarding = (openAuth: boolean = false) => {
    triggerHaptic('medium');
    const prefs: OnboardingPreferences = {
      targetExam,
      targetScore,
      dailyMinutes: 10
    };

    if (onComplete) {
      onComplete(prefs, openAuth);
    } else {
      onClose();
      if (openAuth && (onOpenAuthModal || onLogin)) {
        if (onOpenAuthModal) onOpenAuthModal();
        else if (onLogin) onLogin();
      } else if (onNavigate) {
        onNavigate('nauka');
      }
    }
  };

  return (
    <div 
      id="onboarding-overlay"
      className="fixed inset-0 z-[100] flex flex-col bg-[#070A0F] text-white overflow-hidden font-sans select-none touch-pan-y"
    >
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[550px] h-[280px] bg-gradient-to-b from-[#00E5FF]/10 to-transparent blur-[90px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[250px] bg-gradient-to-t from-sky-500/10 to-transparent blur-[80px] pointer-events-none" />

      {/* Progress bar at the top */}
      <div className="w-full bg-white/5 h-1.5 relative overflow-hidden shrink-0 z-30">
        <motion.div
          className="h-full bg-gradient-to-r from-[#00E5FF] via-cyan-400 to-sky-400 shadow-[0_0_12px_rgba(0,229,255,0.7)]"
          initial={false}
          animate={{ width: `${(currentStep / 4) * 100}%` }}
          transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
        />
      </div>

      {/* Header with step navigation and count */}
      <div className="relative z-20 flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/5 bg-[#0B0F19]/90 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-2">
          {currentStep > 1 ? (
            <button
              onClick={() => {
                if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
                triggerHaptic('light');
                setCurrentStep(prev => Math.max(1, prev - 1));
              }}
              className="p-1.5 -ml-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
              title="Wróć"
            >
              <ArrowLeft size={17} />
              <span className="text-xs font-semibold hidden xs:inline">Wróć</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <Badge variant="cyan" icon={<Sparkles size={13} />}>
                EGZAMIN 8-KLASISTY
              </Badge>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-0.5 rounded-full border border-white/5">
          <span className="text-[11px] font-bold text-white">
            Krok {currentStep}
          </span>
          <span className="text-[11px] text-slate-400">/ 4</span>
        </div>

        <button
          onClick={() => {
            triggerHaptic('light');
            handleFinishOnboarding(false);
          }}
          className="text-xs font-semibold text-slate-400 hover:text-white px-2 py-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
        >
          Pomiń
        </button>
      </div>

      {/* Main step container - perfectly fit to viewport with zero unwanted vertical scroll */}
      <div className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-6 py-4 max-w-xl mx-auto w-full flex flex-col justify-between overscroll-y-contain">
        <AnimatePresence mode="wait">
          {/* ======================================================== */}
          {/* KROK 1: Wybór celu egzaminacyjnego (Egzamin Ósmoklasisty) */}
          {/* ======================================================== */}
          {currentStep === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -18 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="flex flex-col gap-3.5 flex-1 justify-between"
            >
              <div>
                <div className="mb-1.5">
                  <Badge variant="cyan" icon={<Target size={12} />}>
                    TWÓJ CEL EGZAMINACYJNY
                  </Badge>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
                  W jaki wynik celujesz na Egzaminie E8?
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Wybierz swój plan jednym kliknięciem – dopasujemy optymalną ścieżkę powtórek.
                </p>
              </div>

              {/* 4 E8 Goals - Fits cleanly without scrolling */}
              <div className="flex flex-col gap-2.5 my-auto">
                {goalOptions.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = selectedGoalId === opt.id;

                  return (
                    <button
                      key={opt.id}
                      id={`onboarding-goal-${opt.id}`}
                      onClick={() => handleSelectGoal(opt)}
                      className={`w-full text-left p-3.5 rounded-2xl border transition-all duration-150 relative flex items-center gap-3.5 cursor-pointer active:scale-[0.99] ${
                        isSelected
                          ? 'border-[#00E5FF] bg-[#00E5FF]/10 shadow-[0_0_20px_rgba(0,229,255,0.2)]'
                          : 'bg-[#0E1522]/90 border-white/10 hover:border-white/20 hover:bg-[#131D2E]'
                      }`}
                    >
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
                          isSelected
                            ? 'bg-[#00E5FF]/20 border-[#00E5FF]/40 text-[#00E5FF]'
                            : 'bg-white/5 border-white/10 text-slate-400'
                        }`}
                      >
                        <Icon size={20} />
                      </div>

                      <div className="flex-1 min-w-0 pr-1">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <span className="text-sm font-bold text-white">
                            {opt.title}
                          </span>
                          <Badge variant={opt.badgeVariant}>
                            {opt.badgeText}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-400 leading-tight truncate">
                          {opt.subtitle}
                        </p>
                      </div>

                      <div
                        className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-[#00E5FF] border-[#00E5FF] text-slate-950'
                            : 'border-white/20 text-transparent'
                        }`}
                      >
                        <Check size={13} strokeWidth={3} />
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Action Button & Tip */}
              <div className="flex flex-col gap-2 pt-1">
                <button
                  id="onboarding-step1-continue"
                  onClick={() => setCurrentStep(2)}
                  className="w-full py-3.5 px-6 rounded-2xl font-bold text-slate-950 bg-[#00E5FF] hover:bg-cyan-300 active:scale-[0.99] transition flex items-center justify-center gap-2 text-sm sm:text-base shadow-[0_0_25px_rgba(0,229,255,0.35)]"
                >
                  <span>DALEJ</span>
                  <ArrowRight size={17} />
                </button>
                <span className="text-[11px] text-slate-500 text-center flex items-center justify-center gap-1">
                  <Lightbulb size={12} className="text-sky-400 shrink-0" />
                  <span>Kliknięcie kafelka automatycznie przeniesie Cię do kolejnego kroku</span>
                </span>
              </div>
            </motion.div>
          )}

          {/* ======================================================== */}
          {/* KROK 2: Zadanie demonstracyjne (Micro-Challenge 30s)     */}
          {/* ======================================================== */}
          {currentStep === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -18 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="flex flex-col gap-3.5 flex-1 justify-between"
            >
              <div>
                <div className="mb-1.5 flex items-center gap-2">
                  <Badge variant="cyan" icon={<Zap size={12} />}>
                    MICRO-CHALLENGE • 30 SEKUND
                  </Badge>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
                  Rozwiąż 1 zadanie i poczuj satysfakcję
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Zobacz, jak szybko rozwiązuje się zadania z E8, gdy znasz właściwy schemat.
                </p>
              </div>

              {/* KaTeX Theory Pill with rule */}
              <div className="bg-[#0E1522]/90 border border-cyan-500/30 rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,229,255,0.08)]">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#00E5FF]/10 border border-[#00E5FF]/30 flex items-center justify-center text-[#00E5FF] shrink-0 mt-0.5">
                    <Lightbulb size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#00E5FF] block mb-0.5">
                      Złota reguła mnożenia potęg
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Gdy mnożysz potęgi o tej samej podstawie, podstawę przepisujesz, a <strong className="text-white">wykładniki dodajesz</strong>:
                    </p>
                    <div className="bg-[#070A0F] border border-white/10 rounded-xl py-2 px-3 my-2 text-center text-[#00E5FF] font-bold text-base overflow-x-auto">
                      <BlockMath math="a^m \cdot a^n = a^{m+n}" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Task Question Statement */}
              <div className="bg-[#0E1522]/90 border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
                <span className="text-xs font-bold text-slate-300 text-center">
                  Oblicz iloczyn potęg:
                </span>
                <div className="text-center py-2.5 bg-[#070A0F] rounded-xl border border-white/5">
                  <span className="text-xl sm:text-2xl font-bold text-white tracking-wide">
                    <InlineMath math="2^3 \cdot 2^4 = ?" />
                  </span>
                </div>

                {/* 4 Options Grid */}
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  {[
                    { id: 'A', val: '2^7', math: '2^7' },
                    { id: 'B', val: '2^12', math: '2^{12}' },
                    { id: 'C', val: '4^7', math: '4^7' },
                    { id: 'D', val: '4^12', math: '4^{12}' }
                  ].map((opt) => {
                    const isSelected = selectedAnswer === opt.val;
                    const isCorrect = opt.val === '2^7';

                    let btnStyle = 'bg-white/5 border-white/10 text-white hover:bg-white/10';
                    if (isTaskSolved && isCorrect) {
                      btnStyle =
                        'bg-emerald-500 border-emerald-400 text-slate-950 shadow-[0_0_25px_rgba(16,185,129,0.7)] scale-[1.02]';
                    } else if (isSelected && !isCorrect) {
                      btnStyle = 'bg-rose-500/20 border-rose-500/50 text-rose-300';
                    }

                    return (
                      <button
                        key={opt.val}
                        id={`onboarding-option-${opt.id}`}
                        disabled={isTaskSolved}
                        onClick={() => handleSelectAnswer(opt.val)}
                        className={`h-14 sm:h-16 rounded-xl border text-base sm:text-lg font-bold transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] ${btnStyle}`}
                      >
                        <span className="text-xs opacity-60 font-mono">{opt.id}.</span>
                        <span>
                          <InlineMath math={opt.math} />
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Friendly hint upon wrong selection */}
                {showWrongTip && !isTaskSolved && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-sky-500/15 border border-sky-500/30 rounded-xl text-sky-300 text-xs flex items-center gap-2"
                  >
                    <Lightbulb size={16} className="text-sky-400 shrink-0" />
                    <span>Pamiętaj: podstawę <strong className="text-white">2</strong> przepisujesz bez zmian, a wykładniki dodajesz: <strong className="text-white">3 + 4 = 7</strong>. Wybierz <InlineMath math="2^7" />!</span>
                  </motion.div>
                )}

                {/* Success celebration card */}
                {isTaskSolved && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-3 bg-emerald-500/15 border border-emerald-500/40 rounded-xl flex items-center justify-between gap-2 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                        <Check size={18} strokeWidth={3} />
                      </div>
                      <span className="text-xs font-bold text-white">
                        Genialnie! Właśnie opanowałeś pewniaka egzaminacyjnego z potęg.
                      </span>
                    </div>
                    <Badge variant="emerald">
                      +15 XP NA START!
                    </Badge>
                  </motion.div>
                )}
              </div>

              <div className="text-center pt-1">
                <span className="text-[11px] text-slate-500">
                  {isTaskSolved ? 'Przechodzę do przewodnika po aplikacji...' : 'Wybierz poprawną odpowiedź, aby iść dalej'}
                </span>
              </div>
            </motion.div>
          )}

          {/* ======================================================== */}
          {/* KROK 3: Interaktywny przewodnik po aplikacji (3 karty)   */}
          {/* ======================================================== */}
          {currentStep === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -18 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="flex flex-col gap-3.5 flex-1 justify-between"
            >
              <div>
                <div className="mb-1.5">
                  <Badge variant="cyan" icon={<BookOpen size={12} />}>
                    JAK DZIAŁA JASNE.
                  </Badge>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
                  Twój ekosystem nauki do E8
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Trzy filary, dzięki którym przygotujesz się do egzaminu bez stresu:
                </p>
              </div>

              {/* 3 App Pillars */}
              <div className="flex flex-col gap-3 my-auto">
                {/* Karta A: Pewniaki E8 */}
                <div className="bg-[#0E1522]/90 border border-cyan-500/30 rounded-2xl p-4 shadow-[0_4px_15px_rgba(0,229,255,0.06)]">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                      <Target size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                        <h4 className="text-sm font-bold text-white">
                          Pewniaki CKE
                        </h4>
                        <Badge variant="cyan">
                          EGZAMIN 8-KLASISTY
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Uczysz się tylko tego, co naprawdę pojawia się w arkuszach CKE. Zero zbędnej teorii – czysta praktyka egzaminacyjna.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Karta B: Codzienna seria i skrzynie */}
                <div className="bg-[#0E1522]/90 border border-sky-500/30 rounded-2xl p-4 shadow-[0_4px_15px_rgba(14,165,233,0.08)]">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
                      <Flame size={20} className="fill-sky-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                        <h4 className="text-sm font-bold text-white">
                          Codzienna seria i skrzynie
                        </h4>
                        <Badge variant="amber">
                          SERIA DNI
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        5 minut dziennie wystarczy, by nie zapomnieć materiału do maja. Utrzymuj płomień i otwieraj skrzynie z nagrodami.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Karta C: Inteligentne powtórki */}
                <div className="bg-[#0E1522]/90 border border-emerald-500/30 rounded-2xl p-4 shadow-[0_4px_15px_rgba(16,185,129,0.06)]">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                      <Brain size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                        <h4 className="text-sm font-bold text-white">
                          Inteligentne powtórki
                        </h4>
                        <Badge variant="emerald">
                          INTELIGENTNY ALGORYTM
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Aplikacja automatycznie podrzuca Ci zadania z tematów, w których popełniłeś błąd, dopóki nie opanujesz schematu na 100%.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Continue Button */}
              <div className="pt-2">
                <button
                  id="onboarding-step3-continue"
                  onClick={() => {
                    triggerHaptic('medium');
                    setCurrentStep(4);
                  }}
                  className="w-full py-4 px-6 rounded-2xl font-bold text-slate-950 bg-[#00E5FF] hover:bg-cyan-300 active:scale-[0.99] transition flex items-center justify-center gap-2 text-base shadow-[0_0_25px_rgba(0,229,255,0.35)]"
                >
                  <span>DALEJ (ODBIERZ SWÓJ PLAN)</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </motion.div>
          )}

          {/* ======================================================== */}
          {/* KROK 4: Finałowa zachęta do rejestracji (Loss Aversion) */}
          {/* ======================================================== */}
          {currentStep === 4 && (
            <motion.div
              key="step-4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col gap-4 flex-1 items-center text-center justify-between py-1"
            >
              <div>
                <div className="mb-2 flex items-center justify-center">
                  <Badge variant="amber" icon={<Flame size={12} className="fill-sky-400" />}>
                    DZIEŃ 1 SERII ODBLOKOWANY
                  </Badge>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
                  Twój plan nauki na Egzamin Ósmoklasisty jest gotowy!
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1.5 max-w-sm mx-auto leading-relaxed">
                  Zdobyłeś już pierwsze <strong>15 XP</strong> i odblokowałeś <strong className="text-sky-400">Dzień 1 Serii</strong>.
                </p>
              </div>

              {/* Glowing Flame Symbol */}
              <div className="relative my-1">
                <motion.div
                  animate={{
                    scale: [1, 1.08, 1],
                    rotate: [-2, 2, -2]
                  }}
                  transition={{
                    duration: 2.2,
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br from-sky-500 via-blue-600 to-cyan-500 flex items-center justify-center shadow-[0_0_45px_rgba(14,165,233,0.55)] border-2 border-white/30 relative z-10"
                >
                  <Flame size={52} className="text-white fill-white drop-shadow-[0_0_12px_rgba(255,255,255,0.8)]" />
                </motion.div>
                <div className="absolute inset-0 bg-sky-500/30 rounded-3xl blur-2xl -z-10 animate-pulse" />
              </div>

              {/* Loss Aversion Summary Card */}
              <div className="w-full bg-[#0E1522]/90 border border-white/10 rounded-2xl p-4 text-left shadow-lg">
                <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-white/5">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <ShieldCheck size={15} className="text-[#00E5FF]" />
                    Twój spersonalizowany start:
                  </span>
                  <Badge variant="emerald">
                    GOTOWE
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs mb-3">
                  <div className="bg-white/5 rounded-xl p-2 border border-white/5">
                    <span className="text-[10px] text-slate-400 block">Cel egzaminacyjny</span>
                    <strong className="text-[#00E5FF] text-xs block mt-0.5">
                      {targetScore}%
                    </strong>
                  </div>

                  <div className="bg-white/5 rounded-xl p-2 border border-white/5">
                    <span className="text-[10px] text-slate-400 block">Zdobyte XP</span>
                    <strong className="text-emerald-400 text-xs block mt-0.5">
                      +15 XP
                    </strong>
                  </div>

                  <div className="bg-white/5 rounded-xl p-2 border border-white/5">
                    <span className="text-[10px] text-slate-400 block">Seria nauki</span>
                    <strong className="text-sky-400 text-xs block mt-0.5 flex items-center justify-center gap-1">
                      <Flame size={12} className="fill-sky-400" /> Dzień 1
                    </strong>
                  </div>
                </div>

                {/* Loss aversion psychological notice */}
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-[11px] text-slate-300 leading-relaxed flex items-start gap-2">
                  <Lightbulb size={15} className="text-sky-400 shrink-0 mt-0.5" />
                  <span>Utwórz darmowe konto, aby <strong>zabezpieczyć zdobyte 15 XP</strong>, nie utracić serii i móc wygodnie uczyć się na telefonie i komputerze.</span>
                </div>
              </div>

              {/* Action Buttons: High-prominence Login & Discrete Guest link */}
              <div className="w-full flex flex-col gap-2.5 pt-1">
                <button
                  id="onboarding-save-progress-button"
                  onClick={() => handleFinishOnboarding(true)}
                  className="w-full py-4 px-6 rounded-2xl font-bold text-slate-950 bg-gradient-to-r from-[#00E5FF] via-cyan-300 to-sky-300 hover:brightness-110 active:scale-[0.99] transition flex items-center justify-center gap-2 text-base shadow-[0_0_30px_rgba(0,229,255,0.4)]"
                >
                  <LogIn size={18} className="stroke-[2.5]" />
                  <span>ZAPISZ SWÓJ PROGRES (LOGOWANIE)</span>
                </button>

                <button
                  id="onboarding-guest-continue-button"
                  onClick={() => handleFinishOnboarding(false)}
                  className="text-xs text-slate-400 hover:text-slate-200 underline decoration-slate-600 underline-offset-4 transition py-1 cursor-pointer"
                >
                  Kontynuuj w trybie gościa (postępy mogą zostać utracone)
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default OnboardingOverlay;
