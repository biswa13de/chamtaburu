import type { ElementType, ReactNode } from 'react';

interface SectionProps {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  /** Narrower measure for text-heavy content (legal, prose). */
  narrow?: boolean;
}

// Consistent max-width/padding wrapper, replacing the repeated
// `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8` pattern.
export function Section({ children, as: Tag = 'section', className = '', narrow = false }: SectionProps) {
  return (
    <Tag className={`mx-auto px-4 sm:px-6 lg:px-8 ${narrow ? 'max-w-4xl' : 'max-w-7xl'} ${className}`}>
      {children}
    </Tag>
  );
}
