import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, CheckCircle2, XCircle, Clock, RotateCcw, ArrowLeft, ChevronDown, ChevronUp, Sparkles, BookOpen, AlertCircle } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export interface MaturaTaskReviewItem {
  id: string;
  section: string;
  content: string;
  options: string[];
  correctAnswer: string;
  points: number;
  isClosed: boolean;
  explanation: string;
  userAnswer?: string;
  userPointsEarned: number;
  isFlagged?: boolean;
}

interface MaturaExamReviewProps {
  tasks: MaturaTaskReviewItem[];
  timeSpentSeconds: number;
  onRetryMistakes: (mistakeTasks: MaturaTaskReviewItem[]) => void;
  onBackToMenu: () => void;
  xpAwarded?: number;
  coinsAwarded?: number;
}

export function MaturaExamReview({
  tasks,
  timeSpentSeconds,
  onRetryMistakes,
  onBackToMenu,
  xpAwarded = 0,
}: MaturaExamReviewProps) {
  const [filter, setFilter] = useState<'all' | 'mistakes'>('all');
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  const totalPoints = tasks.reduce((sum, t) => sum + t.points, 0);
  const earnedPoints = tasks.reduce((sum, t) => sum + t.userPointsEarned, 0);
  const percentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
  const isPassed = percentage >= 30;

  const mistakes = tasks.filter(t => t.userPointsEarned < t.points);
  const displayedTasks = filter === 'mistakes' ? mistakes : tasks;

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
  };

  const renderMathContent = (content: string) => (
    <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed overflow-x-auto py-1 -my-1 text-slate-800 dark:text-slate-200">
      <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
        {content}
      </Markdown>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-6"
    >
      {/* Top Banner Card */}
      <div className="bg-white dark:bg-[#131B29] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 text-center shadow-xs">
        <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Trophy className="text-amber-500" size={28} />
        </div>

        <span className={`inline-block text-xs font-bold uppercase px-3 py-1 rounded-full mb-3 border ${
          isPassed 
            ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800/40' 
            : 'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-900/40'
        }`}>
          {isPassed ? '✓ Egzamin Zdany (≥ 30%)' : '✕ Poniżej progu 30%'}
        </span>

        <h2 className="text-3xl font-display font-bold text-slate-900 dark:text-white mb-1.5">
          {earnedPoints} / {totalPoints} pkt ({percentage}%)
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm max-w-md mx-auto mb-6">
          {percentage >= 80 
            ? 'Znakomity wynik! Świetne opanowanie standardów egzaminacyjnych CKE.'
            : percentage >= 50
            ? 'Dobry wynik! Przeanalizuj popełnione błędy, aby podbić wynik powyżej 80%.'
            : isPassed
            ? 'Próg zdawalności osiągnięty. Zalecamy przećwiczenie pytań z bazy błędów.'
            : 'Nie poddawaj się! Wykorzystaj klucz odpowiedzi CKE i powtórz ten zestaw.'}
        </p>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-xl p-3 sm:p-4 mb-6 text-left">
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">Czas arkusza</span>
            <div className="flex items-center gap-1.5 mt-0.5 text-slate-800 dark:text-slate-200 font-bold text-xs sm:text-sm">
              <Clock size={13} className="text-amber-500" />
              <span>{formatTime(timeSpentSeconds)}</span>
            </div>
          </div>

          <div>
            <span className="text-[11px] text-slate-400 block font-medium">Błędy do powtórki</span>
            <div className="flex items-center gap-1.5 mt-0.5 text-slate-800 dark:text-slate-200 font-bold text-xs sm:text-sm">
              <AlertCircle size={13} className={mistakes.length > 0 ? 'text-amber-600' : 'text-emerald-500'} />
              <span>{mistakes.length} zad.</span>
            </div>
          </div>

          <div>
            <span className="text-[11px] text-slate-400 block font-medium">Nagroda</span>
            <div className="flex items-center gap-1 mt-0.5 text-amber-700 dark:text-amber-400 font-bold text-xs sm:text-sm">
              <Sparkles size={13} />
              <span>+{xpAwarded} XP</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          {mistakes.length > 0 && (
            <button
              type="button"
              onClick={() => onRetryMistakes(mistakes)}
              className="flex-1 py-3 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
            >
              <RotateCcw size={15} />
              <span>Przećwicz tylko błędy ({mistakes.length})</span>
            </button>
          )}

          <button
            type="button"
            onClick={onBackToMenu}
            className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <ArrowLeft size={15} />
            <span>Wróć do menu</span>
          </button>
        </div>
      </div>

      {/* Review Section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen size={16} className="text-amber-500" />
            Szczegółowy przegląd arkusza
          </h3>

          {/* Filters */}
          <div className="flex bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 p-0.5 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                filter === 'all' 
                  ? 'bg-white dark:bg-[#131B29] text-slate-900 dark:text-white shadow-xs' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Wszystkie ({tasks.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('mistakes')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                filter === 'mistakes' 
                  ? 'bg-white dark:bg-[#131B29] text-slate-900 dark:text-white shadow-xs' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Błędne ({mistakes.length})
            </button>
          </div>
        </div>

        {/* Task Cards */}
        <div className="space-y-3">
          {displayedTasks.map((task) => {
            const originalIndex = tasks.findIndex(t => t.id === task.id) + 1;
            const isFullScore = task.userPointsEarned === task.points;
            const isPartial = task.userPointsEarned > 0 && task.userPointsEarned < task.points;
            const isExpanded = expandedTaskId === task.id;

            return (
              <div
                key={task.id}
                className="bg-white dark:bg-[#131B29] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden transition-all shadow-xs"
              >
                {/* Header Row */}
                <button
                  type="button"
                  onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                      isFullScore 
                        ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40' 
                        : isPartial
                        ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-800/40'
                        : 'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40'
                    }`}>
                      {originalIndex}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-900 dark:text-white font-bold text-sm">
                          Zadanie {originalIndex}
                        </span>
                        <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                          {task.section}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 block mt-0.5">
                        {task.isClosed ? 'Zadanie zamknięte' : 'Zadanie otwarte'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className={`text-xs sm:text-sm font-bold ${
                        isFullScore ? 'text-emerald-600 dark:text-emerald-400' : isPartial ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'
                      }`}>
                        {task.userPointsEarned} / {task.points} pkt
                      </span>
                    </div>

                    {isExpanded ? (
                      <ChevronUp size={16} className="text-slate-400" />
                    ) : (
                      <ChevronDown size={16} className="text-slate-400" />
                    )}
                  </div>
                </button>

                {/* Expanded Content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-4 pb-5 pt-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30"
                    >
                      {/* Task Question Content */}
                      <div className="mb-4 text-slate-900 dark:text-white">
                        {renderMathContent(task.content)}
                      </div>

                      {/* Closed Questions Comparison */}
                      {task.isClosed && (
                        <div className="space-y-2 mb-4">
                          {task.options.map((opt, optIdx) => {
                            const optLetter = String.fromCharCode(65 + optIdx);
                            const isUserPick = task.userAnswer === optLetter;
                            const isCorrectPick = task.correctAnswer.includes(optLetter);

                            let itemStyle = 'bg-white dark:bg-[#131B29] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300';
                            if (isCorrectPick) {
                              itemStyle = 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 font-medium';
                            } else if (isUserPick && !isCorrectPick) {
                              itemStyle = 'bg-rose-50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900 text-rose-900 dark:text-rose-200';
                            }

                            return (
                              <div
                                key={optIdx}
                                className={`p-3 rounded-xl border flex items-center justify-between text-xs sm:text-sm ${itemStyle}`}
                              >
                                <div className="flex items-start gap-2.5">
                                  <span className="font-bold shrink-0">{optLetter}.</span>
                                  <div>{renderMathContent(opt)}</div>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                  {isCorrectPick && (
                                    <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 text-xs font-bold bg-emerald-100 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                                      <CheckCircle2 size={12} /> Poprawna
                                    </span>
                                  )}
                                  {isUserPick && !isCorrectPick && (
                                    <span className="flex items-center gap-1 text-rose-700 dark:text-rose-400 text-xs font-bold bg-rose-100 dark:bg-rose-950/40 px-2 py-0.5 rounded">
                                      <XCircle size={12} /> Twój wybór
                                    </span>
                                  )}
                                  {isUserPick && isCorrectPick && (
                                    <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 text-xs font-bold bg-emerald-100 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                                      Twój wybór
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Open Question Scoring */}
                      {!task.isClosed && (
                        <div className="mb-4 bg-white dark:bg-[#131B29] p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                          <span className="text-xs text-slate-400 block mb-0.5">Przyznane punkty według klucza CKE:</span>
                          <span className="text-sm font-bold text-slate-900 dark:text-white">
                            {task.userPointsEarned} z {task.points} punktów
                          </span>
                        </div>
                      )}

                      {/* CKE Explanation */}
                      <div className="bg-white dark:bg-[#131B29] border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-2">
                          <CheckCircle2 size={13} />
                          Klucz i wyjaśnienie CKE
                        </div>
                        <div className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed">
                          {renderMathContent(task.explanation)}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

export default MaturaExamReview;
