import React from 'react';

/**
 * BrandBackgroundPattern:
 * Uporządkowany, elegancki wzór tożsamości marki "Jasne.":
 * Regularna, symetryczna siatka geometryczna (kratka/grid notesu akademickiego)
 * z naprzemiennie rozmieszczonymi sygnaturami żarówki olśnienia i monogramu "J.",
 * zapewniająca ład przestrzenny i czytelność treści bez chaosu.
 */
export function BrandBackgroundPattern() {
  return (
    <div 
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* 1. Uporządkowana geometryczna siatka z naprzemiennymi żarówkami Jasne. i monogramami J. */}
      <svg 
        className="absolute inset-0 w-full h-full opacity-[0.14] dark:opacity-[0.05] text-slate-700 dark:text-amber-400" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern 
            id="jasne-ordered-grid-pattern" 
            width="120" 
            height="120" 
            patternUnits="userSpaceOnUse"
          >
            {/* Subtelne linie precyzyjnej siatki zeszytu edukacyjnego */}
            <path 
              d="M 120 0 L 0 0 0 120" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="0.6" 
              strokeDasharray="2 4"
              opacity="0.35" 
            />

            {/* Punkty węzłowe na przecięciach siatki */}
            <circle cx="0" cy="0" r="1.5" fill="#F59E0B" opacity="0.6" />
            <circle cx="120" cy="0" r="1.5" fill="#F59E0B" opacity="0.6" />
            <circle cx="0" cy="120" r="1.5" fill="#F59E0B" opacity="0.6" />
            <circle cx="120" cy="120" r="1.5" fill="#F59E0B" opacity="0.6" />
            <circle cx="60" cy="60" r="1.2" fill="currentColor" opacity="0.4" />

            {/* MODUŁ A: Oficjalny sygnet żarówki Jasne. z logo.jasne.png (środek górnego lewego kwadrantu) */}
            <g transform="translate(32, 22) scale(0.36)" stroke="currentColor" fill="none" strokeWidth="3">
              {/* Bańka żarówki */}
              <path 
                d="M 39 74 C 36 67 29 57 24 47 C 19 36 21 21 35 13 C 44 8 56 8 65 13 C 79 21 81 36 76 47 C 71 57 64 67 61 74 L 61 75 C 61 78 58 80 55 80 L 45 80 C 42 80 39 78 39 75 Z" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
              {/* Wewnętrzny łuk kopuły */}
              <path 
                d="M 37 38 C 39 27 47 21 50 21 C 53 21 61 27 63 38" 
                stroke="#F59E0B"
                strokeWidth="2.8" 
                strokeLinecap="round" 
              />
              {/* Żarnik w centrum (kielich V) */}
              <path 
                d="M 46 76 L 46 64 C 46 61 43 57 40 54 C 36 51 36 45 41 43 C 44 41 48 42 50 48 C 52 42 56 41 59 43 C 64 45 64 51 60 54 C 57 57 54 61 54 64 L 54 76" 
                stroke="#F59E0B" 
                strokeWidth="2.8" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />
              {/* Gwint (3 paski) */}
              <path d="M 40 86 L 60 84.5" strokeLinecap="round" />
              <path d="M 42 93.5 L 58 92" strokeLinecap="round" />
              <path d="M 45 100 C 47 101.5 53 101.5 55 100" strokeLinecap="round" />
            </g>

            {/* MODUŁ B: Autorski monogram "J." w stylu oficjalnego logo (środek dolnego prawego kwadrantu) */}
            <g transform="translate(82, 78)">
              <text
                x="0"
                y="26"
                fontFamily="'Plus Jakarta Sans', system-ui, -apple-system, sans-serif"
                fontSize="25"
                fontWeight="800"
                fill="currentColor"
                opacity="0.75"
                letterSpacing="-0.02em"
              >
                J
              </text>
              {/* Sygnaturowa kropka marki Jasne. */}
              <circle cx="17" cy="24" r="3.2" fill="#F59E0B" opacity="0.95" />
            </g>
          </pattern>
        </defs>

        <rect width="100%" height="100%" fill="url(#jasne-ordered-grid-pattern)" />
      </svg>

      {/* 2. Dyskretne, zrównoważone oświetlenie tła bez kontrastowych plam */}
      <div className="absolute inset-0 bg-radial-[at_10%_10%] from-amber-500/[0.04] via-transparent to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-radial-[at_90%_90%] from-amber-600/[0.03] via-transparent to-transparent pointer-events-none" />
    </div>
  );
}
