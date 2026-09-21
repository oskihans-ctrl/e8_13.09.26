import React, { useState, useRef, useEffect } from 'react';
import { InlineMath } from 'react-katex';
import { 
  Trash2, 
  Delete,
  CheckCircle2, 
  AlertTriangle,
  Keyboard,
  PenTool,
  RotateCcw,
  Eraser,
  Undo2,
  Maximize2
} from 'lucide-react';
import { triggerHaptic } from '../utils';
import { useTheme } from '../context/ThemeContext';

interface OpenTaskWorkspaceProps {
  task: any;
  isEvaluated: boolean;
  isCorrect: boolean | null;
  value: string;
  onChangeValue: (val: string) => void;
  savedCanvasDataUrl?: string;
  onSaveCanvasData?: (dataUrl: string) => void;
  onOpenScratchpad?: () => void;
  onSubmit?: () => void;
  onAskAiTutor?: () => void;
}

/**
 * Formats user input into clean math notation for live KaTeX display
 */
export function formatMathDisplay(raw: string): string {
  if (!raw || !raw.trim()) return '';
  let s = raw.trim();

  // Decimal comma in numbers (0,3 -> 0{,}3)
  s = s.replace(/(\d+),(\d+)/g, (_m, d1, d2) => `${d1}{,}${d2}`);
  s = s.replace(/,/g, '{,}');

  // Multiplication symbol: replace * with \cdot
  s = s.replace(/\*/g, ' \\cdot ');

  // Powers:
  if (s.endsWith('^')) {
    const base = s.slice(0, -1);
    s = `${base || 'x'}^{\\square}`;
  } else {
    s = s.replace(/([0-9a-zA-Z\)\}]+)\^\{?([0-9a-zA-Z\+\-]+)\}?/g, (_m, b, e) => `{${b}}^{${e}}`);
  }

  // Fractions:
  if (s.endsWith('/')) {
    const num = s.slice(0, -1);
    s = `\\frac{${num || '1'}}{\\square}`;
  } else {
    s = s.replace(/(\([^\)]+\)|[0-9a-zA-Z\^_{}]+)\/(\([^\)]+\)|[0-9a-zA-Z\^_{}]+)/g, (_m, n, d) => `\\frac{${n}}{${d}}`);
  }

  // Unfinished square root
  if (s.endsWith('\\sqrt{}')) {
    s = s.replace(/\\sqrt\{\}$/, '\\sqrt{\\square}');
  }

  // Balance unclosed braces
  const openBraces = (s.match(/\{/g) || []).length;
  const closeBraces = (s.match(/\}/g) || []).length;
  if (openBraces > closeBraces) {
    s += '}'.repeat(openBraces - closeBraces);
  }

  // Balance unclosed parentheses
  const openParens = (s.match(/\(/g) || []).length;
  const closeParens = (s.match(/\)/g) || []).length;
  if (openParens > closeParens) {
    s += ')'.repeat(openParens - closeParens);
  }

  return s;
}

