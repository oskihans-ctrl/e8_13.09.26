import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, BookOpen, AlertTriangle, Sparkles, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CKE_FORMULAS_DATA, CKE_FORMULA_TOPICS, CkeFormulaItem } from '../data/ckeFormulasData';

interface CkeFormulasModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTopicId?: string;
}

export const CkeFormulasModal: React.FC<CkeFormulasModalProps> = ({
  isOpen,
  onClose,
  initialTopicId = 'all'
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState(initialTopicId);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Filtered formulas
  const filteredFormulas = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return CKE_FORMULAS_DATA.filter((item: CkeFormulaItem) => {
      // Topic match
      if (selectedTopic !== 'all' && item.topicId !== selectedTopic) {
        return false;
      }

      // Search match
      if (!query) return true;

      const inTitle = item.title.toLowerCase().includes(query);
      const inFormula = item.formula.toLowerCase().includes(query);
      const inTopic = item.topicName.toLowerCase().includes(query);
      const inKeywords = item.keywords.some(k => k.toLowerCase().includes(query));
      const inGolden = item.goldenRule?.toLowerCase().includes(query) ?? false;
      const inTrap = item.ckeTrap?.toLowerCase().includes(query) ?? false;

      return inTitle || inFormula || inTopic || inKeywords || inGolden || inTrap;
    });
  }, [searchQuery, selectedTopic]);

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div 
        id="cke-formulas-modal-backdrop"
        className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 text-white select-none overflow-hidden"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="w-full max-w-2xl max-h-[92vh] sm:max-h-[85vh] bg-[#0E131E] border border-white/10 rounded-t-[28px] sm:rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-[#121824] shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                <BookOpen size={20} />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  Niezbędnik Ósmoklasisty
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                    Egzamin E8
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Cyfrowy niezbędnik wzorów • Reguły, pułapki CKE i wzory na pamięć
                </p>
              </div>
            </div>

            <button
              id="cke-formulas-close-button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
              aria-label="Zamknij"
            >
              <X size={18} />
            </button>
          </div>

          {/* Search bar & Category filters */}
          <div className="p-4 bg-[#0B0F17] border-b border-white/5 flex flex-col gap-3 shrink-0">
            {/* Search Input */}
            <div className="relative w-full">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                id="cke-formulas-search-input"
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Szukaj wzoru (np. pitagoras, potęgi, ułamki, prędkość, pola)..."
                className="w-full bg-[#141B26] border border-white/10 focus:border-cyan-400/60 rounded-xl pl-10 pr-9 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 rounded-md"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Topic Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 -mb-1">
              <Filter size={13} className="text-slate-500 shrink-0 mr-1" />
              {CKE_FORMULA_TOPICS.map(topic => {
                const isSelected = selectedTopic === topic.id;
                return (
                  <button
                    key={topic.id}
                    onClick={() => setSelectedTopic(topic.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                      isSelected
                        ? 'bg-cyan-500 text-slate-950 font-bold shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                        : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5'
                    }`}
                  >
                    {topic.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Formulas List */}
          <div 
            id="cke-formulas-list"
            className="flex-1 overflow-y-auto p-4 space-y-3.5"
            style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom, 24px))' }}
          >
            {filteredFormulas.length === 0 ? (
              <div className="py-12 text-center flex flex-col items-center justify-center">
                <BookOpen size={36} className="text-slate-600 mb-2" />
                <p className="text-sm font-semibold text-slate-300">Nie znaleziono wzorów</p>
                <p className="text-xs text-slate-500 mt-1">
                  Spróbuj wpisać inną frazę lub wybrać inny dział.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedTopic('all');
                  }}
                  className="mt-3 px-4 py-1.5 rounded-xl bg-white/10 text-xs font-semibold text-slate-200 hover:bg-white/15 cursor-pointer"
                >
                  Pokaż wszystkie wzory
                </button>
              </div>
            ) : (
              filteredFormulas.map(item => (
                <div
                  key={item.id}
                  className="bg-[#121824] border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col gap-3 shadow-sm hover:border-cyan-500/30 transition-all"
                >
                  {/* Top Bar: Title & Topic Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-white text-sm sm:text-base leading-snug">
                      {item.title}
                    </h3>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full shrink-0">
                      {item.topicName}
                    </span>
                  </div>

                  {/* Formula High-Contrast Display */}
                  <div className="bg-[#090D14] border border-cyan-500/20 rounded-xl p-3.5 sm:p-4 text-center font-mono text-cyan-300 font-bold text-sm sm:text-base leading-relaxed tracking-wide shadow-inner whitespace-pre-line">
                    {item.formula}
                  </div>

                  {/* Explanation */}
                  {item.explanation && (
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {item.explanation}
                    </p>
                  )}

                  {/* Golden Rule & Exam Trap */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    {item.goldenRule && (
                      <div className="bg-sky-500/10 border border-sky-500/20 rounded-xl p-3 flex items-start gap-2 text-xs text-sky-200">
                        <Sparkles size={15} className="text-sky-400 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <strong className="block text-sky-300 font-bold text-[11px] uppercase tracking-wider mb-0.5">
                            Złota Zasada E8
                          </strong>
                          <span>{item.goldenRule}</span>
                        </div>
                      </div>
                    )}

                    {item.ckeTrap && (
                      <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 flex items-start gap-2 text-xs text-rose-200">
                        <AlertTriangle size={15} className="text-rose-400 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <strong className="block text-rose-300 font-bold text-[11px] uppercase tracking-wider mb-0.5">
                            Typowa Pułapka Egzaminacyjna
                          </strong>
                          <span>{item.ckeTrap}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-3.5 sm:p-4 border-t border-white/10 bg-[#121824] flex items-center justify-end shrink-0">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs sm:text-sm font-bold transition-all cursor-pointer"
            >
              Wróć do lekcji
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
