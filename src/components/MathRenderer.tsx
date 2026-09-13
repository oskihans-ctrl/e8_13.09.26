import React from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

interface MathRendererProps {
  content?: string;
  text?: string; // backwards compatibility alias for content
  className?: string;
  displayMode?: boolean;
}

export const MathRenderer: React.FC<MathRendererProps> = ({ 
  content, 
  text, 
  className = '',
  displayMode = false
}) => {
  const rawInput = content ?? text ?? '';
  if (!rawInput) return null;

  // Normalizacja powielonych znaków dolara (np. $$$$ -> $$) bez ucinania spacji na krańcach tekstu
  const rawContent = rawInput.replace(/\${3,}/g, '$$');

  // Jeśli jawnie zażądano displayMode lub cały tekst to blok LaTeX (np. \begin{aligned})
  const trimmedForBlockCheck = rawContent.trim();
  const isPureLatexBlock = 
    displayMode || 
    trimmedForBlockCheck.startsWith('\\begin{') || 
    (trimmedForBlockCheck.startsWith('$$') && trimmedForBlockCheck.endsWith('$$') && !trimmedForBlockCheck.slice(2, -2).includes('$$'));

  if (isPureLatexBlock) {
    // Usunięcie otaczających znaków dolara
    const cleanMath = trimmedForBlockCheck.replace(/^\$+/, '').replace(/\$+$/, '').trim();
    return (
      <div className={`my-2.5 w-full max-w-full flex flex-col items-center justify-center overflow-x-auto overflow-y-hidden py-1.5 px-2 text-center touch-pan-x text-white ${className}`}>
        <div className="mx-auto flex flex-col items-center justify-center text-center max-w-full box-border">
          <BlockMath 
            math={cleanMath} 
            renderError={() => (
              <span className="font-mono text-xs text-white/90 bg-[#0F1622] px-3 py-1.5 rounded-lg border border-white/10 block whitespace-pre-wrap">
                {cleanMath}
              </span>
            )}
          />
        </div>
      </div>
    );
  }

  // Dzieli tekst na bloki $$ (display math), $ (inline math) i zwykły tekst
  const parts = rawContent.split(/(\$\$[\s\S]*?\$\$|\$[^\$]+?\$)/g);

  return (
    <span className={`break-words max-w-full leading-relaxed inline ${className}`}>
      {parts.map((part, index) => {
        if (!part) return null;

        if (part.startsWith('$$') && part.endsWith('$$') && part.length >= 4) {
          const math = part.slice(2, -2).trim();
          return (
            <span 
              key={index} 
              className="block my-2 w-full max-w-full flex flex-col items-center justify-center overflow-x-auto overflow-y-hidden py-1.5 px-2 text-center touch-pan-x"
            >
              <span className="mx-auto flex flex-col items-center justify-center text-center max-w-full box-border">
                <BlockMath 
                  math={math} 
                  renderError={() => (
                    <span className="font-mono text-xs text-white/90 bg-[#0F1622] px-2 py-1 rounded">
                      {math}
                    </span>
                  )}
                />
              </span>
            </span>
          );
        } else if (part.startsWith('$') && part.endsWith('$') && part.length >= 2) {
          const math = part.slice(1, -1).trim();
          return (
            <span key={index} className="inline align-baseline mx-0.5 font-normal">
              <InlineMath 
                math={math} 
                renderError={() => (
                  <span className="font-mono text-xs text-white/90">
                    {math}
                  </span>
                )}
              />
            </span>
          );
        }

        return (
          <span key={index} className="align-baseline whitespace-pre-wrap">
            {part}
          </span>
        );
      })}
    </span>
  );
};

export default MathRenderer;
