import React from 'react';

interface JasneLogoProps {
  variant?: 'icon' | 'horizontal' | 'vertical';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showBadge?: boolean;
}

export function JasneLogo({
  variant = 'horizontal',
  size = 'md',
  className = '',
  showBadge = false
}: JasneLogoProps) {
  // Dimension mapping
  const iconSizes = {
    xs: 20,
    sm: 26,
    md: 34,
    lg: 48,
    xl: 68
  };

  const textSizes = {
    xs: 'text-sm',
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl sm:text-3xl',
    xl: 'text-4xl sm:text-5xl'
  };

  const currentIconSize = iconSizes[size];

  // SVG of the official Jasne lightbulb with Brain inside
  const LightbulbIcon = (
    <svg 
      width={currentIconSize} 
      height={currentIconSize} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 transition-transform duration-200 group-hover:scale-105 drop-shadow-[0_0_12px_rgba(0,102,255,0.45)]"
    >
      <defs>
        {/* Royal Blue Linear Gradient matching brand identity */}
        <linearGradient id="jasneRoyalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="30%" stopColor="#0066FF" />
          <stop offset="70%" stopColor="#0052CC" />
          <stop offset="100%" stopColor="#003D99" />
        </linearGradient>
      </defs>

      {/* Outer Lightbulb Contour */}
      <path 
        d="M 37 66 C 35 60 29 52 25 44 C 20 34 24 19 36 12 C 44 8 56 8 64 12 C 76 19 80 34 75 44 C 71 52 65 60 63 66" 
        stroke="url(#jasneRoyalGrad)" 
        strokeWidth="4.8" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />

      {/* Screw Base Threads (3 bars) */}
      <path d="M 38 73 L 62 73" stroke="url(#jasneRoyalGrad)" strokeWidth="4.8" strokeLinecap="round" />
      <path d="M 40 79 L 60 79" stroke="url(#jasneRoyalGrad)" strokeWidth="4.8" strokeLinecap="round" />
      <path d="M 43 85 L 57 85" stroke="url(#jasneRoyalGrad)" strokeWidth="4.8" strokeLinecap="round" />

      {/* Left Brain Hemisphere */}
      <g id="jasneBrainHalf" stroke="url(#jasneRoyalGrad)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        {/* Midline Fissure */}
        <path d="M 47.5 20 L 47.5 49" />
        {/* Top Frontal Lobe */}
        <path d="M 47.5 20 C 42 19 36 22 33 27 C 30 31 31 35 34 38" />
        {/* Upper Sulcus Convolution */}
        <path d="M 34 38 C 37 40 41 39 44 36" />
        {/* Middle Temporal Lobe */}
        <path d="M 34 38 C 30 41 30 46 33 50" />
        {/* Lower Sulcus Convolution */}
        <path d="M 33 50 C 37 52 41 50 44 47" />
        {/* Bottom Occipital Lobe */}
        <path d="M 33 50 C 35 54 40 56 44 54 C 46.5 52.5 47.5 51 47.5 49" />
      </g>

      {/* Right Brain Hemisphere (Mirrored) */}
      <use href="#jasneBrainHalf" transform="translate(100, 0) scale(-1, 1)" />
    </svg>
  );

  if (variant === 'icon') {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        {LightbulbIcon}
      </div>
    );
  }

  if (variant === 'vertical') {
    return (
      <div className={`flex flex-col items-center gap-2 text-center select-none ${className}`}>
        <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500/15 via-sky-500/10 to-transparent border border-blue-500/30 shadow-[0_0_25px_rgba(0,102,255,0.25)]">
          {LightbulbIcon}
        </div>
        <div className="flex items-center">
          <span className={`font-display font-black tracking-tight text-[#0066FF] drop-shadow-sm ${textSizes[size]}`}>
            Jasne<span className="text-[#0052CC]">.</span>
          </span>
        </div>
      </div>
    );
  }

  // Horizontal variant (default)
  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <div className="p-1.5 sm:p-2 rounded-2xl bg-gradient-to-br from-[#0066FF]/20 via-[#0052CC]/15 to-transparent border border-[#0066FF]/35 shadow-[0_0_20px_rgba(0,102,255,0.25)] shrink-0">
        {LightbulbIcon}
      </div>
      <div className="flex flex-col leading-none">
        <div className="flex items-center gap-1">
          <span className={`font-display font-black tracking-tight text-white drop-shadow-sm ${textSizes[size]}`}>
            Jasne<span className="text-[#0084FF] font-extrabold">.</span>
          </span>
        </div>
        {showBadge && (
          <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-[#38BDF8] mt-1">
            Egzamin Ósmoklasisty
          </span>
        )}
      </div>
    </div>
  );
}
