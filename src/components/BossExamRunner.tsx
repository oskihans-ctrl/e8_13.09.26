import React, { useState, useEffect, useRef } from 'react';
import { 
  Trophy, 
  Clock, 
  X, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  BookOpen, 
  Award,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';
import { MathRenderer } from './MathRenderer';
import { BossExamData, BossExamTask, generateBossExam, generateDzial1BossExam } from '../data/dzial1TaskPool';
import { triggerHaptic, playSuccessSound, playErrorSound } from '../utils';

interface BossExamRunnerProps {
  topicNumericId?: number;
  initialExamData?: BossExamData;
  onCompleteExam: (score: number, passed: boolean, xp: number, coins: number, badgeId: string) => void;
  onCancel: () => void;
}

export const BossExamRunner: React.FC<BossExamRunnerProps> = ({
  topicNumericId = 1,
  initialExamData,
  onCompleteExam,
  onCancel
}) => {
  const [examData, setExamData] = useState<BossExamData>(() => initialExamData || generateBossExam(topicNumericId));
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [openAnswers, setOpenAnswers] = useState<Record<number, string>>({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(15 * 60); // 15 min
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [showExitConfirm, setShowExitConfirm] = useState<boolean>(false);
  const [resultScore, setResultScore] = useState<number>(0);
  const [isPassed, setIsPassed] = useState<boolean>(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Timer countdown
  useEffect(() => {
    if (isFinished) return;

    timerRef.current = setInterval(() => {
      setTimeLeftSeconds(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleFinishExamAuto();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isFinished, selectedAnswers, openAnswers]);

  const currentTask: BossExamTask = examData.tasks[currentIndex];
  const isOpenTask = currentTask?.type === 'OPEN_PROOF' || (!currentTask?.options || currentTask?.options.length === 0);

  // Format mm:ss
  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSelectOption = (optId: string) => {
    triggerHaptic('light');
    setSelectedAnswers(prev => ({
      ...prev,
      [currentIndex]: optId
    }));
  };

  const handleOpenAnswerChange = (val: string) => {
    setOpenAnswers(prev => ({
      ...prev,
      [currentIndex]: val
    }));
  };

  // Evaluation of the 7 questions
  const evaluateExam = () => {
    let score = 0;
    examData.tasks.forEach((task, idx) => {
      const isTaskOpen = task.type === 'OPEN_PROOF' || (!task.options || task.options.length === 0);
      if (isTaskOpen) {
        const text = (openAnswers[idx] || '').toLowerCase();
        // Generous rubric for open proof in exam: basic algebra steps or key factorisation
        if (text.length > 20 && (text.includes('podziel') || text.includes('całkowit') || text.includes('k') || text.includes('2^') || text.includes('3n') || text.includes('4k'))) {
          score += 1;
        }
      } else {
        const selected = selectedAnswers[idx];
        if (selected && selected === task.correct_answer) {
          score += 1;
        }
      }
    });
    return score;
  };

  const handleFinishExamAuto = () => {
    const score = evaluateExam();
    const passed = score >= examData.passingScore; // 5 out of 7
    setResultScore(score);
    setIsPassed(passed);
    setIsFinished(true);

    if (passed) {
      triggerHaptic('success');
      playSuccessSound();
      try {
        confetti({
          particleCount: 80,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#F59E0B', '#10B981', '#06B6D4', '#EAB308']
        });
      } catch (e) {}
    } else {
      triggerHaptic('error');
      playErrorSound();
    }
  };

  const handleRestartExam = () => {
    const newExam = generateBossExam(topicNumericId);
    setExamData(newExam);
    setCurrentIndex(0);
    setSelectedAnswers({});
    setOpenAnswers({});
    setTimeLeftSeconds(15 * 60);
    setIsFinished(false);
    setResultScore(0);
    setIsPassed(false);
  };

  const handleFinalClaim = () => {
    onCompleteExam(
      resultScore,
      isPassed,
      isPassed ? examData.rewardXp : 30,
      isPassed ? examData.rewardCoins : 10,
      examData.badgeId
    );
  };

  // Results Screen
  if (isFinished) {
    const percent = Math.round((resultScore / examData.totalQuestions) * 100);

    return (
      <div 
        id="boss-exam-results-screen"
        className="fixed inset-0 z-50 bg-[#070A0F]/95 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 text-white select-none overflow-y-auto"
      >
        <div className="w-full max-w-xl bg-[#0B0F19] rounded-3xl border border-white/10 flex flex-col p-6 sm:p-8 text-white relative shadow-2xl my-auto">
          
          <div className="flex flex-col items-center text-center">
            {/* Crown / Trophy icon */}
            <div className="relative mb-5 flex items-center justify-center">
              <div className={`absolute w-36 h-36 rounded-full blur-2xl pointer-events-none ${
                isPassed ? 'bg-sky-500/25' : 'bg-rose-500/20'
              }`} />
              <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center border-2 z-10 shadow-xl ${
                isPassed 
                  ? 'bg-gradient-to-br from-sky-400/25 to-blue-600/20 border-sky-400/80 text-sky-400 shadow-sky-500/30' 
                  : 'bg-gradient-to-br from-rose-500/20 to-slate-800 border-rose-500/50 text-rose-400'
              }`}>
                {isPassed ? (
                  <Trophy size={48} className="text-sky-400" />
                ) : (
                  <AlertTriangle size={44} className="text-rose-400" />
                )}
              </div>
            </div>

            <span className={`text-xs uppercase font-extrabold tracking-wider px-3 py-1 rounded-full border mb-3 ${
              isPassed 
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' 
                : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
            }`}>
              {isPassed ? 'SPRAWDZIAN ZALICZONY' : 'SPRAWDZIAN NIEZALICZONY'}
            </span>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
              {isPassed ? 'Dział 1 Opanowany!' : 'Wymagana powtórka materiału'}
            </h1>

            <p className="text-sm sm:text-base text-slate-300 mb-6 max-w-md">
              {isPassed 
                ? 'Gratulacje! Osiągnąłeś próg egzaminacyjny z Działu 1: Liczby Rzeczywiste. Odznaka Mistrza Działu oraz Dział 2 zostały odblokowane!' 
                : 'Do zaliczenia wymagane jest min. 5 z 7 punktów (70%). Przeanalizuj poniższe tematy z błędami i spróbuj ponownie.'}
            </p>

            {/* Score pill */}
            <div className="w-full bg-[#101726] rounded-2xl border border-white/10 p-4 mb-6 flex items-center justify-around">
              <div className="text-center">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Wynik</span>
                <span className="text-2xl sm:text-3xl font-black text-white">
                  {resultScore} <span className="text-sm font-normal text-slate-400">/ 7 pkt</span>
                </span>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div className="text-center">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Skuteczność</span>
                <span className={`text-2xl sm:text-3xl font-black ${isPassed ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {percent}%
                </span>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div className="text-center">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Nagroda</span>
                <span className="text-lg sm:text-xl font-black text-sky-400 flex items-center justify-center gap-1">
                  +{isPassed ? examData.rewardXp : 30} XP
                </span>
              </div>
            </div>

            {/* Diagnostics breakdown per lesson */}
            <div className="w-full text-left mb-6">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                Przegląd pytań i tematów maturalnych:
              </h3>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {examData.tasks.map((t, idx) => {
                  const isTaskOpen = t.type === 'OPEN_PROOF' || (!t.options || t.options.length === 0);
                  const userAns = selectedAnswers[idx];
                  const isOpenOk = isTaskOpen && (openAnswers[idx] || '').length > 20;
                  const isOk = isTaskOpen ? isOpenOk : (userAns === t.correct_answer);

                  return (
                    <div 
                      key={t.id}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                        isOk 
                          ? 'bg-emerald-950/20 border-emerald-500/20 text-slate-200' 
                          : 'bg-rose-950/20 border-rose-500/20 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {isOk ? (
                          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                        ) : (
                          <XCircle size={16} className="text-rose-400 shrink-0" />
                        )}
                        <div className="truncate">
                          <span className="font-bold text-white block truncate">
                            Lekcja {t.lessonId}: {t.topicLabel}
                          </span>
                          {!isOk && !isTaskOpen && (
                            <span className="text-[11px] text-rose-300">
                              Twoja odp: {userAns || 'brak'} • Prawidłowa: {t.correct_answer}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                        isOk ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                      }`}>
                        {isOk ? '1 pkt' : '0 pkt'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action buttons */}
            <div className="w-full flex flex-col sm:flex-row gap-3">
              {isPassed ? (
                <button
                  id="boss-exam-claim-success-button"
                  onClick={handleFinalClaim}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:brightness-110 text-slate-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 active:scale-98 transition-all cursor-pointer"
                >
                  <Award size={18} />
                  <span>ODBIERZ ZŁOTĄ ODZNAKĘ I ODBLOKUJ DZIAŁ 2</span>
                </button>
              ) : (
                <>
                  <button
                    id="boss-exam-retry-button"
                    onClick={handleRestartExam}
                    className="flex-1 py-3.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer shadow-md shadow-cyan-500/25"
                  >
                    <RefreshCw size={15} />
                    <span>POWTÓRZ SPRAWDZIAN (NOWY ZESTAW)</span>
                  </button>
                  <button
                    id="boss-exam-exit-fail-button"
                    onClick={onCancel}
                    className="py-3.5 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition active:scale-98 cursor-pointer border border-white/10"
                  >
                    Wróć do powtórki lekcji
                  </button>
                </>
              )}
            </div>

          </div>
        </div>
      </div>
    );
  }

  // Active Exam View
  const answeredCount = Object.keys(selectedAnswers).length + Object.keys(openAnswers).filter(k => (openAnswers[Number(k)] || '').trim().length > 0).length;
  const isTimeCritical = timeLeftSeconds < 180; // < 3 min

  if (!currentTask || examData.tasks.length === 0) {
    return (
      <div 
        id="boss-exam-screen-empty"
        className="fixed inset-0 z-50 bg-[#070A0F] flex flex-col items-center justify-center p-6 text-white text-center"
      >
        <div className="max-w-md w-full p-8 rounded-3xl bg-[#0F172A]/90 border border-white/10 shadow-2xl flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mb-4">
            <AlertTriangle size={32} />
          </div>
          <h2 className="text-xl font-bold mb-2">Brak pytań w sprawdzianie</h2>
          <p className="text-sm text-slate-300 mb-6 leading-relaxed">
            W bazie nie ma jeszcze zadań dla tego działu. Sprawdzian zostanie aktywowany automatycznie po załadowaniu zadań z bazy Firebase.
          </p>
          <button
            onClick={onCancel}
            className="w-full py-3.5 px-6 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm uppercase tracking-wider transition active:scale-98 cursor-pointer shadow-lg shadow-cyan-500/20"
          >
            Wróć do wyboru tematów
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      id="boss-exam-screen"
      className="fixed inset-0 z-50 bg-[#070A0F] flex flex-col text-white select-none overflow-hidden"
    >
      {/* Top Exam Header */}
      <header className="w-full bg-[#0B0F19] border-b border-white/10 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            id="boss-exam-exit-button"
            onClick={() => setShowExitConfirm(true)}
            className="w-9 h-9 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition flex items-center justify-center cursor-pointer"
            title="Przerwij sprawdzian"
          >
            <X size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                Sprawdzian Działu 1
              </span>
              <span className="text-xs text-slate-400">
                Pytanie {currentIndex + 1} z {examData.totalQuestions}
              </span>
            </div>
            <h2 className="text-xs sm:text-sm font-bold text-slate-200">
              {currentTask.topicLabel}
            </h2>
          </div>
        </div>

        {/* 15 min Timer */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border font-mono font-bold text-sm ${
          isTimeCritical 
            ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 animate-pulse' 
            : 'bg-slate-900 border-white/10 text-cyan-300'
        }`}>
          <Clock size={16} className={isTimeCritical ? 'text-rose-400' : 'text-cyan-400'} />
          <span>{formatTime(timeLeftSeconds)}</span>
        </div>
      </header>

      {/* Navigation segments 1 to 7 */}
      <div className="w-full bg-[#090D14] px-4 py-2 border-b border-white/5 flex items-center justify-center gap-1.5 sm:gap-2">
        {examData.tasks.map((_, idx) => {
          const isAnswered = selectedAnswers[idx] !== undefined || (openAnswers[idx] || '').trim().length > 0;
          const isCurrent = currentIndex === idx;

          return (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-7 px-2.5 sm:px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                isCurrent 
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30 scale-105' 
                  : isAnswered 
                    ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300' 
                    : 'bg-slate-900 border border-white/5 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <span>{idx + 1}</span>
              {isAnswered && !isCurrent && <CheckCircle2 size={10} className="text-emerald-400" />}
            </button>
          );
        })}
      </div>

      {/* Question Content Area */}
      <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 max-w-3xl w-full mx-auto flex flex-col justify-between">
        <div className="space-y-6">
          {/* Question banner */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[#0F1622] border border-white/10 shadow-lg">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-3 border-b border-white/5 pb-2">
              <span className="font-semibold">{currentTask.source}</span>
              <span className="font-bold text-sky-400">{currentTask.points} pkt</span>
            </div>

            <div className="text-base sm:text-lg font-medium text-white leading-relaxed">
              <MathRenderer content={currentTask.question} displayMode={true} />
            </div>
          </div>

          {/* Options or Open proof input */}
          {isOpenTask ? (
            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                Twoje rozwiązanie algebraiczne i wniosek:
              </label>
              <textarea
                value={openAnswers[currentIndex] || ''}
                onChange={(e) => handleOpenAnswerChange(e.target.value)}
                placeholder="Zapisz przekształcenia (np. wyłączenie przed nawias, rozkład na czynniki) oraz uzasadnienie podzielności..."
                rows={5}
                className="w-full rounded-2xl bg-slate-900/80 border border-white/10 p-4 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition text-sm leading-relaxed"
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentTask.options?.map((opt) => {
                const isSelected = selectedAnswers[currentIndex] === opt.id;

                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectOption(opt.id)}
                    className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-950/40 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                        : 'bg-slate-900/60 border-white/10 hover:border-white/20 text-slate-300 hover:bg-slate-800/60'
                    }`}
                  >
                    <span className={`w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 border ${
                      isSelected 
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-extrabold' 
                        : 'bg-slate-800 border-white/10 text-slate-400'
                    }`}>
                      {opt.id}
                    </span>
                    <div className="text-sm font-medium flex-1 pt-0.5">
                      <MathRenderer content={(opt as any).content_latex || (opt as any).text || ''} />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Navigation bottom bar */}
        <div className="pt-6 mt-6 border-t border-white/10 flex items-center justify-between gap-3">
          <button
            onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
            className={`py-3 px-4 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition ${
              currentIndex === 0 
                ? 'opacity-40 cursor-not-allowed text-slate-600 bg-slate-900' 
                : 'text-slate-300 bg-slate-900 hover:bg-slate-800 border border-white/10 cursor-pointer active:scale-95'
            }`}
          >
            <ChevronLeft size={16} />
            <span>Poprzednie</span>
          </button>

          {currentIndex < examData.totalQuestions - 1 ? (
            <button
              onClick={() => setCurrentIndex(prev => Math.min(examData.totalQuestions - 1, prev + 1))}
              className="py-3 px-5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-md shadow-cyan-500/20"
            >
              <span>Następne pytanie</span>
              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              id="boss-exam-finish-submit-button"
              onClick={handleFinishExamAuto}
              className="py-3.5 px-6 rounded-xl bg-gradient-to-r from-sky-400 to-[#00C2FF] hover:brightness-110 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-2 transition active:scale-95 cursor-pointer shadow-lg shadow-sky-500/30"
            >
              <Award size={16} />
              <span>ZAKOŃCZ I OCEŃ SPRAWDZIAN ({answeredCount}/7)</span>
            </button>
          )}
        </div>
      </main>

      {/* Exit confirmation modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B0F19] rounded-2xl border border-white/10 p-6 max-w-sm w-full text-center">
            <AlertTriangle size={36} className="text-sky-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-2">Przerwać sprawdzian?</h3>
            <p className="text-xs text-slate-300 mb-5 leading-relaxed">
              Sprawdzian jest w toku. Jeśli wyjdziesz teraz, Twoje dotychczasowe odpowiedzi nie zostaną zaliczone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold cursor-pointer"
              >
                Kontynuuj sprawdzian
              </button>
              <button
                onClick={onCancel}
                className="py-2.5 px-4 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-bold cursor-pointer"
              >
                Przerwij
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
