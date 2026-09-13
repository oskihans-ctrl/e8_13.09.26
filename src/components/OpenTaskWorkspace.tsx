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
  // If ends with ^, show placeholder square: e.g. 3^ -> 3^{\square}
  if (s.endsWith('^')) {
    const base = s.slice(0, -1);
    s = `${base || 'x'}^{\\square}`;
  } else {
    // Handle base^exp (e.g. 3^42, x^n, (x+1)^2)
    s = s.replace(/([0-9a-zA-Z\)\}]+)\^\{?([0-9a-zA-Z\+\-]+)\}?/g, (_m, b, e) => `{${b}}^{${e}}`);
  }

  // Fractions:
  // If ends with /, show placeholder denominator: 3/ -> \frac{3}{\square}
  if (s.endsWith('/')) {
    const num = s.slice(0, -1);
    s = `\\frac{${num || '1'}}{\\square}`;
  } else {
    // e.g. 3/4 or (x+1)/(x-2)
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
  // Tryb wzajemnie wykluczający: 'keyboard' ALBO 'whiteboard'
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

  // Zapis stanu do historii i powiadomienie rodzica
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
      } else {
        historyIndexRef.current++;
      }

      if (onSaveCanvasData) {
        onSaveCanvasData(canvas.toDataURL('image/png'));
      }
    } catch {
      // ignore
    }
  };

  // Inicjalizacja canvasu po przełączeniu na 'whiteboard'
  useEffect(() => {
    if (activeTab !== 'whiteboard') return;

    const timer = setTimeout(() => {
      const canvas = canvasRef.current;
      const container = canvasContainerRef.current;
      if (!canvas || !container) return;

      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const width = rect.width || 360;
      const height = rect.height || 260;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.scale(dpr, dpr);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Przywróć poprzednie rysunki, jeśli istnieją
      if (savedCanvasDataUrl && savedCanvasDataUrl.length > 50) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, width, height);
          saveCanvasState();
        };
        img.src = savedCanvasDataUrl;
      } else {
        saveCanvasState();
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [activeTab]);

  // Rysowanie: pointer events
  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isEvaluated) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.setPointerCapture(e.pointerId);
    setIsDrawing(true);

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);

    if (wbTool === 'pen') {
      ctx.strokeStyle = '#00C2FF';
      ctx.lineWidth = 2.5;
    } else {
      ctx.strokeStyle = '#070B12';
      ctx.lineWidth = 18;
    }
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || isEvaluated) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (canvas) {
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
    setIsDrawing(false);
    saveCanvasState();
  };

  // Cofnij (Undo)
  const handleUndo = () => {
    if (isEvaluated) return;
    triggerHaptic('light');
    const canvas = canvasRef.current;
    if (!canvas || historyIndexRef.current <= 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    historyIndexRef.current--;
    const prevData = historyRef.current[historyIndexRef.current];
    if (prevData) {
      ctx.putImageData(prevData, 0, 0);
      if (onSaveCanvasData) {
        onSaveCanvasData(canvas.toDataURL('image/png'));
      }
    }
  };

  // Wyczyść tablicę (Clear)
  const handleClearWhiteboard = () => {
    if (isEvaluated) return;
    triggerHaptic('medium');
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    saveCanvasState();
  };

  // --------------------------------------------------------------------------
  // Keyboard Calculator Logic
  // --------------------------------------------------------------------------
  const handleKeyClick = (keyToken: string) => {
    if (isEvaluated) return;
    triggerHaptic('light');

    if (keyToken === 'BACKSPACE') {
      if (!value) return;
      if (value.endsWith(' \\cdot ')) {
        onChangeValue(value.slice(0, -7));
      } else if (value.endsWith('\\sqrt{}')) {
        onChangeValue(value.slice(0, -8));
      } else if (value.endsWith('\\sqrt{')) {
        onChangeValue(value.slice(0, -6));
      } else if (value.endsWith('x^')) {
        onChangeValue(value.slice(0, -2));
      } else if (value.endsWith('^')) {
        onChangeValue(value.slice(0, -1));
      } else if (value.endsWith('}')) {
        const sqrtMatch = value.match(/\\sqrt\{([^}]+)\}$/);
        if (sqrtMatch) {
          const inner = sqrtMatch[1];
          if (inner.length > 1) {
            onChangeValue(value.slice(0, -2) + '}');
          } else {
            onChangeValue(value.slice(0, -inner.length - 1) + '}');
          }
          return;
        }
        onChangeValue(value.slice(0, -1));
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

    // Mathematical symbols
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

    // Smart root insertion
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
      <div className="flex items-center justify-between bg-[#0B0E14] p-1 rounded-xl border border-white/10 w-full shrink-0 shadow-sm">
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            setActiveTab('keyboard');
          }}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'keyboard'
              ? 'bg-[#00C2FF] text-[#0B131E] font-black shadow-[0_0_12px_rgba(0,194,255,0.25)]'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <Keyboard size={14} />
          <span>Klawiatura</span>
        </button>

        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            setActiveTab('whiteboard');
          }}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'whiteboard'
              ? 'bg-[#00C2FF] text-[#0B131E] font-black shadow-[0_0_12px_rgba(0,194,255,0.25)]'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <PenTool size={14} />
          <span>Pisz na tablicy</span>
          {hasSavedCanvas && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" title="Zawiera zapisane obliczenia" />
          )}
        </button>
      </div>

      {/* ================================================================== */}
      {/* TRYB 1: KLAWIATURA (TABLICA W 100% ZDEMONTOWANA I UKRYTA)           */}
      {/* ================================================================== */}
      {activeTab === 'keyboard' && (
        <div className="w-full flex flex-col gap-2 shrink-0 animate-in fade-in duration-150">
          {/* DUŻE OKNO: "Twoja odpowiedź:" (KaTeX Live Preview) */}
          <div className="w-full bg-[#141C28] border border-white/10 rounded-2xl p-3 sm:p-3.5 shadow-md flex items-center justify-between gap-2 shrink-0">
            <div className="flex-1 min-w-0 flex items-center gap-2">
              <span className="text-xs font-bold text-[#8B8D98] shrink-0">
                Twoja odpowiedź:
              </span>
              <div className="flex-1 overflow-x-auto no-scrollbar py-0.5 min-h-[32px] flex items-center text-left">
                {formattedMath ? (
                  <span className="text-white font-black text-lg sm:text-xl tracking-wide">
                    <InlineMath math={formattedMath} />
                  </span>
                ) : (
                  <span className="text-white/30 text-xs sm:text-sm italic font-normal">
                    Wpisz wynik za pomocą kalkulatora...
                  </span>
                )}
              </div>
            </div>

            {value && !isEvaluated && (
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => handleKeyClick('BACKSPACE')}
                  className="p-1.5 rounded-lg text-[#8B8D98] hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
                  title="Usuń ostatni znak"
                >
                  <Delete size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => handleKeyClick('CLEAR')}
                  className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 transition-colors"
                  title="Wyczyść wpis"
                >
                  <RotateCcw size={15} />
                </button>
              </div>
            )}

            {isEvaluated && (
              <div className="shrink-0 flex items-center">
                {isCorrect ? (
                  <CheckCircle2 size={20} className="text-emerald-400" />
                ) : (
                  <AlertTriangle size={20} className="text-rose-400" />
                )}
              </div>
            )}
          </div>

          {/* PEŁNA KLAWIATURA KALKULATORA (Zero Scrolla) */}
          <div className={`w-full flex flex-col gap-1.5 shrink-0 ${isEvaluated ? 'opacity-50 pointer-events-none' : ''}`}>
            {/* GÓRNY PASEK SYMBOLI: a/b, xⁿ, √, (, ), ·, x, ⌫ */}
            <div className="grid grid-cols-8 gap-1 w-full">
              <button
                type="button"
                onClick={() => handleKeyClick('FRAC')}
                className="h-9 rounded-xl bg-[#1A2332] hover:bg-[#223044] border border-white/10 text-[#00C2FF] font-black text-xs flex items-center justify-center active:scale-95 transition-all shadow-sm"
                title="Ułamek zwykły (a/b)"
              >
                <span>a/b</span>
              </button>

              <button
                type="button"
                onClick={() => handleKeyClick('POW')}
                className="h-9 rounded-xl bg-[#1A2332] hover:bg-[#223044] border border-white/10 text-[#00C2FF] font-black text-xs flex items-center justify-center active:scale-95 transition-all shadow-sm"
                title="Dowolna potęga (xⁿ)"
              >
                <span>xⁿ</span>
              </button>

              <button
                type="button"
                onClick={() => handleKeyClick('SQRT')}
                className="h-9 rounded-xl bg-[#1A2332] hover:bg-[#223044] border border-white/10 text-[#00C2FF] font-black text-xs sm:text-sm flex items-center justify-center active:scale-95 transition-all shadow-sm"
                title="Pierwiastek kwadratowy (√)"
              >
                <span>√</span>
              </button>

              <button
                type="button"
                onClick={() => handleKeyClick('(')}
                className="h-9 rounded-xl bg-[#1A2332] hover:bg-[#223044] border border-white/10 text-white font-bold text-xs sm:text-sm flex items-center justify-center active:scale-95 transition-all shadow-sm"
                title="Nawias ("
              >
                <span>(</span>
              </button>

              <button
                type="button"
                onClick={() => handleKeyClick(')')}
                className="h-9 rounded-xl bg-[#1A2332] hover:bg-[#223044] border border-white/10 text-white font-bold text-xs sm:text-sm flex items-center justify-center active:scale-95 transition-all shadow-sm"
                title="Nawias )"
              >
                <span>)</span>
              </button>

              <button
                type="button"
                onClick={() => handleKeyClick('·')}
                className="h-9 rounded-xl bg-[#1A2332] hover:bg-[#223044] border border-white/10 text-[#00C2FF] font-black text-sm flex items-center justify-center active:scale-95 transition-all shadow-sm"
                title="Kropka mnożenia (·)"
              >
                <span>·</span>
              </button>

              <button
                type="button"
                onClick={() => handleKeyClick('x')}
                className="h-9 rounded-xl bg-[#1A2332] hover:bg-[#223044] border border-white/10 text-sky-300 italic font-black text-xs flex items-center justify-center active:scale-95 transition-all shadow-sm"
                title="Zmienna x"
              >
                <span>x</span>
              </button>

              <button
                type="button"
                onClick={() => handleKeyClick('BACKSPACE')}
                className="h-9 rounded-xl bg-[#1E293B] hover:bg-[#27354D] border border-white/10 text-[#8B8D98] hover:text-white font-bold flex items-center justify-center active:scale-95 transition-all shadow-sm"
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
                className="h-10 sm:h-11 rounded-xl bg-[#141C28] hover:bg-[#1E293B] border border-white/10 text-white font-bold text-base sm:text-lg flex items-center justify-center active:scale-95 transition-all shadow-sm"
              >
                7
              </button>
              <button
                type="button"
                onClick={() => handleKeyClick('8')}
                className="h-10 sm:h-11 rounded-xl bg-[#141C28] hover:bg-[#1E293B] border border-white/10 text-white font-bold text-base sm:text-lg flex items-center justify-center active:scale-95 transition-all shadow-sm"
              >
                8
              </button>
              <button
                type="button"
                onClick={() => handleKeyClick('9')}
                className="h-10 sm:h-11 rounded-xl bg-[#141C28] hover:bg-[#1E293B] border border-white/10 text-white font-bold text-base sm:text-lg flex items-center justify-center active:scale-95 transition-all shadow-sm"
              >
                9
              </button>
              <button
                type="button"
                onClick={() => handleKeyClick('÷')}
                className="h-10 sm:h-11 rounded-xl bg-[#1E293B] hover:bg-[#27354D] border border-white/10 text-[#00C2FF] font-black text-base sm:text-lg flex items-center justify-center active:scale-95 transition-all shadow-sm"
                title="Dzielenie (÷)"
              >
                ÷
              </button>

              {/* Wiersz 2 */}
              <button
                type="button"
                onClick={() => handleKeyClick('4')}
                className="h-10 sm:h-11 rounded-xl bg-[#141C28] hover:bg-[#1E293B] border border-white/10 text-white font-bold text-base sm:text-lg flex items-center justify-center active:scale-95 transition-all shadow-sm"
              >
                4
              </button>
              <button
                type="button"
                onClick={() => handleKeyClick('5')}
                className="h-10 sm:h-11 rounded-xl bg-[#141C28] hover:bg-[#1E293B] border border-white/10 text-white font-bold text-base sm:text-lg flex items-center justify-center active:scale-95 transition-all shadow-sm"
              >
                5
              </button>
              <button
                type="button"
                onClick={() => handleKeyClick('6')}
                className="h-10 sm:h-11 rounded-xl bg-[#141C28] hover:bg-[#1E293B] border border-white/10 text-white font-bold text-base sm:text-lg flex items-center justify-center active:scale-95 transition-all shadow-sm"
              >
                6
              </button>
              <button
                type="button"
                onClick={() => handleKeyClick('·')}
                className="h-10 sm:h-11 rounded-xl bg-[#1E293B] hover:bg-[#27354D] border border-white/10 text-[#00C2FF] font-black text-base sm:text-lg flex items-center justify-center active:scale-95 transition-all shadow-sm"
                title="Mnożenie (·)"
              >
                ·
              </button>

              {/* Wiersz 3 */}
              <button
                type="button"
                onClick={() => handleKeyClick('1')}
                className="h-10 sm:h-11 rounded-xl bg-[#141C28] hover:bg-[#1E293B] border border-white/10 text-white font-bold text-base sm:text-lg flex items-center justify-center active:scale-95 transition-all shadow-sm"
              >
                1
              </button>
              <button
                type="button"
                onClick={() => handleKeyClick('2')}
                className="h-10 sm:h-11 rounded-xl bg-[#141C28] hover:bg-[#1E293B] border border-white/10 text-white font-bold text-base sm:text-lg flex items-center justify-center active:scale-95 transition-all shadow-sm"
              >
                2
              </button>
              <button
                type="button"
                onClick={() => handleKeyClick('3')}
                className="h-10 sm:h-11 rounded-xl bg-[#141C28] hover:bg-[#1E293B] border border-white/10 text-white font-bold text-base sm:text-lg flex items-center justify-center active:scale-95 transition-all shadow-sm"
              >
                3
              </button>
              <button
                type="button"
                onClick={() => handleKeyClick('-')}
                className="h-10 sm:h-11 rounded-xl bg-[#1E293B] hover:bg-[#27354D] border border-white/10 text-[#00C2FF] font-black text-base sm:text-lg flex items-center justify-center active:scale-95 transition-all shadow-sm"
                title="Minus (-)"
              >
                −
              </button>

              {/* Wiersz 4 */}
              <button
                type="button"
                onClick={() => handleKeyClick('CLEAR')}
                className="h-10 sm:h-11 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-black text-sm flex items-center justify-center active:scale-95 transition-all shadow-sm"
                title="Wyczyść (C)"
              >
                C
              </button>
              <button
                type="button"
                onClick={() => handleKeyClick('0')}
                className="h-10 sm:h-11 rounded-xl bg-[#141C28] hover:bg-[#1E293B] border border-white/10 text-white font-bold text-base sm:text-lg flex items-center justify-center active:scale-95 transition-all shadow-sm"
              >
                0
              </button>
              <button
                type="button"
                onClick={() => handleKeyClick(',')}
                className="h-10 sm:h-11 rounded-xl bg-[#141C28] hover:bg-[#1E293B] border border-white/10 text-white font-black text-base sm:text-lg flex items-center justify-center active:scale-95 transition-all shadow-sm"
                title="Przecinek (,)"
              >
                ,
              </button>
              <button
                type="button"
                onClick={() => handleKeyClick('+')}
                className="h-10 sm:h-11 rounded-xl bg-[#1E293B] hover:bg-[#27354D] border border-white/10 text-[#00C2FF] font-black text-base sm:text-lg flex items-center justify-center active:scale-95 transition-all shadow-sm"
                title="Plus (+)"
              >
                +
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* TRYB 2: PISZ NA TABLICY (KLAWIATURA W 100% ZDEMONTOWANA I UKRYTA)   */}
      {/* ================================================================== */}
      {activeTab === 'whiteboard' && (
        <div className="w-full flex flex-col gap-2 shrink-0 animate-in fade-in duration-150">
          {/* KARTA TABLICY: Pasek narzędzi w narożnikach + Tablica w kratkę */}
          <div className="w-full bg-[#0B101B] border border-white/15 rounded-2xl p-2.5 sm:p-3 flex flex-col gap-2 shadow-xl">
            {/* Pasek narzędzi tablicy */}
            <div className="flex items-center justify-between gap-2 shrink-0">
              {/* Narzędzia: Ołówek / Gumka */}
              <div className="flex items-center gap-1.5 bg-[#141C28] p-1 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setWbTool('pen');
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                    wbTool === 'pen'
                      ? 'bg-[#00C2FF] text-[#0B131E] font-black shadow-[0_0_10px_rgba(0,194,255,0.3)]'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  <PenTool size={13} />
                  <span>Ołówek</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setWbTool('eraser');
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                    wbTool === 'eraser'
                      ? 'bg-rose-500 text-white font-black shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  <Eraser size={13} />
                  <span>Gumka</span>
                </button>
              </div>

              {/* Akcje: Cofnij, Wyczyść, ewentualnie Pełny ekran */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleUndo}
                  className="p-1.5 rounded-lg text-[#8B8D98] hover:text-white bg-[#141C28] hover:bg-[#1E293B] border border-white/10 transition-colors"
                  title="Cofnij ostatnie pociągnięcie (Undo)"
                >
                  <Undo2 size={15} />
                </button>

                <button
                  type="button"
                  onClick={handleClearWhiteboard}
                  className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-colors"
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
                    className="p-1.5 rounded-lg text-[#00C2FF] hover:text-white bg-[#00C2FF]/10 hover:bg-[#00C2FF]/20 border border-[#00C2FF]/20 transition-colors"
                    title="Powiększ na pełny ekran"
                  >
                    <Maximize2 size={15} />
                  </button>
                )}
              </div>
            </div>

            {/* INTERAKTYWNA TABLICA W KRATKĘ (Wypełnia środek ekranu) */}
            <div 
              ref={canvasContainerRef}
              className="w-full h-[270px] sm:h-[300px] rounded-xl border border-white/10 relative overflow-hidden touch-none"
              style={{
                backgroundColor: '#070B12',
                backgroundImage: `
                  linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
                `,
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

              {/* Subtelny znak wodny z instrukcją, jeśli tablica jest czysta */}
              {!hasSavedCanvas && !isDrawing && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-[#8B8D98]/30 font-medium text-xs">
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
