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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [penColor] = useState<string>('#00C2FF');
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
        saveState();
      }
    }, 60);

    return () => clearTimeout(timer);
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

  const handleUndo = () => {
    if (historyIndexRef.current <= 0) return;
    triggerHaptic('light');
    historyIndexRef.current -= 1;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.putImageData(historyRef.current[historyIndexRef.current], 0, 0);

    if (onSaveData) {
      onSaveData(canvas.toDataURL('image/png'));
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
      ctx.strokeStyle = penColor;
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
        className="fixed inset-0 z-[999999] bg-[#070B12] flex flex-col justify-between items-stretch overflow-hidden select-none"
        style={{ touchAction: 'none' }}
      >
        {/* HEADER TOOLBAR: ALWAYS PINNED TO THE VERY TOP WITH HIGHEST Z-INDEX */}
        <header className="shrink-0 px-3 py-2.5 bg-[#0B0E14] border-b border-white/10 flex items-center justify-between gap-2 z-50 shadow-2xl">
          {/* Left: Prominent EXIT BUTTON */}
          <button
            type="button"
            onClick={handleClose}
            className="bg-[#00C2FF] hover:bg-[#00B4E6] border-b-2 border-[#0099CC] text-[#0B131E] font-black text-xs sm:text-sm px-3.5 sm:px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-[0_0_18px_rgba(0,194,255,0.4)] active:scale-95 transition-all shrink-0 cursor-pointer"
          >
            <ArrowLeft size={17} className="stroke-[3]" />
            <span>← Wróć do zadania</span>
          </button>

          {/* Middle: Tool selector (Pen vs Eraser) */}
          <div className="flex items-center bg-[#141C28] border border-white/10 rounded-xl p-1 gap-1 shrink-0">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setTool('pen');
              }}
              className={`py-1.5 px-2.5 sm:px-3 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                tool === 'pen'
                  ? 'bg-[#00C2FF] text-[#0B131E] font-black shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <PenTool size={13} />
              <span className="hidden sm:inline">Ołówek</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setTool('eraser');
              }}
              className={`py-1.5 px-2.5 sm:px-3 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                tool === 'eraser'
                  ? 'bg-rose-500 text-white font-black shadow-sm'
                  : 'text-white/60 hover:text-white'
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
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#141C28] hover:bg-white/10 text-white/90 hover:text-white border border-white/10 transition-colors flex items-center gap-1 text-xs font-bold active:scale-95 cursor-pointer"
              title="Cofnij ostatnie pociągnięcie"
            >
              <Undo2 size={15} />
              <span className="text-[11px] sm:text-xs">Cofnij ↺</span>
            </button>

            <button
              type="button"
              onClick={handleClear}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 border border-rose-500/30 transition-colors flex items-center gap-1 text-xs font-bold active:scale-95 cursor-pointer"
              title="Wyczyść całą tablicę"
            >
              <Trash2 size={15} />
              <span className="text-[11px] sm:text-xs">Wyczyść</span>
            </button>
          </div>
        </header>

        {/* FULLSCREEN SQUARED MATHEMATICS NOTEBOOK CANVAS */}
        <div
          ref={containerRef}
          className="flex-1 w-full h-full relative cursor-crosshair overflow-hidden touch-none"
          style={{
            backgroundColor: '#070B12',
            backgroundImage: `
              linear-gradient(to right, rgba(255, 255, 255, 0.08) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255, 255, 255, 0.08) 1px, transparent 1px)
            `,
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
