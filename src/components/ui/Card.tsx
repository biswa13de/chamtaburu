import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

// Replaces the `.card` CSS class with a real component.
export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`overflow-hidden rounded-xl bg-white shadow-sm transition-shadow hover:shadow-md ${className}`}>
      {children}
    </div>
  );
}
