import { motion } from 'motion/react';
import { ReactNode } from 'react';
import { Hexagon, Sparkles } from 'lucide-react';

export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeMap = {
    sm: 24,
    md: 40,
    lg: 64,
  };
  
  return (
    <div className="relative flex items-center justify-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        className="text-blue-500/30"
      >
        <Hexagon size={sizeMap[size]} strokeWidth={1} />
      </motion.div>
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        className="absolute text-indigo-500/40"
      >
        <Hexagon size={sizeMap[size]} strokeWidth={1} className="scale-75" />
      </motion.div>
      <div className="absolute flex items-center justify-center">
        <motion.div
           animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.3, 1, 0.3] }}
           transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <Sparkles size={sizeMap[size] / 2.5} className="text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
        </motion.div>
      </div>
    </div>
  );
}

export function LoadingScreen({ message = "Wczytywanie danych..." }: { message?: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#050505]"
    >
      <div className="flex flex-col items-center gap-8">
        <div className="relative">
          <div className="absolute inset-0 bg-blue-500/20 blur-[50px] rounded-full scale-150" />
          <LoadingSpinner size="lg" />
        </div>
        <motion.div 
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          className="text-white/60 font-display font-medium tracking-[0.2em] text-xs uppercase"
        >
          {message}
        </motion.div>
      </div>
    </motion.div>
  );
}

// A wrapper for async content that might load within a page section
export function AsyncContent({ 
  isLoading, 
  children, 
  fallbackMessage
}: { 
  isLoading: boolean; 
  children: ReactNode;
  fallbackMessage?: string;
}) {
  return (
    <div className="relative w-full flex flex-col flex-1 h-full min-h-[200px]">
      {isLoading && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-[#0B0E14]/60 backdrop-blur-sm rounded-[32px] border border-white/5"
        >
          <LoadingSpinner size="md" />
          {fallbackMessage && (
             <motion.div 
               animate={{ opacity: [0.3, 1, 0.3] }}
               transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
               className="mt-6 text-white/50 text-[10px] font-bold uppercase tracking-widest"
             >
               {fallbackMessage}
             </motion.div>
          )}
        </motion.div>
      )}
      <div className={`transition-opacity duration-700 flex-1 flex flex-col h-full ${isLoading ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        {children}
      </div>
    </div>
  );
}
