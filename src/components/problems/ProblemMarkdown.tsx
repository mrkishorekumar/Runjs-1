import React, { memo, useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { parseInlineFormatting } from './parseInlineMarkdown';

interface ProblemMarkdownProps {
  content: string;
  className?: string;
}

function CodeBlockItem({ code, lang }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="my-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] overflow-hidden shadow-2xs">
      <div className="flex items-center justify-between px-3 py-1.5 bg-[var(--bg-app)]/70 border-b border-[var(--border-subtle)] text-[10px] text-[var(--text-muted)] font-mono">
        <span className="uppercase font-semibold tracking-wider">
          {lang || 'Code'}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-500" />
              <span className="text-emerald-500">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3 font-mono text-xs text-[var(--text-primary)] overflow-x-auto leading-relaxed select-text whitespace-pre">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function ProblemMarkdown({ content, className = '' }: ProblemMarkdownProps) {
  if (!content) return null;

  // Split into sections by code fence: ```...```
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div
      className={`space-y-2 text-xs sm:text-sm text-[var(--text-secondary)] ${className}`}
    >
      {parts.map((part, partIndex) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          // It's a fenced code block
          const lines = part
            .slice(3, -3)
            .replace(/^\r?\n/, '')
            .replace(/\r?\n$/, '')
            .split('\n');
          let lang = '';
          let codeLines = lines;
          if (
            lines.length > 0 &&
            lines[0].trim() &&
            !lines[0].includes(' ') &&
            !lines[0].includes('=') &&
            !lines[0].includes(':') &&
            !lines[0].includes('≡')
          ) {
            lang = lines[0].trim();
            codeLines = lines.slice(1);
          }
          const code = codeLines.join('\n');
          return <CodeBlockItem key={partIndex} code={code} lang={lang} />;
        }

        // Regular markdown text: parse lines
        const lines = part.split(/\r?\n/);
        const elements: React.ReactNode[] = [];
        let currentList: { type: 'ul' | 'ol'; items: string[] } | null = null;

        function flushList(keyPrefix: string) {
          if (!currentList) return;
          const { type, items } = currentList;
          currentList = null;
          if (type === 'ul') {
            elements.push(
              <ul
                key={`${keyPrefix}-ul`}
                className="my-2 space-y-1.5 pl-5 list-disc text-xs sm:text-sm text-[var(--text-secondary)]"
              >
                {items.map((item, i) => (
                  <li key={i} className="leading-relaxed">
                    {parseInlineFormatting(item)}
                  </li>
                ))}
              </ul>
            );
          } else {
            elements.push(
              <ol
                key={`${keyPrefix}-ol`}
                className="my-2 space-y-1.5 pl-5 list-decimal text-xs sm:text-sm text-[var(--text-secondary)]"
              >
                {items.map((item, i) => (
                  <li key={i} className="leading-relaxed">
                    {parseInlineFormatting(item)}
                  </li>
                ))}
              </ol>
            );
          }
        }

        lines.forEach((rawLine, lineIdx) => {
          const line = rawLine.trim();

          if (!line) {
            flushList(`line-${partIndex}-${lineIdx}`);
            return;
          }

          // Unordered list item: * item or - item
          if (/^[-*]\s+/.test(line)) {
            const itemText = line.replace(/^[-*]\s+/, '');
            if (!currentList || currentList.type !== 'ul') {
              flushList(`line-${partIndex}-${lineIdx}`);
              currentList = { type: 'ul', items: [itemText] };
            } else {
              currentList.items.push(itemText);
            }
            return;
          }

          // Ordered list item: 1. item
          if (/^\d+\.\s+/.test(line)) {
            const itemText = line.replace(/^\d+\.\s+/, '');
            if (!currentList || currentList.type !== 'ol') {
              flushList(`line-${partIndex}-${lineIdx}`);
              currentList = { type: 'ol', items: [itemText] };
            } else {
              currentList.items.push(itemText);
            }
            return;
          }

          // Not a list item: flush any pending list
          flushList(`line-${partIndex}-${lineIdx}`);

          // Check if line is a heading: # to ######
          const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
          if (headingMatch) {
            const level = headingMatch[1].length;
            const headingText = headingMatch[2].trim();

            // Filter out dangling "Code" or "Solution Code" header if it is at the very end of content
            const isDanglingCodeHeader =
              /^(solution\s+)?code$/i.test(
                headingText.replace(/[*_#:`]/g, '').trim()
              ) &&
              lines
                .slice(lineIdx + 1)
                .every(
                  (remaining) =>
                    !remaining.trim() ||
                    /^(#{1,6})\s+code$/i.test(remaining.trim())
                );

            if (isDanglingCodeHeader) {
              return;
            }

            if (level === 1) {
              elements.push(
                <h2
                  key={lineIdx}
                  className="text-base sm:text-lg font-bold text-[var(--text-primary)] mt-5 mb-2"
                >
                  {parseInlineFormatting(headingText)}
                </h2>
              );
            } else if (level === 2) {
              elements.push(
                <h3
                  key={lineIdx}
                  className="text-sm sm:text-base font-bold text-[var(--text-primary)] mt-5 mb-2 pb-1 border-b border-[var(--border-subtle)]"
                >
                  {parseInlineFormatting(headingText)}
                </h3>
              );
            } else if (level === 3) {
              elements.push(
                <h4
                  key={lineIdx}
                  className="text-xs sm:text-sm font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mt-4 mb-1.5"
                >
                  {parseInlineFormatting(headingText)}
                </h4>
              );
            } else if (level === 4) {
              elements.push(
                <h5
                  key={lineIdx}
                  className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider mt-3 mb-1"
                >
                  {parseInlineFormatting(headingText)}
                </h5>
              );
            } else if (level === 5) {
              elements.push(
                <h6
                  key={lineIdx}
                  className="text-xs font-bold text-amber-600 dark:text-amber-400 mt-2.5 mb-1"
                >
                  {parseInlineFormatting(headingText)}
                </h6>
              );
            } else {
              elements.push(
                <div
                  key={lineIdx}
                  className="text-xs font-semibold text-[var(--text-secondary)] mt-2 mb-1 italic"
                >
                  {parseInlineFormatting(headingText)}
                </div>
              );
            }
            return;
          }

          // Regular paragraph
          elements.push(
            <p key={lineIdx} className="my-1.5 leading-relaxed">
              {parseInlineFormatting(line)}
            </p>
          );
        });

        flushList(`part-${partIndex}-end`);

        return <React.Fragment key={partIndex}>{elements}</React.Fragment>;
      })}
    </div>
  );
}

export default memo(ProblemMarkdown);
