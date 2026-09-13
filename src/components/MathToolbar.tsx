import React from 'react';
import { Calculator } from 'lucide-react';
import { triggerHaptic } from '../utils';

interface MathToolbarProps {
  onInsertSymbol: (symbol: string) => void;
  onInsertTemplate?: (template: string) => void;
}

export function MathToolbar({ onInsertSymbol, onInsertTemplate }: MathToolbarProps) {
  const primarySymbols = [
    { label: '√', value: '√(', title: 'Pierwiastek' },
    { label: 'x²', value: '²', title: 'Do kwadratu' },
    { label: 'xⁿ', value: '^(', title: 'Potęga' },
    { label: 'logₐ', value: 'log₃(', title: 'Logarytm' },
    { label: '½', value: '½', title: 'Ułamek 1/2' },
    { label: '⅓', value: '⅓', title: 'Ułamek 1/3' },
    { label: 'Δ', value: 'Δ', title: 'Delta' },
    { label: '≤', value: ' ≤ ', title: 'Mniejsze lub równe' },
    { label: '≥', value: ' ≥ ', title: 'Większe lub równe' },
    { label: '≠', value: ' ≠ ', title: 'Różne od' },
    { label: '±', value: ' ± ', title: 'Plus-minus' },
    { label: '·', value: ' · ', title: 'Iloczyn' },
    { label: 'π', value: 'π', title: 'Liczba Pi' },
    { label: '∞', value: '∞', title: 'Nieskończoność' },
    { label: '∈', value: ' ∈ ', title: 'Należy do' },
    { label: '∪', value: ' ∪ ', title: 'Suma zbiorów' },
    { label: '|x|', value: '|', title: 'Wartość bezwzględna' },
    { label: '⟨ ⟩', value: '⟨, ⟩', title: 'Nawiasy przedziału' },
  ];

  const quickTemplates = [
    { label: 'Δ = b²-4ac', value: '\nΔ = b² - 4ac = ' },
    { label: 'x₁, x₂', value: '\nx₁ = , x₂ = ' },
    { label: 'x ∈ ⟨ , ⟩', value: '\nx ∈ ⟨, ⟩' },
    { label: 'W = (p, q)', value: '\np = -b/(2a) = \nq = -Δ/(4a) = \nW = (, )' },
    { label: 'Odp:', value: '\nOdpowiedź: ' },
  ];

  const handleSymbolClick = (val: string) => {
    triggerHaptic('light');
    onInsertSymbol(val);
  };

  const handleTemplateClick = (val: string) => {
    triggerHaptic('medium');
    if (onInsertTemplate) {
      onInsertTemplate(val);
    } else {
      onInsertSymbol(val);
    }
  };

  return (
    <div className="flex flex-col gap-2 bg-[#181A24] border border-white/10 rounded-xl p-2.5 my-2 shadow-inner">
      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
          <Calculator size={13} className="text-[#00C2FF]" />
          <span>Klawiatura Matematyczna</span>
        </span>
        <span className="text-[10px] text-[#8B8D98]">Kliknij, aby wstawić symbol</span>
      </div>

      {/* Symbol buttons grid */}
      <div className="flex flex-wrap gap-1.5">
        {primarySymbols.map((item, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSymbolClick(item.value)}
            title={item.title}
            className="px-2.5 py-1.5 bg-[#222533] hover:bg-blue-600/30 hover:border-blue-500/40 border border-white/10 rounded-lg text-xs font-mono text-white font-bold transition-all active:scale-95 shadow-sm min-w-[34px] text-center"
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Quick Templates */}
      <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 scrollbar-none">
        <span className="text-[9px] text-[#8B8D98] uppercase font-bold shrink-0">Szablony:</span>
        {quickTemplates.map((tpl, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleTemplateClick(tpl.value)}
            className="px-2.5 py-1 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-md text-[11px] font-medium text-blue-300 shrink-0 transition-all active:scale-95 whitespace-nowrap"
          >
            + {tpl.label}
          </button>
        ))}
      </div>
    </div>
  );
}
