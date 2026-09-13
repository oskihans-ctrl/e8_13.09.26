import React, { useState } from 'react';
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
  coinsAwarded = 0,
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
    <div className="prose prose-invert max-w-none text-sm leading-relaxed overflow-x-auto py-2 -my-2">
      <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
        {content}
      </Markdown>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-6"
    >
      {/* Top Banner Card */}
      <div className="bg-[#1A1B23] border border-white/10 rounded-[28px] p-6 sm:p-8 text-center relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-16 h-16 bg-gradient-to-tr from-purple-500/20 to-blue-500/20 border border-purple-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Trophy className="text-purple-400" size={32} />
        </div>

        <span className={`inline-block text-xs font-extrabold uppercase px-3 py-1 rounded-full mb-3 border ${
          isPassed 
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
        }`}>
          {isPassed ? '✓ Egzamin Zdany (>= 30%)' : '✕ Poniżej progu 30%'}
        </span>

        <h2 className="text-3xl font-display font-black text-white mb-2">
          {earnedPoints} / {totalPoints} pkt ({percentage}%)
        </h2>
        <p className="text-[#8B8D98] text-sm max-w-md mx-auto mb-6">
          {percentage >= 80 
            ? 'Genialny wynik! Perfekcyjne opanowanie materiału i wysoka precyzja.'
            : percentage >= 50
            ? 'Dobry wynik! Przeanalizuj popełnione błędy, aby podbić wynik powyżej 80%.'
            : isPassed
            ? 'Próg zdawalności osiągnięty, ale zalecamy powtórzenie kluczowych zadań.'
            : 'Nie poddawaj się! Wykorzystaj oficjalny klucz odpowiedzi i przećwicz błędy.'}
        </p>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2 bg-[#12131A] border border-white/5 rounded-2xl p-3 sm:p-4 mb-6 text-left">
          <div>
            <span className="text-[11px] text-[#8B8D98] block">Czas arkusza</span>
            <div className="flex items-center gap-1.5 mt-0.5 text-white font-bold text-sm">
              <Clock size={14} className="text-blue-400" />
              <span>{formatTime(timeSpentSeconds)}</span>
            </div>
          </div>

          <div>
            <span className="text-[11px] text-[#8B8D98] block">Błędy do powtórki</span>
            <div className="flex items-center gap-1.5 mt-0.5 text-white font-bold text-sm">
              <AlertCircle size={14} className={mistakes.length > 0 ? 'text-sky-400' : 'text-emerald-400'} />
              <span>{mistakes.length} zad.</span>
            </div>
          </div>

          <div>
            <span className="text-[11px] text-[#8B8D98] block">Nagroda</span>
            <div className="flex items-center gap-1 mt-0.5 text-purple-300 font-bold text-sm">
              <Sparkles size={14} className="text-purple-400" />
              <span>+{xpAwarded} XP</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          {mistakes.length > 0 && (
            <button
              onClick={() => onRetryMistakes(mistakes)}
              className="flex-1 py-3.5 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-600/20"
            >
              <RotateCcw size={16} />
              <span>Przećwicz tylko błędy ({mistakes.length})</span>
            </button>
          )}

          <button
            onClick={onBackToMenu}
            className="flex-1 py-3.5 px-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Wróć do menu</span>
          </button>
        </div>
      </div>

      {/* Review Section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <BookOpen size={18} className="text-purple-400" />
            Szczegółowy przegląd zadań
          </h3>

          {/* Filters */}
          <div className="flex bg-[#1A1B23] border border-white/10 p-0.5 rounded-xl text-xs">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                filter === 'all' ? 'bg-purple-600 text-white' : 'text-[#8B8D98] hover:text-white'
              }`}
            >
              Wszystkie ({tasks.length})
            </button>
            <button
              onClick={() => setFilter('mistakes')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                filter === 'mistakes' ? 'bg-purple-600 text-white' : 'text-[#8B8D98] hover:text-white'
              }`}
            >
              Błędne ({mistakes.length})
            </button>
          </div>
        </div>

        {/* Task Cards */}
        <div className="space-y-3">
          {displayedTasks.map((task, idx) => {
            const originalIndex = tasks.findIndex(t => t.id === task.id) + 1;
            const isFullScore = task.userPointsEarned === task.points;
            const isPartial = task.userPointsEarned > 0 && task.userPointsEarned < task.points;
            const isExpanded = expandedTaskId === task.id;

            return (
              <div
                key={task.id}
                className={`bg-[#1A1B23] border rounded-2xl overflow-hidden transition-all ${
                  isFullScore 
                    ? 'border-emerald-500/20' 
                    : isPartial 
                    ? 'border-sky-500/30' 
                    : 'border-red-500/20'
                }`}
              >
                {/* Header Row */}
                <button
                  onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                      isFullScore 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                        : isPartial
                        ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30'
                        : 'bg-red-500/10 text-red-400 border border-red-500/30'
                    }`}>
                      {originalIndex}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-bold text-sm">
                          Zadanie {originalIndex}
                        </span>
                        <span className="text-xs text-[#8B8D98] bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                          {task.section}
                        </span>
                      </div>
                      <span className="text-xs text-[#8B8D98] block mt-0.5">
                        {task.isClosed ? 'Zadanie zamknięte' : 'Zadanie otwarte'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className={`text-sm font-bold ${
                        isFullScore ? 'text-emerald-400' : isPartial ? 'text-sky-400' : 'text-red-400'
                      }`}>
                        {task.userPointsEarned} / {task.points} pkt
                      </span>
                    </div>

                    {isExpanded ? (
                      <ChevronUp size={18} className="text-[#8B8D98]" />
                    ) : (
                      <ChevronDown size={18} className="text-[#8B8D98]" />
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
                      className="px-4 pb-5 pt-2 border-t border-white/5 bg-[#14151D]"
                    >
                      {/* Task Question Content */}
                      <div className="mb-4 text-white">
                        {renderMathContent(task.content)}
                      </div>

                      {/* Closed Questions Comparison */}
                      {task.isClosed && (
                        <div className="space-y-2 mb-4">
                          {task.options.map((opt, optIdx) => {
                            const optLetter = String.fromCharCode(65 + optIdx);
                            const isUserPick = task.userAnswer === optLetter;
                            const isCorrectPick = task.correctAnswer.includes(optLetter);

                            let itemStyle = 'bg-white/5 border-white/5 text-[#8B8D98]';
                            if (isCorrectPick) {
                              itemStyle = 'bg-emerald-500/10 border-emerald-500/40 text-white';
                            } else if (isUserPick && !isCorrectPick) {
                              itemStyle = 'bg-red-500/10 border-red-500/40 text-white';
                            }

                            return (
                              <div
                                key={optIdx}
                                className={`p-3 rounded-xl border flex items-center justify-between text-xs sm:text-sm ${itemStyle}`}
                              >
                                <div className="flex items-start gap-3">
                                  <span className="font-bold shrink-0">{optLetter}.</span>
                                  <div>{renderMathContent(opt)}</div>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                  {isCorrectPick && (
                                    <span className="flex items-center gap-1 text-emerald-400 text-xs font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                                      <CheckCircle2 size={12} /> Poprawna
                                    </span>
                                  )}
                                  {isUserPick && !isCorrectPick && (
                                    <span className="flex items-center gap-1 text-red-400 text-xs font-bold bg-red-500/10 px-2 py-0.5 rounded">
                                      <XCircle size={12} /> Twój wybór
                                    </span>
                                  )}
                                  {isUserPick && isCorrectPick && (
                                    <span className="flex items-center gap-1 text-emerald-400 text-xs font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
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
                        <div className="mb-4 bg-white/5 p-3 rounded-xl border border-white/5">
                          <span className="text-xs text-[#8B8D98] block mb-1">Przyznane punkty według klucza CKE:</span>
                          <span className="text-sm font-bold text-white">
                            {task.userPointsEarned} z {task.points} punktów
                          </span>
                        </div>
                      )}

                      {/* CKE Explanation */}
                      <div className="bg-[#12131A] border border-white/10 rounded-xl p-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-wider mb-2">
                          <CheckCircle2 size={14} />
                          Klucz i wyjaśnienie CKE
                        </div>
                        <div className="text-[#A1A3B0] text-xs leading-relaxed">
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
