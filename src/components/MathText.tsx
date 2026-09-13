import React from 'react';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

/**
 * Normalizes LaTeX math strings safely:
 * - Strips outer delimiter dollars ($$ or $)
 * - Cleans leading/trailing backslash spaces
 * - Formats Polish decimal comma (e.g., 0,3 -> 0{,}3) using FUNCTION replacers (never $1 string substitution)
 * - Converts * to \cdot, <= to \le, >= to \ge, != to \neq, => to \implies, <=> to \iff
 * - Ensures \begin{cases} environments have proper double backslashes for rows
 */
export function cleanLatex(mathStr: string): string {
  if (!mathStr) return '';
  let s = mathStr.trim();

  // Strip outer delimiters
  if (s.startsWith('$$') && s.endsWith('$$') && s.length >= 4) {
    s = s.slice(2, -2).trim();
  } else if (s.startsWith('$') && s.endsWith('$') && s.length >= 2) {
    s = s.slice(1, -1).trim();
  } else if (s.startsWith('\\[') && s.endsWith('\\]') && s.length >= 4) {
    s = s.slice(2, -2).trim();
  } else if (s.startsWith('\\(') && s.endsWith('\\)') && s.length >= 4) {
    s = s.slice(2, -2).trim();
  }

  // Remove leading and trailing backslash spaces (e.g., "\ a^x \")
  s = s.replace(/^\\\s*/, '').replace(/\\\s*$/, '').trim();

  // Polish decimal comma in math mode (0,3 -> 0{,}3)
  // CRITICAL: use a function replacer so JS never treats $ as an escape variable!
  s = s.replace(/(\d+),(\d+)/g, (_match, d1, d2) => `${d1}{,}${d2}`);

  // Replace standalone * with \cdot
  s = s.replace(/(?<!\\)\*/g, '\\cdot ');

  // Standard math operators
  s = s.replace(/<=/g, '\\le ');
  s = s.replace(/>=/g, '\\ge ');
  s = s.replace(/=\/=/g, '\\neq ');
  s = s.replace(/!=/g, '\\neq ');
  s = s.replace(/<=>/g, '\\iff ');
  s = s.replace(/=>/g, '\\implies ');
  s = s.replace(/\+-/g, '\\pm ');

  // Clean empty or redundant double-spaces
  s = s.replace(/\s+/g, ' ').trim();

  return s;
}

/**
 * Checks if a string is a standalone pure LaTeX formula without markdown text
 */
function isPureLatex(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;

  // Explicit delimiters
  if (
    (trimmed.startsWith('$$') && trimmed.endsWith('$$')) ||
    (trimmed.startsWith('$') && trimmed.endsWith('$') && !trimmed.slice(1, -1).includes('$')) ||
    (trimmed.startsWith('\\[') && trimmed.endsWith('\\]')) ||
    (trimmed.startsWith('\\(') && trimmed.endsWith('\\)'))
  ) {
    return true;
  }

  // Environment blocks
  if (trimmed.startsWith('\\begin{') && trimmed.endsWith('}')) {
    return true;
  }

  // Common pure formula patterns (e.g., "\frac{a^x}{a^y} = a^{x-y}")
  if (
    /^\\[a-zA-Z]+/.test(trimmed) &&
    !/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/.test(trimmed) &&
    !/\b(dla|oraz|lub|jest|gdy|wtedy|rozwiąż|oblicz)\b/i.test(trimmed)
  ) {
    return true;
  }

  return false;
}

interface MathToken {
  type: 'block' | 'inline' | 'text';
  content: string;
}

/**
 * Tokenizes text into blocks, inlines, and text segments without regex dollar substitutions
 */
