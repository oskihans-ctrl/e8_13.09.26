import React from 'react';

interface JasneLogoProps {
  variant?: 'icon' | 'horizontal' | 'vertical';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showBadge?: boolean;
}

/**
 * JasneLogo:
 * Oficjalny znak marki "Jasne." zgodny w 100% z wzorcem graficznym (logo.jasne.png):
 * - Zaokrąglona bańka żarówki z subtelną talią i łukiem
 * - Wewnętrzny łuk kopuły (górna aureola)
 * - Centralny żarnik kielichowy (sercowate rozchylenie V)
 * - 3 paski gwintu żarówki (lekko skośne)
 * - Ciepły, słoneczny złocisty żółty (#FFC700 / #FFB800) z subtelnym reliefem 3D
 * - Autorska typografia "Jasne." z kropką
 */
export function JasneLogo({
  variant = 'horizontal',
  size = 'md',
  className = '',
  showBadge = false
}: JasneLogoProps) {
  const iconSizes = {
    xs: 24,
    sm: 30,
    md: 38,
    lg: 52,
    xl: 72
  };

  const textSizes = {
    xs: 'text-base sm:text-lg',
    sm: 'text-lg sm:text-xl',
    md: 'text-2xl sm:text-3xl',
    lg: 'text-3xl sm:text-4xl',
    xl: 'text-5xl sm:text-6xl'
  };

  const currentIconSize = iconSizes[size];

  // Oficjalny wektorowy sygnet żarówki marki Jasne. (1:1 z logo.jasne.png)
  const OfficialLightbulbBulb = (
    <svg 
      width={currentIconSize} 
      height={Math.round(currentIconSize * 1.12)} 
      viewBox="0 0 100 112" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 transition-transform duration-200 group-hover:scale-105 select-none"
      style={{ filter: 'drop-shadow(0px 2px 3px rgba(217, 119, 6, 0.32))' }}
    >
      <defs>
        <linearGradient id="jasneSunGradSolid" x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#FFE033" />
          <stop offset="45%" stopColor="#FFC700" />
          <stop offset="100%" stopColor="#EAA000" />
        </linearGradient>
      </defs>

      <g stroke="#FFC700" fill="none">
        {/* 1. Zewnętrzny gładki kontur bańki żarówki */}
        <path 
          d="M 39 74 C 36 67 29 57 24 47 C 19 36 21 21 35 13 C 44 8 56 8 65 13 C 79 21 81 36 76 47 C 71 57 64 67 61 74 L 61 75 C 61 78 58 80 55 80 L 45 80 C 42 80 39 78 39 75 Z" 
          stroke="url(#jasneSunGradSolid)" 
          strokeWidth="6" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          style={{ stroke: '#FFC700' }}
        />

        {/* 2. Wewnętrzny łuk kopuły (górna aureola wewnątrz bańki) */}
        <path 
          d="M 37 38 C 39 27 47 21 50 21 C 53 21 61 27 63 38" 
          stroke="url(#jasneSunGradSolid)" 
          strokeWidth="5.2" 
          strokeLinecap="round" 
          style={{ stroke: '#FFC700' }}
        />

        {/* 3. Żarnik w centrum (charakterystyczny kielich / sercowate rozchylenie V) */}
        <path 
          d="M 46 76 L 46 64 C 46 61 43 57 40 54 C 36 51 36 45 41 43 C 44 41 48 42 50 48 C 52 42 56 41 59 43 C 64 45 64 51 60 54 C 57 57 54 61 54 64 L 54 76" 
          stroke="url(#jasneSunGradSolid)" 
          strokeWidth="5.2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          style={{ stroke: '#FFC700' }}
        />

        {/* 4. Gwint żarówki (3 zaokrąglone paski ze skrętem gwintu) */}
        <path 
          d="M 40 86 L 60 84.5" 
          stroke="url(#jasneSunGradSolid)" 
          strokeWidth="5.5" 
          strokeLinecap="round" 
          style={{ stroke: '#FFC700' }}
        />
        <path 
          d="M 42 93.5 L 58 92" 
          stroke="url(#jasneSunGradSolid)" 
          strokeWidth="5.5" 
          strokeLinecap="round" 
          style={{ stroke: '#FFC700' }}
        />
        <path 
          d="M 45 100 C 47 101.5 53 101.5 55 100" 
          stroke="url(#jasneSunGradSolid)" 
          strokeWidth="5" 
          strokeLinecap="round" 
          style={{ stroke: '#FFC700' }}
        />
      </g>
    </svg>
  );

  // Wariant: Sama ikona / sygnet (czysta, bez żadnych zewnętrznych ramek)
  if (variant === 'icon') {
    return (
      <div className={`inline-flex items-center justify-center shrink-0 ${className}`}>
        {OfficialLightbulbBulb}
      </div>
    );
  }

  // Wariant: Układ pionowy (1:1 jak na przesłanym obrazku logo.jasne.png)
  if (variant === 'vertical') {
    return (
      <div className={`flex flex-col items-center justify-center text-center gap-3 select-none ${className}`}>
        {/* Sygnet żarówki */}
        <div className="flex items-center justify-center">
          {OfficialLightbulbBulb}
        </div>
        
        {/* Logotyp Jasne. */}
        <div className="flex flex-col items-center justify-center text-center">
          <span 
            className={`font-display font-extrabold tracking-tight text-[#FFC700] leading-none drop-shadow-[0_2px_4px_rgba(217,119,6,0.25)] ${textSizes[size]}`}
            style={{ letterSpacing: '-0.02em' }}
          >
            Jasne.
          </span>
          {showBadge && (
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-1.5 leading-none tracking-wide">
              Platforma Egzaminacyjna
            </span>
          )}
        </div>
      </div>
    );
  }

  // Wariant domyślny: Układ poziomy (czysty sygnet obok logotypu, bez żadnej ramki)
  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Sygnet żarówki - czysty bez obramowania */}
      <div className="shrink-0 flex items-center justify-center">
        {OfficialLightbulbBulb}
      </div>
      
      {/* Typografia z oficjalnego logo */}
      <div className="flex flex-col justify-center">
        <div className="flex items-center">
          <span 
            className={`font-display font-black tracking-tight text-[#FFC700] dark:text-[#FFD000] leading-none drop-shadow-[0_1px_2px_rgba(217,119,6,0.2)] ${textSizes[size]}`}
            style={{ letterSpacing: '-0.02em' }}
          >
            Jasne<span className="text-[#FFC700] dark:text-[#FFD000]">.</span>
          </span>
        </div>
        {showBadge && (
          <span className="text-[9px] font-semibold text-slate-500 dark:text-slate-400 mt-1 leading-none tracking-wide whitespace-nowrap">
            Platforma Egzaminacyjna
          </span>
        )}
      </div>
    </div>
  );
}