export function OpenTaskWorkspace({
  isEvaluated,
  isCorrect,
  value,
  onChangeValue,
  savedCanvasDataUrl = '',
  onSaveCanvasData,
  onOpenScratchpad,
}: OpenTaskWorkspaceProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Tryb: 'keyboard' ALBO 'whiteboard'
  const [activeTab, setActiveTab] = useState<'keyboard' | 'whiteboard'>('keyboard');

  // --------------------------------------------------------------------------
  // Whiteboard Canvas State & Logic
  // --------------------------------------------------------------------------
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [wbTool, setWbTool] = useState<'pen' | 'eraser'>('pen');
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const historyRef = useRef<ImageData[]>([]);
  const historyIndexRef = useRef<number>(-1);

  const saveCanvasState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
      historyRef.current.push(imgData);
      if (historyRef.current.length > 20) {
        historyRef.current.shift();
      }
      historyIndexRef.current = historyRef.current.length - 1;

      if (onSaveCanvasData) {
        onSaveCanvasData(canvas.toDataURL());
      }
    } catch {
      // Ignoruj błędy bufora canvas
    }
  };

  // Inicjalizacja canvas przy zmianie zakładki lub rozmiaru kontenera
  useEffect(() => {
    if (activeTab !== 'whiteboard') return;

    const timer = setTimeout(() => {
      const canvas = canvasRef.current;
      const container = canvasContainerRef.current;
      if (!canvas || !container) return;

      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      
      const width = Math.max(300, Math.floor(rect.width));
      const height = Math.max(260, Math.floor(rect.height));

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (savedCanvasDataUrl && savedCanvasDataUrl.length > 50) {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0, width, height);
            saveCanvasState();
          };
          img.src = savedCanvasDataUrl;
        } else {
          ctx.clearRect(0, 0, width, height);
          saveCanvasState();
        }
      }
    }, 60);

    return () => clearTimeout(timer);
  }, [activeTab]);

  const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isEvaluated) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const { x, y } = getCoordinates(e);

    ctx.beginPath();
    ctx.moveTo(x, y);

    if (wbTool === 'pen') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = isDark ? '#F8FAFC' : '#0F172A';
      ctx.lineWidth = 2.5;
    } else {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = 22;
    }
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || isEvaluated) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    saveCanvasState();
  };

  const handleUndo = () => {
    if (historyIndexRef.current <= 0) return;
    triggerHaptic('light');
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    historyIndexRef.current -= 1;
    const targetState = historyRef.current[historyIndexRef.current];
    if (targetState) {
      ctx.putImageData(targetState, 0, 0);
      if (onSaveCanvasData) {
        onSaveCanvasData(canvas.toDataURL());
      }
    }
  };

  const handleClearWhiteboard = () => {
    triggerHaptic('medium');
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    saveCanvasState();
    if (onSaveCanvasData) {
      onSaveCanvasData('');
    }
  };

  // --------------------------------------------------------------------------
  // Virtual Math Keyboard logic
  // --------------------------------------------------------------------------
  const handleKeyClick = (keyToken: string) => {
    if (isEvaluated) return;
    triggerHaptic('light');

    if (keyToken === 'BACKSPACE') {
      if (!value) return;
      if (value.endsWith('\\sqrt{}')) {
        onChangeValue(value.slice(0, -7));
      } else {
        onChangeValue(value.slice(0, -1));
      }
      return;
    }

    if (keyToken === 'CLEAR') {
      triggerHaptic('medium');
      onChangeValue('');
      return;
    }

    if (keyToken === 'FRAC' || keyToken === '÷') {
      onChangeValue(value + '/');
      return;
    }

    if (keyToken === 'POW') {
      if (!value || /[+\-*\/(\s]$/.test(value)) {
        onChangeValue(value + 'x^');
      } else {
        onChangeValue(value + '^');
      }
      return;
    }

    if (keyToken === 'SQRT') {
      onChangeValue(value + '\\sqrt{}');
      return;
    }

    if (keyToken === '·' || keyToken === '*') {
      onChangeValue(value + '*');
      return;
    }

    if (value.endsWith('\\sqrt{}') && /^[0-9x]$/.test(keyToken)) {
      onChangeValue(value.slice(0, -1) + keyToken + '}');
      return;
    }

    onChangeValue(value + keyToken);
  };

  const formattedMath = formatMathDisplay(value);
  const hasSavedCanvas = savedCanvasDataUrl && savedCanvasDataUrl.length > 50;

  return (
    <div className="w-full flex flex-col justify-end items-stretch gap-2 select-none">
      {/* ------------------------------------------------------------------ */}
      {/* 1. DUAL MODE SWITCHER: [ Klawiatura ] | [ Pisz na tablicy ]          */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700 w-full shrink-0 shadow-xs">
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            setActiveTab('keyboard');
          }}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'keyboard'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Keyboard size={14} />
          <span>Klawiatura matematyczna</span>
        </button>

        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            setActiveTab('whiteboard');
          }}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'whiteboard'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <PenTool size={14} />
          <span>Pisz na tablicy</span>
          {hasSavedCanvas && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Zawiera zapisane obliczenia" />
          )}
        </button>
      </div>

      {/* ================================================================== */}
      {/* TRYB 1: KLAWIATURA MATEMATYCZNA                                    */}
      {/* ================================================================== */}
      {activeTab === 'keyboard' && (
        <div className="w-full flex flex-col gap-2 shrink-0 animate-in fade-in duration-150">
          {/* DUŻE OKNO: "Twoja odpowiedź:" (KaTeX Live Preview) */}
          <div className="w-full bg-white dark:bg-[#131B29] border border-slate-200 dark:border-slate-800 rounded-2xl p-3 sm:p-3.5 shadow-xs flex items-center justify-between gap-2 shrink-0">
            <div className="flex-1 min-w-0 flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0">
                Twoja odpowiedź:
              </span>
              <div className="flex-1 overflow-x-auto no-scrollbar py-0.5 min-h-[32px] flex items-center text-left">
                {formattedMath ? (
                  <span className="text-slate-900 dark:text-white font-bold text-lg sm:text-xl tracking-wide">
                    <InlineMath math={formattedMath} />
                  </span>
                ) : (
                  <span className="text-slate-400 dark:text-slate-500 text-xs sm:text-sm italic font-normal">
                    Wprowadź wynik za pomocą kalkulatora...
                  </span>
                )}
              </div>
            </div>

            {value && !isEvaluated && (
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => handleKeyClick('BACKSPACE')}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  title="Usuń ostatni znak"
                >
                  <Delete size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => handleKeyClick('CLEAR')}
                  className="p-1.5 rounded-lg text-rose-500 hover:text-rose-600 bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 transition-colors cursor-pointer"
                  title="Wyczyść wpis"
                >
                  <RotateCcw size={15} />
                </button>
              </div>
            )}

            {isEvaluated && (
              <div className="shrink-0 flex items-center">
                {isCorrect ? (
                  <CheckCircle2 size={20} className="text-emerald-500" />
                ) : (
                  <AlertTriangle size={20} className="text-rose-500" />
                )}
              </div>
            )}
          </div>

          {/* PEŁNA KLAWIATURA KALKULATORA */}
          <div className={`w-full flex flex-col gap-1.5 shrink-0 ${isEvaluated ? 'opacity-50 pointer-events-none' : ''}`}>
            {/* GÓRNY PASEK SYMBOLI: a/b, xⁿ, √, (, ), ·, x, ⌫ */}
            <div className="grid grid-cols-8 gap-1 w-full">
              <button
                type="button"
                onClick={() => handleKeyClick('FRAC')}
                className="h-9 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-800 dark:text-amber-400 font-bold text-xs flex items-center justify-center active:scale-95 transition-all shadow-xs cursor-pointer"
                title="Ułamek zwykły (a/b)"
              >
                <span>a/b</span>
              </button>

              <button
                type="button"
                onClick={() => handleKeyClick('POW')}
                className="h-9 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-800 dark:text-amber-400 font-bold text-xs flex items-center justify-center active:scale-95 transition-all shadow-xs cursor-pointer"
                title="Dowolna potęga (xⁿ)"
              >
                <span>xⁿ</span>
              </button>

              <button
                type="button"
                onClick={() => handleKeyClick('SQRT')}
                className="h-9 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-800 dark:text-amber-400 font-bold text-xs sm:text-sm flex items-center justify-center active:scale-95 transition-all shadow-xs cursor-pointer"
                title="Pierwiastek kwadratowy (√)"
              >
                <span>√</span>
              </button>

              <button
                type="button"
                onClick={() => handleKeyClick('(')}
                className="h-9 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs sm:text-sm flex items-center justify-center active:scale-95 transition-all shadow-xs cursor-pointer"
                title="Nawias ("
              >
                <span>(</span>
              </button>

              <button
                type="button"
                onClick={() => handleKeyClick(')')}
                className="h-9 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs sm:text-sm flex items-center justify-center active:scale-95 transition-all shadow-xs cursor-pointer"
                title="Nawias )"
              >
                <span>)</span>
              </button>

              <button
                type="button"
                onClick={() => handleKeyClick('·')}
                className="h-9 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-800 dark:text-amber-400 font-bold text-sm flex items-center justify-center active:scale-95 transition-all shadow-xs cursor-pointer"
                title="Kropka mnożenia (·)"
              >
                <span>·</span>
              </button>

              <button
                type="button"
                onClick={() => handleKeyClick('x')}
                className="h-9 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-amber-700 dark:text-amber-400 italic font-bold text-xs flex items-center justify-center active:scale-95 transition-all shadow-xs cursor-pointer"
                title="Zmienna x"
              >
                <span>x</span>
              </button>

              <button
                type="button"
                onClick={() => handleKeyClick('BACKSPACE')}
                className="h-9 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white font-bold flex items-center justify-center active:scale-95 transition-all shadow-xs cursor-pointer"
                title="Backspace"
              >
                <Delete size={15} />
              </button>
            </div>

            {/* BLOK NUMERYCZNY (4 WIERSZE x 4 KOLUMNY) */}
            <div className="grid grid-cols-4 gap-1 sm:gap-1.5 w-full">
              {/* Wiersz 1 */}
              <button
                type="button"
                onClick={() => handleKeyClick('7')}
                className="h-10 sm:h-11 rounded-xl bg-white hover:bg-slate-50 dark:bg-[#131B29] dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-bold text-base sm:text-lg flex items-center justify-center active:scale-95 transition-all shadow-xs cursor-pointer"
              >
                7
              </button>
              <button
                type="button"
                onClick={() => handleKeyClick('8')}
                className="h-10 sm:h-11 rounded-xl bg-white hover:bg-slate-50 dark:bg-[#131B29] dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-bold text-base sm:text-lg flex items-center justify-center active:scale-95 transition-all shadow-xs cursor-pointer"
              >
                8
              </button>
              <button
                type="button"
                onClick={() => handleKeyClick('9')}
                className="h-10 sm:h-11 rounded-xl bg-white hover:bg-slate-50 dark:bg-[#131B29] dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-bold text-base sm:text-lg flex items-center justify-center active:scale-95 transition-all shadow-xs cursor-pointer"
              >
                9
              </button>
              <button
                type="button"
                onClick={() => handleKeyClick('÷')}
                className="h-10 sm:h-11 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-800 dark:text-amber-400 font-bold text-base sm:text-lg flex items-center justify-center active:scale-95 transition-all shadow-xs cursor-pointer"
                title="Dzielenie (÷)"
              >
                ÷
              </button>

              {/* Wiersz 2 */}
              <button
                type="button"
                onClick={() => handleKeyClick('4')}
                className="h-10 sm:h-11 rounded-xl bg-white hover:bg-slate-50 dark:bg-[#131B29] dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-bold text-base sm:text-lg flex items-center justify-center active:scale-95 transition-all shadow-xs cursor-pointer"
              >
                4
              </button>
              <button
                type="button"
                onClick={() => handleKeyClick('5')}
                className="h-10 sm:h-11 rounded-xl bg-white hover:bg-slate-50 dark:bg-[#131B29] dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-bold text-base sm:text-lg flex items-center justify-center active:scale-95 transition-all shadow-xs cursor-pointer"
              >
                5
              </button>
              <button
                type="button"
                onClick={() => handleKeyClick('6')}
                className="h-10 sm:h-11 rounded-xl bg-white hover:bg-slate-50 dark:bg-[#131B29] dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-bold text-base sm:text-lg flex items-center justify-center active:scale-95 transition-all shadow-xs cursor-pointer"
              >
                6
              </button>
              <button
                type="button"
                onClick={() => handleKeyClick('·')}
                className="h-10 sm:h-11 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-800 dark:text-amber-400 font-bold text-base sm:text-lg flex items-center justify-center active:scale-95 transition-all shadow-xs cursor-pointer"
                title="Mnożenie (·)"
              >
                ·
              </button>

              {/* Wiersz 3 */}
              <button
                type="button"
                onClick={() => handleKeyClick('1')}
                className="h-10 sm:h-11 rounded-xl bg-white hover:bg-slate-50 dark:bg-[#131B29] dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-bold text-base sm:text-lg flex items-center justify-center active:scale-95 transition-all shadow-xs cursor-pointer"
              >
                1
              </button>
              <button
                type="button"
                onClick={() => handleKeyClick('2')}
                className="h-10 sm:h-11 rounded-xl bg-white hover:bg-slate-50 dark:bg-[#131B29] dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-bold text-base sm:text-lg flex items-center justify-center active:scale-95 transition-all shadow-xs cursor-pointer"
              >
                2
              </button>
              <button
                type="button"
                onClick={() => handleKeyClick('3')}
                className="h-10 sm:h-11 rounded-xl bg-white hover:bg-slate-50 dark:bg-[#131B29] dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-bold text-base sm:text-lg flex items-center justify-center active:scale-95 transition-all shadow-xs cursor-pointer"
              >
                3
              </button>
              <button
                type="button"
                onClick={() => handleKeyClick('-')}
                className="h-10 sm:h-11 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-800 dark:text-amber-400 font-bold text-base sm:text-lg flex items-center justify-center active:scale-95 transition-all shadow-xs cursor-pointer"
                title="Minus (-)"
              >
                −
              </button>

              {/* Wiersz 4 */}
              <button
                type="button"
                onClick={() => handleKeyClick('CLEAR')}
                className="h-10 sm:h-11 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 font-bold text-sm flex items-center justify-center active:scale-95 transition-all shadow-xs cursor-pointer"
                title="Wyczyść (C)"
              >
                C
              </button>
              <button
                type="button"
                onClick={() => handleKeyClick('0')}
                className="h-10 sm:h-11 rounded-xl bg-white hover:bg-slate-50 dark:bg-[#131B29] dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-bold text-base sm:text-lg flex items-center justify-center active:scale-95 transition-all shadow-xs cursor-pointer"
              >
                0
              </button>
              <button
                type="button"
                onClick={() => handleKeyClick(',')}
                className="h-10 sm:h-11 rounded-xl bg-white hover:bg-slate-50 dark:bg-[#131B29] dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-bold text-base sm:text-lg flex items-center justify-center active:scale-95 transition-all shadow-xs cursor-pointer"
                title="Przecinek (,)"
              >
                ,
              </button>
              <button
                type="button"
                onClick={() => handleKeyClick('+')}
                className="h-10 sm:h-11 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-800 dark:text-amber-400 font-bold text-base sm:text-lg flex items-center justify-center active:scale-95 transition-all shadow-xs cursor-pointer"
                title="Plus (+)"
              >
                +
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* TRYB 2: PISZ NA TABLICY                                            */}
      {/* ================================================================== */}
      {activeTab === 'whiteboard' && (
        <div className="w-full flex flex-col gap-2 shrink-0 animate-in fade-in duration-150">
          <div className="w-full bg-white dark:bg-[#131B29] border border-slate-200 dark:border-slate-800 rounded-2xl p-2.5 sm:p-3 flex flex-col gap-2 shadow-xs">
            {/* Pasek narzędzi tablicy */}
            <div className="flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setWbTool('pen');
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    wbTool === 'pen'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <PenTool size={13} />
                  <span>Rysik</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setWbTool('eraser');
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    wbTool === 'eraser'
                      ? 'bg-rose-500 text-white font-bold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Eraser size={13} />
                  <span>Gumka</span>
                </button>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleUndo}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  title="Cofnij ostatnie pociągnięcie (Undo)"
                >
                  <Undo2 size={15} />
                </button>

                <button
                  type="button"
                  onClick={handleClearWhiteboard}
                  className="p-1.5 rounded-lg text-rose-500 hover:text-rose-600 bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 transition-colors cursor-pointer"
                  title="Wyczyść całą tablicę"
                >
                  <Trash2 size={15} />
                </button>

                {onOpenScratchpad && (
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      onOpenScratchpad();
                    }}
                    className="p-1.5 rounded-lg text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 transition-colors cursor-pointer"
                    title="Powiększ na pełny ekran"
                  >
                    <Maximize2 size={15} />
                  </button>
                )}
              </div>
            </div>

            {/* INTERAKTYWNA TABLICA W KRATKĘ */}
            <div 
              ref={canvasContainerRef}
              className="w-full h-[270px] sm:h-[300px] rounded-xl border border-slate-200 dark:border-slate-800 relative overflow-hidden touch-none"
              style={{
                backgroundColor: isDark ? '#0B0F17' : '#FFFFFF',
                backgroundImage: isDark 
                  ? `linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px)`
                  : `linear-gradient(to right, rgba(15, 23, 42, 0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(15, 23, 42, 0.06) 1px, transparent 1px)`,
                backgroundSize: '22px 22px',
              }}
            >
              <canvas
                ref={canvasRef}
                onPointerDown={startDrawing}
                onPointerMove={draw}
                onPointerUp={stopDrawing}
                onPointerCancel={stopDrawing}
                className="w-full h-full cursor-crosshair block"
              />

              {!hasSavedCanvas && !isDrawing && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-slate-400 dark:text-slate-600 font-medium text-xs">
                  Pisz palcem lub rysikiem po kratkach...
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OpenTaskWorkspace;