function tokenizeMathContent(text: string): MathToken[] {
  if (!text) return [];

  // Match:
  // 1. Display math: $$...$$ or \[...\]
  // 2. Cases environment: \begin{cases}...\end{cases}
  // 3. Inline math: $...$ or \(...\)
  const mathRegex = /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\\begin\{cases\}[\s\S]*?\\end\{cases\}|\$[^\$\n]+?\$|\\\([^\n]*?\\\))/g;

  const parts = text.split(mathRegex);
  const tokens: MathToken[] = [];

  for (const part of parts) {
    if (!part) continue;

    const trimmed = part.trim();
    if (
      (trimmed.startsWith('$$') && trimmed.endsWith('$$')) ||
      (trimmed.startsWith('\\[') && trimmed.endsWith('\\]')) ||
      (trimmed.startsWith('\\begin{cases}') && trimmed.endsWith('\\end{cases}'))
    ) {
      tokens.push({ type: 'block', content: cleanLatex(trimmed) });
    } else if (
      (trimmed.startsWith('$') && trimmed.endsWith('$')) ||
      (trimmed.startsWith('\\(') && trimmed.endsWith('\\)'))
    ) {
      tokens.push({ type: 'inline', content: cleanLatex(trimmed) });
    } else {
      tokens.push({ type: 'text', content: part });
    }
  }

  return tokens;
}

/**
 * Renders a plain text chunk with basic bold and line-break formatting
 */
function renderTextChunk(chunk: string, keyPrefix: string): React.ReactNode {
  // Split on newlines to render clean breaks
  const lines = chunk.split('\n');

  return (
    <React.Fragment key={keyPrefix}>
      {lines.map((line, lineIdx) => {
        // Parse bold **text** inside the line
        const parts = line.split(/(\*\*[^*]+\*\*)/g);

        return (
          <React.Fragment key={`${keyPrefix}-l-${lineIdx}`}>
            {lineIdx > 0 && <br />}
            {parts.map((p, pIdx) => {
              if (p.startsWith('**') && p.endsWith('**')) {
                return (
                  <strong key={`${keyPrefix}-b-${pIdx}`} className="font-bold text-white">
                    {p.slice(2, -2)}
                  </strong>
                );
              }
              return <span key={`${keyPrefix}-t-${pIdx}`}>{p}</span>;
            })}
          </React.Fragment>
        );
      })}
    </React.Fragment>
  );
}

export interface MathTextProps {
  text: string;
  className?: string;
  as?: any;
}

export function MathText({ text, className = '', as: Component = 'span' }: MathTextProps) {
  if (!text) return null;

  // 1. Direct check: Is this whole string a pure LaTeX formula?
  if (isPureLatex(text)) {
    const isBlockDisplay =
      text.includes('$$') ||
      text.includes('\\[') ||
      text.includes('\\begin{cases}') ||
      text.length > 50;

    const cleaned = cleanLatex(text);

    if (isBlockDisplay) {
      return (
        <Component className={`math-text-wrapper block w-full ${className}`}>
          <div className="my-2.5 py-3 px-4 bg-[#0B101B] border border-[#00C2FF]/20 rounded-xl flex items-center justify-center overflow-visible no-scrollbar shadow-inner text-white text-center">
            <BlockMath
              math={cleaned}
              renderError={() => (
                <span className="font-mono text-sm text-white/90">{cleaned}</span>
              )}
            />
          </div>
        </Component>
      );
    }

    return (
      <Component className={`math-text-wrapper inline ${className}`}>
        <InlineMath
          math={cleaned}
          renderError={() => (
            <span className="font-mono text-xs text-white/90">{cleaned}</span>
          )}
        />
      </Component>
    );
  }

  // 2. Mixed content: Tokenize into text, inline math, and centered block math
  const tokens = tokenizeMathContent(text);

  return (
    <Component className={`math-text-wrapper ${className}`}>
      {tokens.map((token, index) => {
        if (token.type === 'block') {
          return (
            <div
              key={`block-${index}`}
              className="my-2.5 py-3 px-4 bg-[#0B101B] border border-[#00C2FF]/20 rounded-xl flex items-center justify-center overflow-visible no-scrollbar shadow-inner text-white text-center"
            >
              <BlockMath
                math={token.content}
                renderError={() => (
                  <span className="font-mono text-sm text-white/90">{token.content}</span>
                )}
              />
            </div>
          );
        }

        if (token.type === 'inline') {
          return (
            <span key={`inline-${index}`} className="inline align-baseline mx-0.5">
              <InlineMath
                math={token.content}
                renderError={() => (
                  <span className="font-mono text-xs text-white/90">{token.content}</span>
                )}
              />
            </span>
          );
        }

        return renderTextChunk(token.content, `chunk-${index}`);
      })}
    </Component>
  );
}
