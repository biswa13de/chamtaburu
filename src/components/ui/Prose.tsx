import type { ReactNode } from 'react';

interface ProseProps {
  children: ReactNode;
  className?: string;
}

// Typography wrapper for long-form text blocks (legal page, story sections).
export function Prose({ children, className = '' }: ProseProps) {
  return (
    <div
      className={`space-y-4 text-sm leading-relaxed text-stone [&_h2]:mb-2 [&_h2]:font-serif [&_h2]:text-2xl [&_h2]:font-medium [&_h2]:text-ink [&_h2]:first:mt-0 [&_h3]:font-serif [&_h3]:text-xl [&_h3]:font-medium [&_h3]:text-ink ${className}`}
    >
      {children}
    </div>
  );
}
