import React from 'react';

export type BadgeVariant = 'amber' | 'cyan' | 'emerald' | 'rose' | 'indigo' | 'slate';
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
 * System odznak Jasne. (Standard EdTech: Notion / Linear / Brilliant):
 * - Subtelne pastelowe tło z delikatną ramką 1px
 * - Pełna pastylka (rounded-full)
 * - Mikro-typografia (10-12px, pogrubiona, wielkie litery, brak łamania wierszy)
 * - Zgodność z WCAG AA dla trybu jasnego i ciemnego
 */
export const Badge: React.FC<BadgeProps> = ({
  variant = 'amber',
  size = 'md',
  children,
  icon,
  className = '',
  id
}) => {
  const variantStyles: Record<BadgeVariant, string> = {
    amber: 'bg-amber-500/10 text-amber-800 dark:text-amber-400 border-amber-500/30',
    cyan: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    slate: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    emerald: 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border-emerald-500/30',
    rose: 'bg-rose-500/10 text-rose-800 dark:text-rose-400 border-rose-500/30',
    indigo: 'bg-indigo-500/10 text-indigo-800 dark:text-indigo-400 border-indigo-500/30'
  };

  const sizeStyles: Record<BadgeSize, string> = {
    sm: 'px-2 py-0.5 text-[10px] leading-none',
    md: 'px-2.5 py-1 sm:px-3 sm:py-1 text-[11px] sm:text-[12px] leading-none'
  };

  return (
    <span
      id={id}
      className={`inline-flex items-center justify-center text-center leading-none gap-1.5 rounded-full border font-bold uppercase tracking-wider whitespace-nowrap select-none shadow-2xs ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {icon && <span className="shrink-0 flex items-center justify-center">{icon}</span>}
      <span className="inline-block text-center">{children}</span>
    </span>
  );
};

export default Badge;
