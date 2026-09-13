import React, { useRef, useState, useEffect, useCallback } from 'react';
import { 
  Pen, 
  Highlighter, 
  Eraser, 
  Trash2, 
  Undo2, 
  Redo2, 
  Maximize2, 
  Minimize2, 
  Check, 
  Sparkles,
  Palette,
  Target
} from 'lucide-react';
import { triggerHaptic } from '../utils';

interface Point {
  x: number;
  y: number;
}

interface WhiteboardProps {
  onDraw: (dataUrl: string) => void;
  initialHeight?: number;
  isExpanded?: boolean;
  onToggleExpand?: (expanded: boolean) => void;
  finalAnswer?: string;
  onFinalAnswerChange?: (val: string) => void;
  solutionOnCanvas?: boolean;
  onSolutionOnCanvasChange?: (onCanvas: boolean) => void;
}

export function Whiteboard({
  onDraw,
  initialHeight = 380,
  isExpanded: controlledExpanded,
  onToggleExpand,
  finalAnswer = '',
  onFinalAnswerChange,
  solutionOnCanvas = false,
  onSolutionOnCanvasChange,
}: WhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [internalExpanded, setInternalExpanded] = useState(false);
  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;

  // Active Tool: 'pen' | 'highlighter' | 'eraser'
  const [tool, setTool] = useState<'pen' | 'highlighter' | 'eraser'>('pen');
  const [penColor, setPenColor] = useState<'#FFFFFF' | '#00E5FF'>('#FFFFFF');
  const [isDrawing, setIsDrawing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Stroke points for Bézier curve smoothing
  const pointsRef = useRef<Point[]>([]);

  // Undo / Redo history
  const historyRef = useRef<ImageData[]>([]);
  const historyIndexRef = useRef<number>(-1);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const toggleExpand = () => {
    const next = !isExpanded;
    setInternalExpanded(next);
    onToggleExpand?.(next);
    triggerHaptic('medium');
  };

  // Push snapshot to history
  const pushState = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const newHistory = historyRef.current.slice(0, historyIndexRef.current + 1);
    newHistory.push(imgData);

    // Limit history stack
    if (newHistory.length > 25) newHistory.shift();

    historyRef.current = newHistory;
    historyIndexRef.current = newHistory.length - 1;
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(false);
  }, []);

  // Export full composite image (ink + dark graphite background + subtle grid) for AI Tutor
  const exportImage = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const offscreen = document.createElement('canvas');
    offscreen.width = canvas.width;
    offscreen.height = canvas.height;
    const offCtx = offscreen.getContext('2d');
    if (!offCtx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;

    offCtx.scale(dpr, dpr);

    // Graphite background
    offCtx.fillStyle = '#0F172A';
    offCtx.fillRect(0, 0, w, h);

    // Notebook grid
    offCtx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    offCtx.lineWidth = 1;
    const gridSize = 24;
    for (let x = gridSize; x < w; x += gridSize) {
      offCtx.beginPath();
      offCtx.moveTo(x, 0);
      offCtx.lineTo(x, h);
      offCtx.stroke();
    }
    for (let y = gridSize; y < h; y += gridSize) {
      offCtx.beginPath();
      offCtx.moveTo(0, y);
      offCtx.lineTo(w, y);
      offCtx.stroke();
    }

    // Draw ink
    offCtx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, w, h);

    onDraw(offscreen.toDataURL('image/png'));
  }, [onDraw]);

  // Canvas initialization
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    // Save existing content before resize
    let savedContent: HTMLCanvasElement | null = null;
    if (canvas.width > 0 && canvas.height > 0) {
      savedContent = document.createElement('canvas');
      savedContent.width = canvas.width;
      savedContent.height = canvas.height;
      const sCtx = savedContent.getContext('2d');
      if (sCtx) {
        sCtx.drawImage(canvas, 0, 0);
      }
    }

    const w = Math.floor(rect.width);
    const h = Math.floor(isExpanded ? window.innerHeight * 0.65 : initialHeight);

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    ctx.scale(dpr, dpr);

    // Restore strokes or initialize
    if (savedContent) {
      ctx.drawImage(savedContent, 0, 0, savedContent.width / dpr, savedContent.height / dpr, 0, 0, w, h);
    } else {
      // Clear transparent
      ctx.clearRect(0, 0, w, h);
      const blankData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      historyRef.current = [blankData];
      historyIndexRef.current = 0;
      setCanUndo(false);
      setCanRedo(false);
    }
  }, [initialHeight, isExpanded]);

  useEffect(() => {
    initCanvas();
    const handleResize = () => initCanvas();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [initCanvas]);

  // Touch/Mouse Coordinate extraction
  const getCoordinates = (e: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ('touches' in e && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    } else if ('changedTouches' in e && e.changedTouches.length > 0) {
      return {
        x: e.changedTouches[0].clientX - rect.left,
        y: e.changedTouches[0].clientY - rect.top,
      };
    }
    return {
      x: (e as React.MouseEvent).clientX - rect.left,
      y: (e as React.MouseEvent).clientY - rect.top,
    };
  };

  // Configure context for active tool
  const setupContextForTool = (ctx: CanvasRenderingContext2D) => {
    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = 26;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    } else if (tool === 'highlighter') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.35)'; // Neon translucent yellow
      ctx.lineWidth = 22;
      ctx.lineCap = 'square';
      ctx.lineJoin = 'round';
    } else {
      // Pen
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = penColor;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  };

  // START DRAWING
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const pt = getCoordinates(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setupContextForTool(ctx);
    pointsRef.current = [pt];
    setIsDrawing(true);

    if (tool === 'eraser') {
      triggerHaptic('light');
    }
  };

  // DRAW (Bézier Curve Smoothing)
  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;

    const pt = getCoordinates(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const points = pointsRef.current;
    points.push(pt);

    setupContextForTool(ctx);

    if (points.length >= 3) {
      const p1 = points[points.length - 3];
      const p2 = points[points.length - 2];
      const p3 = points[points.length - 1];

      // Midpoints for smooth quadratic Bézier curves
      const mid1 = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
      const mid2 = { x: (p2.x + p3.x) / 2, y: (p2.y + p3.y) / 2 };

      ctx.beginPath();
      ctx.moveTo(mid1.x, mid1.y);
      ctx.quadraticCurveTo(p2.x, p2.y, mid2.x, mid2.y);
      ctx.stroke();
    } else if (points.length === 2) {
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      ctx.lineTo(points[1].x, points[1].y);
      ctx.stroke();
    }
  };

  // STOP DRAWING
  const stopDrawing = (e?: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    if (e) e.preventDefault();
    setIsDrawing(false);

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const points = pointsRef.current;

    // If single tap dot
    if (ctx && points.length === 1 && tool !== 'eraser') {
      setupContextForTool(ctx);
      ctx.beginPath();
      ctx.arc(points[0].x, points[0].y, tool === 'highlighter' ? 10 : 1.5, 0, Math.PI * 2);
      ctx.fillStyle = tool === 'highlighter' ? 'rgba(250, 204, 21, 0.35)' : penColor;
      ctx.fill();
    }

    pointsRef.current = [];
    pushState();
    exportImage();
  };

  // UNDO
  const handleUndo = () => {
    if (historyIndexRef.current <= 0) return;
    triggerHaptic('light');
    const newIdx = historyIndexRef.current - 1;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx && historyRef.current[newIdx]) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.putImageData(historyRef.current[newIdx], 0, 0);
      historyIndexRef.current = newIdx;
      setCanUndo(newIdx > 0);
      setCanRedo(true);
      exportImage();
    }
  };

  // REDO
  const handleRedo = () => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    triggerHaptic('light');
    const newIdx = historyIndexRef.current + 1;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx && historyRef.current[newIdx]) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.putImageData(historyRef.current[newIdx], 0, 0);
      historyIndexRef.current = newIdx;
      setCanUndo(true);
      setCanRedo(newIdx < historyRef.current.length - 1);
      exportImage();
    }
  };

  // CLEAR ALL
  const handleClear = () => {
    triggerHaptic('medium');
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pushState();
      exportImage();
    }
    setShowClearConfirm(false);
  };

  return (
    <div className="flex flex-col w-full">
      {/* ------------------------------------------------------------- */}
      {/* CANVAS CONTAINER WITH NOTEBOOK GRID                            */}
      {/* ------------------------------------------------------------- */}
      <div
        ref={containerRef}
        className={`relative w-full rounded-[24px] border border-white/10 shadow-2xl overflow-hidden transition-all duration-200 ${
          isExpanded ? 'fixed inset-3 z-50 rounded-[28px]' : ''
        }`}
        style={{
          backgroundColor: '#0F172A',
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px',
        }}
      >
        {/* Top Floating Badge with Mode / Fullscreen Toggle */}
        <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0B0F17]/80 backdrop-blur-md border border-white/10 text-[11px] font-bold text-[#8B8D98] pointer-events-auto shadow-md">
            <span className="w-2 h-2 rounded-full bg-[#00E5FF] animate-pulse" />
            <span>Brudnopis</span>
          </div>

          <div className="flex items-center gap-1.5 pointer-events-auto">
            <button
              type="button"
              onClick={toggleExpand}
              className="p-2 rounded-xl bg-[#0B0F17]/80 backdrop-blur-md hover:bg-[#161F2E] text-[#8B8D98] hover:text-white border border-white/10 transition-colors shadow-md"
              title={isExpanded ? 'Zwiń tablicę' : 'Pełny ekran'}
            >
              {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          </div>
        </div>

        {/* The Transparent Drawing Canvas */}
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          onTouchCancel={stopDrawing}
          className="w-full block touch-none cursor-crosshair relative z-10"
        />

        {/* ------------------------------------------------------------- */}
        {/* FLOATING CANVAS TOOLBAR (Ergonomic Pill)                      */}
        {/* ------------------------------------------------------------- */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 p-1.5 rounded-full bg-[#0B0F17]/90 backdrop-blur-md border border-white/10 shadow-2xl">
          {/* Pen Tool */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setTool('pen');
            }}
            className={`p-2.5 rounded-full transition-all flex items-center justify-center ${
              tool === 'pen'
                ? 'bg-[#00E5FF] text-black font-black shadow-[0_0_15px_rgba(0,229,255,0.4)]'
                : 'text-[#8B8D98] hover:text-white hover:bg-white/5'
            }`}
            title="Długopis (3px)"
          >
            <Pen size={17} />
          </button>

          {/* Color Switcher (White / Cyan) - visible if pen active */}
          {tool === 'pen' && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setPenColor((c) => (c === '#FFFFFF' ? '#00E5FF' : '#FFFFFF'));
              }}
              className="w-7 h-7 rounded-full border border-white/20 flex items-center justify-center transition-transform active:scale-90"
              style={{ backgroundColor: penColor }}
              title="Zmień kolor tuszu"
            >
              <span className="sr-only">Zmień kolor</span>
            </button>
          )}

          {/* Highlighter */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setTool('highlighter');
            }}
            className={`p-2.5 rounded-full transition-all flex items-center justify-center ${
              tool === 'highlighter'
                ? 'bg-sky-400 text-black font-black shadow-[0_0_15px_rgba(56,189,248,0.4)]'
                : 'text-[#8B8D98] hover:text-white hover:bg-white/5'
            }`}
            title="Zakreślacz neonowy"
          >
            <Highlighter size={17} />
          </button>

          {/* Eraser */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setTool('eraser');
            }}
            className={`p-2.5 rounded-full transition-all flex items-center justify-center ${
              tool === 'eraser'
                ? 'bg-rose-500 text-white font-black shadow-[0_0_15px_rgba(244,63,94,0.4)]'
                : 'text-[#8B8D98] hover:text-white hover:bg-white/5'
            }`}
            title="Gumka precyzyjna"
          >
            <Eraser size={17} />
          </button>

          <div className="w-[1px] h-5 bg-white/10 mx-0.5" />

          {/* Undo */}
          <button
            type="button"
            disabled={!canUndo}
            onClick={handleUndo}
            className={`p-2 rounded-full transition-colors ${
              canUndo ? 'text-white hover:bg-white/10 active:scale-90' : 'text-[#8B8D98]/40 cursor-not-allowed'
            }`}
            title="Cofnij"
          >
            <Undo2 size={16} />
          </button>

          {/* Redo */}
          <button
            type="button"
            disabled={!canRedo}
            onClick={handleRedo}
            className={`p-2 rounded-full transition-colors ${
              canRedo ? 'text-white hover:bg-white/10 active:scale-90' : 'text-[#8B8D98]/40 cursor-not-allowed'
            }`}
            title="Ponów"
          >
            <Redo2 size={16} />
          </button>

          {/* Clear All with confirmation */}
          {showClearConfirm ? (
            <div className="flex items-center gap-1 pl-1">
              <button
                type="button"
                onClick={handleClear}
                className="px-2.5 py-1 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-full transition-transform active:scale-95"
              >
                Wyczyść!
              </button>
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-2 py-1 bg-white/10 text-[#8B8D98] hover:text-white text-xs font-bold rounded-full"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setShowClearConfirm(true);
              }}
              className="p-2 rounded-full text-[#8B8D98] hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              title="Wyczyść całą tablicę"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* FINAL ANSWER INPUT UNDER CANVAS (Wprowadzanie wyniku z tablicy) */}
      {/* ------------------------------------------------------------- */}
      <div className="mt-3 bg-[#0B0F17] border border-white/10 rounded-[22px] p-3.5 sm:p-4 shadow-xl flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
            <Target size={14} className="text-[#00C2FF]" />
            <span>Twój wynik końcowy:</span>
          </label>

          {/* Checkbox declaration: "Moje rozwiązanie jest na tablicy" */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onSolutionOnCanvasChange?.(!solutionOnCanvas);
            }}
            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border transition-all ${
              solutionOnCanvas
                ? 'bg-[#00E5FF]/15 text-[#00E5FF] border-[#00E5FF]/40 shadow-[0_0_12px_rgba(0,229,255,0.2)]'
                : 'bg-white/5 text-[#8B8D98] border-white/10 hover:border-white/20'
            }`}
          >
            <div
              className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-colors ${
                solutionOnCanvas ? 'bg-[#00E5FF] border-[#00E5FF] text-black' : 'border-[#8B8D98]'
              }`}
            >
              {solutionOnCanvas && <Check size={11} strokeWidth={3} />}
            </div>
            <span>Rozwiązanie na tablicy</span>
          </button>
        </div>

        {/* Compact final input */}
        <div className="relative">
          <input
            type="text"
            value={finalAnswer}
            disabled={solutionOnCanvas}
            onChange={(e) => onFinalAnswerChange?.(e.target.value)}
            placeholder={
              solutionOnCanvas
                ? '✓ AI oceni pełny zapis graficzny z powyższej tablicy'
                : 'Wpisz np. x = 5, a = 3/4, brak rozwiązań...'
            }
            className={`w-full bg-[#161F2E] text-white px-3.5 py-2.5 rounded-xl border outline-none text-sm font-mono transition-colors ${
              solutionOnCanvas
                ? 'opacity-60 border-transparent cursor-not-allowed italic text-emerald-400'
                : 'border-white/10 focus:border-[#00E5FF]/50'
            }`}
          />
        </div>
      </div>
    </div>
  );
}
