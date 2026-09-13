import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Keyboard, PenTool, CheckCircle2, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { triggerHaptic } from '../utils';
import { SmartMathKeyboard } from './SmartMathKeyboard';
import { Whiteboard } from './Whiteboard';

export type MathInputMode = 'keyboard' | 'handwriting';

interface MathAnswerModuleProps {
  answer: string;
  onAnswerChange: (val: string) => void;
  whiteboardData: string | null;
  onWhiteboardChange: (dataUrl: string) => void;
  solutionOnCanvas: boolean;
  onSolutionOnCanvasChange: (onCanvas: boolean) => void;
  onCheckAnswer: () => void;
  isEvaluating?: boolean;
  onAskAI?: () => void;
  attemptCount?: number;
}

export function MathAnswerModule({
  answer,
  onAnswerChange,
  whiteboardData,
  onWhiteboardChange,
  solutionOnCanvas,
  onSolutionOnCanvasChange,
  onCheckAnswer,
  isEvaluating = false,
  onAskAI,
  attemptCount = 1,
}: MathAnswerModuleProps) {
  const [activeMode, setActiveMode] = useState<MathInputMode>('keyboard');

  const handleModeChange = (mode: MathInputMode) => {
    triggerHaptic('light');
    setActiveMode(mode);
  };

  const isReadyToSubmit =
    (typeof answer === 'string' && answer.trim().length > 0) ||
    solutionOnCanvas ||
    Boolean(whiteboardData);

  return (
    <div className="flex flex-col w-full gap-4">
      {/* ------------------------------------------------------------- */}
      {/* 1. ELEGANT FLOATING MODE SWITCHER (Segmented Control)         */}
      {/* ------------------------------------------------------------- */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center p-1 bg-[#0B0F17] border border-white/10 rounded-full shadow-lg relative">
          {/* Keyboard Option */}
          <button
            type="button"
            onClick={() => handleModeChange('keyboard')}
            className={`relative z-10 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black transition-colors ${
              activeMode === 'keyboard' ? 'text-black' : 'text-[#8B8D98] hover:text-white'
            }`}
          >
            <Keyboard size={14} />
            <span>Klawiatura</span>
            {activeMode === 'keyboard' && (
              <motion.div
                layoutId="activeModePill"
                className="absolute inset-0 bg-[#00E5FF] rounded-full -z-10 shadow-[0_0_18px_rgba(0,229,255,0.4)]"
                transition={{ type: 'spring', damping: 25, stiffness: 320 }}
              />
            )}
          </button>

          {/* Handwriting Option */}
          <button
            type="button"
            onClick={() => handleModeChange('handwriting')}
            className={`relative z-10 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black transition-colors ${
              activeMode === 'handwriting' ? 'text-black' : 'text-[#8B8D98] hover:text-white'
            }`}
          >
            <PenTool size={14} />
            <span>Pismo odręczne</span>
            {activeMode === 'handwriting' && (
              <motion.div
                layoutId="activeModePill"
                className="absolute inset-0 bg-[#00E5FF] rounded-full -z-10 shadow-[0_0_18px_rgba(0,229,255,0.4)]"
                transition={{ type: 'spring', damping: 25, stiffness: 320 }}
              />
            )}
          </button>
        </div>

        {/* Quick info or AI Tutor shortcut */}
        <div className="flex items-center gap-2">
          {onAskAI && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                onAskAI();
              }}
              className="flex items-center gap-1 text-[11px] font-bold text-[#8B8D98] hover:text-[#00E5FF] transition-colors py-1 px-2 rounded-lg hover:bg-white/5"
            >
              <Sparkles size={12} className="text-[#00E5FF]" />
              <span>Wskazówka AI</span>
            </button>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. MODE CONTENT (Animated Transition)                         */}
      {/* ------------------------------------------------------------- */}
      <div className="w-full">
        {activeMode === 'keyboard' ? (
          <motion.div
            key="keyboard-mode"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            <SmartMathKeyboard
              value={answer}
              onChange={onAnswerChange}
              onSubmit={onCheckAnswer}
              isSubmitting={isEvaluating}
            />
          </motion.div>
        ) : (
          <motion.div
            key="handwriting-mode"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            <Whiteboard
              onDraw={onWhiteboardChange}
              finalAnswer={answer}
              onFinalAnswerChange={onAnswerChange}
              solutionOnCanvas={solutionOnCanvas}
              onSolutionOnCanvasChange={onSolutionOnCanvasChange}
              initialHeight={360}
            />
          </motion.div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. PRIMARY ACTION CTA BUTTON (Check Solution)                 */}
      {/* ------------------------------------------------------------- */}
      <div className="pt-2">
        <button
          type="button"
          disabled={!isReadyToSubmit || isEvaluating}
          onClick={() => {
            triggerHaptic('medium');
            onCheckAnswer();
          }}
          className={`w-full py-3.5 px-6 rounded-2xl font-black text-base flex items-center justify-center gap-2 transition-all ${
            isReadyToSubmit && !isEvaluating
              ? 'bg-[#00C2FF] hover:bg-[#00B4E6] border-b-4 border-[#0099CC] text-[#0B131E] shadow-[0_0_20px_rgba(0,194,255,0.25)] active:translate-y-1 active:border-b-0 cursor-pointer'
              : 'bg-[#141C28] border border-white/5 text-[#8B8D98]/50 cursor-not-allowed'
          }`}
        >
          {isEvaluating ? (
            <>
              <Loader2 size={20} className="animate-spin text-black" />
              <span>AI Tutor analizuje rozwiązanie...</span>
            </>
          ) : (
            <>
              <span>Sprawdź rozwiązanie</span>
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
