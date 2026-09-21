import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft,
  PenTool, 
  Eraser, 
  Trash2, 
  Undo2
} from 'lucide-react';
import { triggerHaptic } from '../utils';
import { useTheme } from '../context/ThemeContext';

interface CkeScratchpadProps {
  isOpen: boolean;
  onClose: () => void;
  savedDataUrl?: string;
  onSaveData?: (dataUrl: string) => void;
  isOpenProof?: boolean;
  taskQuestion?: string;
  taskInstruction?: string;
  staticHint?: string;
  studentText?: string;
}

export function CkeScratchpad({
  isOpen,
  onClose,
  savedDataUrl = '',
  onSaveData,
}: CkeScratchpadProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [isDrawing, setIsDrawing] = useState<boolean>(false);

  // History stack for Undo
  const historyRef = useRef<ImageData[]>([]);
  const historyIndexRef = useRef<number>(-1);

  // Close and commit state
  const handleClose = () => {
    triggerHaptic('medium');
    const canvas = canvasRef.current;
    if (canvas && onSaveData) {
      try {
        onSaveData(canvas.toDataURL('image/png'));
      } catch {
        // ignore
      }
    }
    onClose();
  };

  // Keyboard Escape listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const saveState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
      historyRef.current.push(imgData);
      if (historyRef.current.length > 25) {
        historyRef.current.shift();
      }
      historyIndexRef.current = historyRef.current.length - 1;

      if (onSaveData) {
        onSaveData(canvas.toDataURL('image/png'));
      }
    } catch {
      // ignore
    }
  };

  // Initialize canvas in full screen
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const width = rect.width || window.innerWidth || 380;
      const height = rect.height || (window.innerHeight - 60) || 500;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.scale(dpr, dpr);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Restore saved drawing if available
      if (savedDataUrl && savedDataUrl.length > 50) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, width, height);
          saveState();
        };
        img.src = savedDataUrl;
      } else {
        ctx.clearRect(0, 0, width, height);
        saveState();
      }
    }, 60);

    return () => clearTimeout(timer);
  }, [isOpen]);

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
      if (onSaveData) {
        onSaveData(canvas.toDataURL('image/png'));
      }
    }
  };

  const handleClear = () => {
    triggerHaptic('medium');
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    saveState();
    if (onSaveData) {
      onSaveData('');
    }
  };

  const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.setPointerCapture(e.pointerId);
    setIsDrawing(true);
    const { x, y } = getCoordinates(e);

    ctx.beginPath();
    ctx.moveTo(x, y);

    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = 30;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = isDark ? '#F8FAFC' : '#0F172A';
      ctx.lineWidth = 2.5;
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (canvas && canvas.hasPointerCapture(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId);
    }
    setIsDrawing(false);
    saveState();
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.99 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.99 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 z-[999999] bg-white dark:bg-[#0B0F17] flex flex-col justify-between items-stretch overflow-hidden select-none"
        style={{ touchAction: 'none' }}
      >
        {/* HEADER TOOLBAR */}
        <header className="shrink-0 px-3 py-2.5 bg-white dark:bg-[#131B29] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 z-50 shadow-xs">
          {/* Left: Prominent EXIT BUTTON */}
          <button
            type="button"
            onClick={handleClose}
            className="bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold text-xs sm:text-sm px-3.5 sm:px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all shrink-0 cursor-pointer shadow-xs"
          >
            <ArrowLeft size={16} strokeWidth={2.5} />
            <span>Wróć do zadania</span>
          </button>

          {/* Middle: Tool selector (Pen vs Eraser) */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-1 gap-1 shrink-0">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setTool('pen');
              }}
              className={`py-1.5 px-2.5 sm:px-3 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                tool === 'pen'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <PenTool size={13} />
              <span className="hidden sm:inline">Rysik</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setTool('eraser');
              }}
              className={`py-1.5 px-2.5 sm:px-3 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                tool === 'eraser'
                  ? 'bg-rose-500 text-white font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Eraser size={13} />
              <span className="hidden sm:inline">Gumka</span>
            </button>
          </div>

          {/* Right side: Undo & Clear buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleUndo}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1 text-xs font-bold active:scale-95 cursor-pointer"
              title="Cofnij ostatnie pociągnięcie"
            >
              <Undo2 size={15} />
              <span className="text-[11px] sm:text-xs">Cofnij ↺</span>
            </button>

            <button
              type="button"
              onClick={handleClear}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 transition-colors flex items-center gap-1 text-xs font-bold active:scale-95 cursor-pointer"
              title="Wyczyść całą tablicę"
            >
              <Trash2 size={15} />
              <span className="text-[11px] sm:text-xs">Wyczyść</span>
            </button>
          </div>
        </header>

        {/* FULLSCREEN SQUARED NOTEBOOK CANVAS */}
        <div
          ref={containerRef}
          className="flex-1 w-full h-full relative cursor-crosshair overflow-hidden touch-none"
          style={{
            backgroundColor: isDark ? '#0B0F17' : '#FFFFFF',
            backgroundImage: isDark
              ? `linear-gradient(to right, rgba(255, 255, 255, 0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.06) 1px, transparent 1px)`
              : `linear-gradient(to right, rgba(15, 23, 42, 0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(15, 23, 42, 0.06) 1px, transparent 1px)`,
            backgroundSize: '24px 24px'
          }}
        >
          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="absolute inset-0 block w-full h-full"
          />
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}

export default CkeScratchpad;
