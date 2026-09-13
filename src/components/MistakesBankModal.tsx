import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Target, CheckCircle2, RotateCcw, ArrowRight, ShieldAlert, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getMistakeTasks, clearMistakesBank } from '../utils/mistakesBank';

interface MistakesBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartRehabSession: (tasks: any[]) => void;
  onNavigateToLessons: () => void;
}

export const MistakesBankModal: React.FC<MistakesBankModalProps> = ({
  isOpen,
  onClose,
  onStartRehabSession,
  onNavigateToLessons
}) => {
  const mistakeTasks = getMistakeTasks();
  const count = mistakeTasks.length;

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleStart = () => {
    onClose();
    onStartRehabSession(mistakeTasks);
  };

  return createPortal(
    <AnimatePresence>
      <div
        id="mistakes-bank-modal-backdrop"
        className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 text-white select-none overflow-hidden"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="w-full max-w-lg max-h-[90vh] sm:max-h-[85vh] bg-[#0E131E] border border-white/10 rounded-t-[28px] sm:rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-[#121824] shrink-0">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                count > 0 
                  ? 'bg-sky-500/15 border-sky-500/30 text-sky-400 shadow-[0_0_15px_rgba(14,165,233,0.25)]' 
                  : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
              }`}>
                <Target size={20} />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  Bank Błędów
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                    count > 0
                      ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  }`}>
                    {count > 0 ? `${count} do poprawy` : 'Czysto! 0 błędów'}
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Spaced Retrieval • Rehabilitacja błędnych odpowiedzi
                </p>
              </div>
            </div>

            <button
              id="mistakes-bank-close-button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
              aria-label="Zamknij"
            >
              <X size={18} />
            </button>
          </div>

          {/* Content */}
          <div 
            id="mistakes-bank-content"
            className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4"
            style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom, 24px))' }}
          >
            {count === 0 ? (
              <div className="py-8 px-4 text-center flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mb-4 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-lg font-bold text-white">Twój Bank Błędów jest czysty!</h3>
                <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-sm leading-relaxed">
                  Nie masz żadnych zadań oczekujących na poprawę. Wszystkie Twoje dotychczasowe odpowiedzi w sesjach były bezbłędne.
                </p>
                <div className="mt-5 p-3.5 rounded-2xl bg-white/5 border border-white/10 text-left max-w-sm w-full">
                  <div className="flex items-center gap-2 text-xs font-semibold text-cyan-300 mb-1">
                    <Sparkles size={14} />
                    <span>Jak działa Bank Błędów?</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Gdy w trakcie lekcji zaznaczysz błędną odpowiedź, zadanie automatycznie trafi tutaj, by umożliwić ekspresową sesję rehabilitacyjną.
                  </p>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    onNavigateToLessons();
                  }}
                  className="mt-6 w-full py-3.5 px-6 rounded-2xl font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 active:scale-[0.98] transition shadow-[0_0_20px_rgba(6,182,212,0.3)] flex items-center justify-center gap-2 text-sm cursor-pointer"
                >
                  <span>Przejdź do Mapy Lekcji</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            ) : (
              <>
                {/* Method explanation banner */}
                <div className="p-3.5 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-start gap-3">
                  <ShieldAlert size={18} className="text-sky-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-sky-200/90 leading-relaxed">
                    <strong className="block text-sky-300 font-bold mb-0.5">
                      Trening Eliminacji Pomyłek (Spaced Retrieval)
                    </strong>
                    Rozwiązanie tych zadań w sesji rehabilitacyjnej trwale usuwa błędne schematy myślowe przed Egzaminem Ósmoklasisty (E8).
                  </div>
                </div>

                {/* List of Tasks in Bank */}
                <div className="space-y-2.5 pt-1">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Zadania do rehabilitacji ({count}):
                  </div>
                  {mistakeTasks.map((task, idx) => (
                    <div
                      key={task.id || idx}
                      className="p-3.5 rounded-xl bg-[#141B26] border border-white/5 flex items-start gap-3 hover:border-white/15 transition-all"
                    >
                      <div className="w-6 h-6 rounded-lg bg-sky-500/20 text-sky-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-200 line-clamp-2 leading-snug">
                          {task.question}
                        </p>
                        <div className="mt-1.5 flex items-center gap-2 text-[10px] text-slate-400">
                          {task.tierLabel && (
                            <span className="font-semibold text-slate-300">
                              {task.tierLabel}
                            </span>
                          )}
                          <span>•</span>
                          <span className="text-sky-400 font-bold">
                            Do powtórki
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-white/10 flex flex-col gap-2.5">
                  <button
                    id="mistakes-bank-start-button"
                    onClick={handleStart}
                    className="w-full py-4 px-6 rounded-2xl font-black text-slate-950 bg-[#00C2FF] hover:bg-[#38BDF8] active:scale-[0.98] transition shadow-[0_0_25px_rgba(0,194,255,0.35)] flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer tracking-wide"
                  >
                    <RotateCcw size={18} className="stroke-[2.5]" />
                    <span>ROZPOCZNIJ REHABILITACJĘ ({count} ZAD.)</span>
                  </button>

                  <button
                    onClick={() => {
                      clearMistakesBank();
                      onClose();
                    }}
                    className="w-full py-2.5 text-xs text-slate-400 hover:text-slate-200 transition text-center cursor-pointer"
                  >
                    Wyczyść zadania z Banku Błędów
                  </button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
