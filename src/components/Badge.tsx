import React from 'react';

export type BadgeVariant = 'cyan' | 'amber' | 'emerald';
export type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  id?: string;
}

/**
 * Standardowy system odznak Jasne. (Egzamin Ósmoklasisty E8):
 * - Półprzezroczyste ciemne tło
 * - Subtelna ramka 1px
 * - Pełna pastylka (rounded-full)
 * - Mikro-typografia (11-12px, pogrubiona, wielkie litery, brak łamania wierszy)
 * - 3 warianty:
 *    - cyan: Poziom egzaminu (np. EGZAMIN ÓSMOKLASISTY, CKE)
 *    - amber: Waga zadania i seria (np. PEWNIAK E8, SERIA DNI)
 *    - emerald: Statusy zaliczenia (np. ZALICZONE 100%)
 */
export const Badge: React.FC<BadgeProps> = ({
  variant = 'cyan',
  size = 'md',
  children,
  icon,
  className = '',
  id
}) => {
  const variantStyles: Record<BadgeVariant, string> = {
    cyan: 'bg-[#00E5FF]/10 text-[#00E5FF] border-[#00E5FF]/30 shadow-[0_0_12px_rgba(0,229,255,0.12)]',
    amber: 'bg-sky-400/10 text-sky-300 border-sky-400/30 shadow-[0_0_12px_rgba(56,189,248,0.15)]',
    emerald: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/30 shadow-[0_0_12px_rgba(52,211,153,0.12)]'
  };

  const sizeStyles: Record<BadgeSize, string> = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-0.5 sm:px-3 sm:py-1 text-[11px] sm:text-[12px]'
  };

  return (
    <span
      id={id}
      className={`inline-flex items-center gap-1.5 rounded-full border font-bold uppercase tracking-wider whitespace-nowrap select-none backdrop-blur-sm ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {icon && <span className="shrink-0 flex items-center">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};

export default Badge;
