import React, { useState, useEffect, useRef, useCallback } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { Delete, ArrowLeft, ArrowRight, RotateCcw, Check, Sparkles } from 'lucide-react';
import { triggerHaptic } from '../utils';

interface SmartMathKeyboardProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit?: () => void;
  isSubmitting?: boolean;
}

export function SmartMathKeyboard({
  value,
  onChange,
  onSubmit,
  isSubmitting = false,
}: SmartMathKeyboardProps) {
  // Cursor position in raw LaTeX string
  const [cursorPos, setCursorPos] = useState<number>(value.length);
  const [cursorVisible, setCursorVisible] = useState<boolean>(true);
  const backspaceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const backspaceIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Sync cursor when external value changes
  useEffect(() => {
    if (cursorPos > value.length) {
      setCursorPos(value.length);
    }
  }, [value, cursorPos]);

  // Cursor blink interval (1 Hz)
  useEffect(() => {
    const interval = setInterval(() => {
      setCursorVisible((v) => !v);
    }, 530);
    return () => clearInterval(interval);
  }, []);

  // Balance curly braces and brackets for KaTeX rendering safety
  const sanitizeLatexForDisplay = (str: string): string => {
    let openBraces = 0;
    for (let i = 0; i < str.length; i++) {
      if (str[i] === '{') openBraces++;
      else if (str[i] === '}') openBraces = Math.max(0, openBraces - 1);
    }
    return str + '}'.repeat(openBraces);
  };

  // Generate HTML for Live Preview with pulsing cyan cursor
  const getRenderedHtml = useCallback((): string => {
    if (!value || value.trim() === '') {
      const emptyLatex = `\\textcolor{#64748B}{\\text{Wpisz wynik (np. } x = 5, y = \\frac{1}{2} \\text{)... }}\\textcolor{#00E5FF}{${cursorVisible ? '|' : ' '}}`;
      try {
        return katex.renderToString(emptyLatex, {
          displayMode: true,
          throwOnError: false,
        });
      } catch {
        return '<span class="text-[#64748B]">Wpisz wynik...</span>';
      }
    }

    // Insert cursor into formula
    const safeCursor = Math.min(Math.max(0, cursorPos), value.length);
    const before = value.slice(0, safeCursor);
    const after = value.slice(safeCursor);

    // Glowing cyan cursor
    const cursorLatex = cursorVisible
      ? '{\\textcolor{#00E5FF}{\\mathbf{\\vert}}}'
      : '{\\textcolor{#00E5FF22}{\\mathbf{\\vert}}}';

    const fullLatex = sanitizeLatexForDisplay(before + cursorLatex + after);

    try {
      return katex.renderToString(fullLatex, {
        displayMode: true,
        throwOnError: false,
      });
    } catch {
      // Fallback: simple text with cursor
      return `<div class="font-mono text-white text-base">${before}<span class="text-[#00E5FF] font-black animate-pulse">|</span>${after}</div>`;
    }
  }, [value, cursorPos, cursorVisible]);

  // Insert a token / symbol into the formula
  const insertToken = (token: string, cursorOffset?: number) => {
    triggerHaptic('light');
    const safeCursor = Math.min(Math.max(0, cursorPos), value.length);
    const before = value.slice(0, safeCursor);
    const after = value.slice(safeCursor);

    const newValue = before + token + after;
    onChange(newValue);

    const nextPos = cursorOffset !== undefined ? safeCursor + cursorOffset : safeCursor + token.length;
    setCursorPos(nextPos);
  };

  // Smart backspace with token-awareness
  const handleBackspace = () => {
    triggerHaptic('light');
    const safeCursor = Math.min(Math.max(0, cursorPos), value.length);
    if (safeCursor <= 0) return;

    const before = value.slice(0, safeCursor);
    const after = value.slice(safeCursor);

    // Check for common multi-char tokens to delete in one go
    const multiTokens = [
      '\\frac{}{}',
      '\\frac{',
      '\\sqrt{',
      '\\cdot ',
      '\\le ',
      '\\ge ',
      '\\neq ',
      '\\pi ',
      '\\infty ',
      '\\Delta ',
      '^{2}',
      '^{}',
      '()',
      '{,}',
      ' = ',
      ' + ',
      ' - ',
      ' < ',
      ' > ',
    ];

    let deleteCount = 1;
    for (const t of multiTokens) {
      if (before.endsWith(t)) {
        deleteCount = t.length;
        break;
      }
    }

    const newBefore = before.slice(0, before.length - deleteCount);
    onChange(newBefore + after);
    setCursorPos(Math.max(0, safeCursor - deleteCount));
  };

  // Hold-to-delete support
  const startBackspaceHold = () => {
    handleBackspace();
    backspaceTimerRef.current = setTimeout(() => {
      backspaceIntervalRef.current = setInterval(() => {
        handleBackspace();
      }, 70);
    }, 320);
  };

  const stopBackspaceHold = () => {
    if (backspaceTimerRef.current) clearTimeout(backspaceTimerRef.current);
    if (backspaceIntervalRef.current) clearInterval(backspaceIntervalRef.current);
  };

  // Cursor navigation
  const moveCursorLeft = () => {
    triggerHaptic('light');
    setCursorPos((prev) => Math.max(0, prev - 1));
  };

  const moveCursorRight = () => {
    triggerHaptic('light');
    setCursorPos((prev) => Math.min(value.length, prev + 1));
  };

  // Clear all
  const handleClear = () => {
    triggerHaptic('medium');
    onChange('');
    setCursorPos(0);
  };

  return (
    <div className="flex flex-col w-full select-none">
      {/* ------------------------------------------------------------- */}
      {/* LIVE KATEX PREVIEW BOX                                        */}
      {/* ------------------------------------------------------------- */}
      <div
        ref={previewRef}
        onClick={() => setCursorPos(value.length)}
        className="w-full min-h-[96px] max-h-[140px] bg-[#0B0F17] border-2 border-white/10 hover:border-[#00E5FF]/40 focus-within:border-[#00E5FF] rounded-[22px] p-4 flex flex-col justify-center items-center relative overflow-x-auto overflow-y-hidden shadow-inner transition-colors cursor-text mb-3"
      >
        {/* Top subtle badge & quick clear */}
        <div className="w-full flex items-center justify-between text-[11px] font-bold text-[#8B8D98] mb-1">
          <span className="flex items-center gap-1.5 uppercase tracking-wider text-[#00E5FF]">
            <Sparkles size={12} /> Podgląd wzoru maturalnego
          </span>
          {value.length > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="px-2 py-0.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-[#8B8D98] hover:text-rose-400 text-[10px] uppercase tracking-wider transition-colors"
            >
              Wyczyść
            </button>
          )}
        </div>

        {/* KaTeX Live Render Output */}
        <div
          className="w-full text-center text-white text-lg sm:text-xl font-medium tracking-wide overflow-x-auto no-scrollbar py-1"
          dangerouslySetInnerHTML={{ __html: getRenderedHtml() }}
        />
      </div>

      {/* ------------------------------------------------------------- */}
      {/* THUMB-OPTIMIZED SMART MATH KEYBOARD (Height ~260px)           */}
      {/* ------------------------------------------------------------- */}
      <div className="w-full bg-[#0B0F17] border border-white/10 rounded-[24px] p-2.5 shadow-2xl flex flex-col gap-2">
        {/* TOP DEDICATED CKE SYMBOL STRIP */}
        <div className="grid grid-cols-6 gap-1.5">
          {/* Fraction a/b */}
          <button
            type="button"
            onClick={() => insertToken('\\frac{}{}', 6)}
            className="min-h-[44px] bg-[#161F2E] hover:bg-[#1E2B3E] active:scale-92 border border-white/10 rounded-xl text-white font-black text-sm flex items-center justify-center transition-transform active:bg-[#00E5FF]/20 shadow-sm"
            title="Ułamek zwykły"
          >
            <span className="flex flex-col items-center leading-none text-xs">
              <span>a</span>
              <span className="w-3 h-[1.5px] bg-[#00E5FF] my-0.5" />
              <span>b</span>
            </span>
          </button>

          {/* Square root */}
          <button
            type="button"
            onClick={() => insertToken('\\sqrt{}', 6)}
            className="min-h-[44px] bg-[#161F2E] hover:bg-[#1E2B3E] active:scale-92 border border-white/10 rounded-xl text-white font-bold text-sm flex items-center justify-center transition-transform active:bg-[#00E5FF]/20 shadow-sm"
            title="Pierwiastek"
          >
            √x
          </button>

          {/* Square x² */}
          <button
            type="button"
            onClick={() => insertToken('^{2}', 4)}
            className="min-h-[44px] bg-[#161F2E] hover:bg-[#1E2B3E] active:scale-92 border border-white/10 rounded-xl text-white font-bold text-sm flex items-center justify-center transition-transform active:bg-[#00E5FF]/20 shadow-sm"
            title="Kwadrat"
          >
            x²
          </button>

          {/* Universal exponent xⁿ */}
          <button
            type="button"
            onClick={() => insertToken('^{}', 2)}
            className="min-h-[44px] bg-[#161F2E] hover:bg-[#1E2B3E] active:scale-92 border border-white/10 rounded-xl text-white font-bold text-sm flex items-center justify-center transition-transform active:bg-[#00E5FF]/20 shadow-sm"
            title="Potęga do wykładnika"
          >
            xⁿ
          </button>

          {/* Smart parentheses ( ) */}
          <button
            type="button"
            onClick={() => insertToken('()', 1)}
            className="min-h-[44px] bg-[#161F2E] hover:bg-[#1E2B3E] active:scale-92 border border-white/10 rounded-xl text-white font-bold text-sm flex items-center justify-center transition-transform active:bg-[#00E5FF]/20 shadow-sm"
            title="Nawiasy"
          >
            ( )
          </button>

          {/* Pi symbol */}
          <button
            type="button"
            onClick={() => insertToken('\\pi ')}
            className="min-h-[44px] bg-[#161F2E] hover:bg-[#1E2B3E] active:scale-92 border border-white/10 rounded-xl text-white font-serif font-bold text-sm flex items-center justify-center transition-transform active:bg-[#00E5FF]/20 shadow-sm"
            title="Liczba Pi"
          >
            π
          </button>
        </div>

        {/* MAIN 4-ROW NUMPAD & VARIABLE GRID (6 cols x 4 rows) */}
        <div className="grid grid-cols-6 gap-1.5">
          {/* ROW 1 */}
          <button
            type="button"
            onClick={() => insertToken('x')}
            className="min-h-[46px] bg-[#1B2433] hover:bg-[#223145] active:scale-92 border border-white/10 rounded-xl text-[#00E5FF] font-black text-base italic flex items-center justify-center transition-transform"
          >
            x
          </button>
          <button
            type="button"
            onClick={() => insertToken('y')}
            className="min-h-[46px] bg-[#1B2433] hover:bg-[#223145] active:scale-92 border border-white/10 rounded-xl text-[#00E5FF] font-black text-base italic flex items-center justify-center transition-transform"
          >
            y
          </button>
          <button
            type="button"
            onClick={() => insertToken('7')}
            className="min-h-[46px] bg-[#161F2E] hover:bg-[#1E2B3E] active:scale-92 border border-white/5 rounded-xl text-white font-bold text-lg flex items-center justify-center transition-transform"
          >
            7
          </button>
          <button
            type="button"
            onClick={() => insertToken('8')}
            className="min-h-[46px] bg-[#161F2E] hover:bg-[#1E2B3E] active:scale-92 border border-white/5 rounded-xl text-white font-bold text-lg flex items-center justify-center transition-transform"
          >
            8
          </button>
          <button
            type="button"
            onClick={() => insertToken('9')}
            className="min-h-[46px] bg-[#161F2E] hover:bg-[#1E2B3E] active:scale-92 border border-white/5 rounded-xl text-white font-bold text-lg flex items-center justify-center transition-transform"
          >
            9
          </button>
          {/* Backspace with long-press support */}
          <button
            type="button"
            onMouseDown={startBackspaceHold}
            onMouseUp={stopBackspaceHold}
            onMouseLeave={stopBackspaceHold}
            onTouchStart={startBackspaceHold}
            onTouchEnd={stopBackspaceHold}
            className="min-h-[46px] bg-rose-500/15 hover:bg-rose-500/25 active:scale-92 border border-rose-500/30 rounded-xl text-rose-400 font-bold flex items-center justify-center transition-transform shadow-sm"
            title="Usuń znak"
          >
            <Delete size={18} />
          </button>

          {/* ROW 2 */}
          <button
            type="button"
            onClick={() => insertToken(' + ')}
            className="min-h-[46px] bg-[#161F2E] hover:bg-[#1E2B3E] active:scale-92 border border-white/10 rounded-xl text-[#00E5FF] font-bold text-lg flex items-center justify-center transition-transform"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => insertToken(' - ')}
            className="min-h-[46px] bg-[#161F2E] hover:bg-[#1E2B3E] active:scale-92 border border-white/10 rounded-xl text-[#00E5FF] font-bold text-lg flex items-center justify-center transition-transform"
          >
            -
          </button>
          <button
            type="button"
            onClick={() => insertToken('4')}
            className="min-h-[46px] bg-[#161F2E] hover:bg-[#1E2B3E] active:scale-92 border border-white/5 rounded-xl text-white font-bold text-lg flex items-center justify-center transition-transform"
          >
            4
          </button>
          <button
            type="button"
            onClick={() => insertToken('5')}
            className="min-h-[46px] bg-[#161F2E] hover:bg-[#1E2B3E] active:scale-92 border border-white/5 rounded-xl text-white font-bold text-lg flex items-center justify-center transition-transform"
          >
            5
          </button>
          <button
            type="button"
            onClick={() => insertToken('6')}
            className="min-h-[46px] bg-[#161F2E] hover:bg-[#1E2B3E] active:scale-92 border border-white/5 rounded-xl text-white font-bold text-lg flex items-center justify-center transition-transform"
          >
            6
          </button>
          <button
            type="button"
            onClick={() => insertToken(' \\cdot ')}
            className="min-h-[46px] bg-[#161F2E] hover:bg-[#1E2B3E] active:scale-92 border border-white/10 rounded-xl text-[#00E5FF] font-bold text-lg flex items-center justify-center transition-transform"
            title="Mnożenie"
          >
            ·
          </button>

          {/* ROW 3 */}
          <button
            type="button"
            onClick={() => insertToken(' = ')}
            className="min-h-[46px] bg-[#161F2E] hover:bg-[#1E2B3E] active:scale-92 border border-white/10 rounded-xl text-[#00E5FF] font-bold text-lg flex items-center justify-center transition-transform"
          >
            =
          </button>
          <button
            type="button"
            onClick={() => insertToken('\\le ')}
            className="min-h-[46px] bg-[#161F2E] hover:bg-[#1E2B3E] active:scale-92 border border-white/10 rounded-xl text-white font-bold text-sm flex items-center justify-center transition-transform"
            title="Mniejsze lub równe"
          >
            ≤
          </button>
          <button
            type="button"
            onClick={() => insertToken('1')}
            className="min-h-[46px] bg-[#161F2E] hover:bg-[#1E2B3E] active:scale-92 border border-white/5 rounded-xl text-white font-bold text-lg flex items-center justify-center transition-transform"
          >
            1
          </button>
          <button
            type="button"
            onClick={() => insertToken('2')}
            className="min-h-[46px] bg-[#161F2E] hover:bg-[#1E2B3E] active:scale-92 border border-white/5 rounded-xl text-white font-bold text-lg flex items-center justify-center transition-transform"
          >
            2
          </button>
          <button
            type="button"
            onClick={() => insertToken('3')}
            className="min-h-[46px] bg-[#161F2E] hover:bg-[#1E2B3E] active:scale-92 border border-white/5 rounded-xl text-white font-bold text-lg flex items-center justify-center transition-transform"
          >
            3
          </button>
          <button
            type="button"
            onClick={() => insertToken('\\ge ')}
            className="min-h-[46px] bg-[#161F2E] hover:bg-[#1E2B3E] active:scale-92 border border-white/10 rounded-xl text-white font-bold text-sm flex items-center justify-center transition-transform"
            title="Większe lub równe"
          >
            ≥
          </button>

          {/* ROW 4 */}
          <button
            type="button"
            onClick={() => insertToken(' < ')}
            className="min-h-[46px] bg-[#161F2E] hover:bg-[#1E2B3E] active:scale-92 border border-white/10 rounded-xl text-white font-bold text-sm flex items-center justify-center transition-transform"
          >
            &lt;
          </button>
          <button
            type="button"
            onClick={() => insertToken(' > ')}
            className="min-h-[46px] bg-[#161F2E] hover:bg-[#1E2B3E] active:scale-92 border border-white/10 rounded-xl text-white font-bold text-sm flex items-center justify-center transition-transform"
          >
            &gt;
          </button>
          <button
            type="button"
            onClick={() => insertToken('0')}
            className="min-h-[46px] bg-[#161F2E] hover:bg-[#1E2B3E] active:scale-92 border border-white/5 rounded-xl text-white font-bold text-lg flex items-center justify-center transition-transform"
          >
            0
          </button>
          {/* Polish Decimal Comma */}
          <button
            type="button"
            onClick={() => insertToken('{,}')}
            className="min-h-[46px] bg-[#161F2E] hover:bg-[#1E2B3E] active:scale-92 border border-white/5 rounded-xl text-white font-bold text-lg flex items-center justify-center transition-transform"
            title="Przecinek dziesiętny"
          >
            ,
          </button>
          {/* Cursor Left */}
          <button
            type="button"
            onClick={moveCursorLeft}
            className="min-h-[46px] bg-[#1B2433] hover:bg-[#223145] active:scale-92 border border-white/10 rounded-xl text-[#8B8D98] hover:text-white font-bold flex items-center justify-center transition-transform"
            title="Kursor w lewo"
          >
            <ArrowLeft size={16} />
          </button>
          {/* Cursor Right */}
          <button
            type="button"
            onClick={moveCursorRight}
            className="min-h-[46px] bg-[#1B2433] hover:bg-[#223145] active:scale-92 border border-white/10 rounded-xl text-[#8B8D98] hover:text-white font-bold flex items-center justify-center transition-transform"
            title="Kursor w prawo"
          >
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
