import { Camera } from 'lucide-react';

interface ImagePlaceholderProps {
  /** Explicit dimensions, same contract as Image — avoids layout shift. */
  width: number;
  height: number;
  /** e.g. "Resort room interior" — what will eventually go here. */
  label?: string;
  className?: string;
}

/**
 * Branded placeholder for unfilled image slots — docs/04-photography.md §3:
 * "Unfilled slots use a tasteful branded placeholder with a 'photograph
 * coming soon' note rather than stock imagery." No concrete call site yet
 * (Resort accommodation is an empty array until Phase 7 per
 * docs/05-build-phases.md), but built now so Phase 7 can drop it in for
 * Resort room interiors without inventing a component under deadline.
 *
 * Uses the forest/sand palette tokens from src/index.css — never stock
 * photography standing in for a room that hasn't been photographed yet.
 */
export function ImagePlaceholder({ width, height, label = 'Photograph coming soon', className = '' }: ImagePlaceholderProps) {
  return (
    <div
      role="img"
      aria-label={label}
      style={{ aspectRatio: `${width} / ${height}` }}
      className={`flex w-full flex-col items-center justify-center gap-3 border border-dashed border-forest/30 bg-forest/5 text-forest ${className}`}
    >
      <Camera size={32} strokeWidth={1.5} aria-hidden="true" />
      <p className="text-xs font-semibold uppercase tracking-widest">{label}</p>
    </div>
  );
}
