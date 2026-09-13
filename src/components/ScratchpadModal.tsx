import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Pen, Eraser, Trash2, Undo2, X, Maximize2, Minimize2, FileText } from 'lucide-react';

interface ScratchpadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ScratchpadModal({ isOpen, onClose }: ScratchpadModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [color, setColor] = useState<string>('#FFFFFF');
  const [lineWidth, setLineWidth] = useState<number>(3);
  const [mode, setMode] = useState<'draw' | 'notes'>('draw');
  const [notes, setNotes] = useState<string>(() => {
    return localStorage.getItem('matura_scratchpad_notes') || '';
  });

  // History for undo
  const [history, setHistory] = useState<ImageData[]>([]);

  const colors = [
    { name: 'Biały', hex: '#FFFFFF' },
    { name: 'Niebieski', hex: '#60A5FA' },
    { name: 'Żółty', hex: '#FACC15' },
    { name: 'Zielony', hex: '#4ADE80' },
  ];

  // Initialize and resize canvas
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    // Preserve existing drawing if any
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (tempCtx && canvas.width > 0 && canvas.height > 0) {
      tempCtx.drawImage(canvas, 0, 0);
    }

    const rect = parent.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = (rect.height - 10) * dpr;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      // Draw dark grid background
      ctx.fillStyle = '#0F1016';
      ctx.fillRect(0, 0, rect.width, rect.height);
      
      // Grid pattern
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      const gridSize = 24;
      for (let x = gridSize; x < rect.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, rect.height);
        ctx.stroke();
      }
      for (let y = gridSize; y < rect.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(rect.width, y);
        ctx.stroke();
      }

      if (tempCanvas.width > 0 && tempCanvas.height > 0) {
        ctx.drawImage(tempCanvas, 0, 0, rect.width, rect.height);
      }
    }
  }, []);

  useEffect(() => {
    if (isOpen && mode === 'draw') {
      const timer = setTimeout(initCanvas, 50);
      window.addEventListener('resize', initCanvas);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', initCanvas);
      };
    }
  }, [isOpen, mode, initCanvas]);

  const saveState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory(prev => [...prev.slice(-15), data]);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const newHistory = [...history];
    const previous = newHistory.pop();
    setHistory(newHistory);

    if (previous) {
      ctx.putImageData(previous, 0, 0);
    }
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    saveState();

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;

    ctx.fillStyle = '#0F1016';
    ctx.fillRect(0, 0, width, height);

    // Draw grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    const gridSize = 24;
    for (let x = gridSize; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = gridSize; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    saveState();
    setIsDrawing(true);
    const { x, y } = getCoordinates(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = tool === 'eraser' ? '#0F1016' : color;
    ctx.lineWidth = tool === 'eraser' ? 24 : lineWidth;
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const { x, y } = getCoordinates(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleNotesChange = (val: string) => {
    setNotes(val);
    localStorage.setItem('matura_scratchpad_notes', val);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-[#14151D] border border-white/10 rounded-[28px] w-full max-w-xl h-[85vh] flex flex-col shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-[#1A1B24]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Pen size={16} />
              </div>
              <div>
                <h3 className="text-white font-bold text-sm">Brudnopis do zadań</h3>
                <p className="text-[#8B8D98] text-xs">Rysuj lub zapisuj szybkie obliczenia</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex bg-white/5 p-0.5 rounded-lg border border-white/5 text-xs">
                <button
                  onClick={() => setMode('draw')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    mode === 'draw' ? 'bg-blue-600 text-white' : 'text-[#8B8D98] hover:text-white'
                  }`}
                >
                  Rysunek
                </button>
                <button
                  onClick={() => setMode('notes')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    mode === 'notes' ? 'bg-blue-600 text-white' : 'text-[#8B8D98] hover:text-white'
                  }`}
                >
                  Notatki
                </button>
              </div>

              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-[#8B8D98] hover:text-white flex items-center justify-center transition-colors ml-2"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Tools bar (only in draw mode) */}
          {mode === 'draw' && (
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 border-b border-white/5 bg-[#12131A]">
              {/* Pen / Eraser */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setTool('pen')}
                  className={`p-2 rounded-lg transition-colors ${
                    tool === 'pen' ? 'bg-blue-600 text-white' : 'text-[#8B8D98] hover:bg-white/5 hover:text-white'
                  }`}
                  title="Pióro"
                >
                  <Pen size={15} />
                </button>
                <button
                  onClick={() => setTool('eraser')}
                  className={`p-2 rounded-lg transition-colors ${
                    tool === 'eraser' ? 'bg-blue-600 text-white' : 'text-[#8B8D98] hover:bg-white/5 hover:text-white'
                  }`}
                  title="Gumka"
                >
                  <Eraser size={15} />
                </button>
              </div>

              {/* Colors */}
              {tool === 'pen' && (
                <div className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-lg">
                  {colors.map(c => (
                    <button
                      key={c.hex}
                      onClick={() => setColor(c.hex)}
                      className={`w-5 h-5 rounded-full border transition-transform ${
                        color === c.hex ? 'scale-110 border-white ring-2 ring-white/20' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                </div>
              )}

              {/* Line width */}
              {tool === 'pen' && (
                <div className="flex items-center gap-1 bg-white/5 px-1.5 py-0.5 rounded-lg text-xs">
                  {[2, 4, 7].map(w => (
                    <button
                      key={w}
                      onClick={() => setLineWidth(w)}
                      className={`px-2 py-1 rounded font-bold ${
                        lineWidth === w ? 'bg-white/20 text-white' : 'text-[#8B8D98] hover:text-white'
                      }`}
                    >
                      {w === 2 ? 'S' : w === 4 ? 'M' : 'L'}
                    </button>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-1 ml-auto">
                <button
                  onClick={handleUndo}
                  disabled={history.length === 0}
                  className="p-2 rounded-lg text-[#8B8D98] hover:text-white hover:bg-white/5 disabled:opacity-30 transition-colors"
                  title="Cofnij"
                >
                  <Undo2 size={15} />
                </button>
                <button
                  onClick={handleClear}
                  className="p-2 rounded-lg text-red-400/80 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  title="Wyczyść tablicę"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          )}

          {/* Content Area */}
          <div className="flex-1 relative overflow-hidden bg-[#0F1016]">
            {mode === 'draw' ? (
              <canvas
                ref={canvasRef}
                className="w-full h-full touch-none cursor-crosshair"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
            ) : (
              <div className="h-full p-4 flex flex-col">
                <textarea
                  value={notes}
                  onChange={(e) => handleNotesChange(e.target.value)}
                  placeholder="Tu możesz wpisywać swoje równania, założenia lub wyniki cząstkowe...&#10;np. Δ = b² - 4ac = 16 - 12 = 4&#10;x₁ = (-4 - 2) / 2 = -3"
                  className="w-full flex-1 bg-transparent text-white font-mono text-sm leading-relaxed outline-none resize-none placeholder:text-white/20"
                />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-white/10 bg-[#1A1B24] flex items-center justify-between">
            <span className="text-xs text-[#8B8D98]">
              {mode === 'draw' ? 'Wszystkie rysunki zostają zachowane w trakcie sesji' : 'Notatki zapisują się automatycznie'}
            </span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors"
            >
              Zamknij brudnopis
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
