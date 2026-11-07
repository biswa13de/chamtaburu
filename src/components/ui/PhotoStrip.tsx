import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Image } from './Image';
import { resolveImage } from '../../content/manifest';
import type { ImageRef } from '../../content/types';

/**
 * A card's photos side by side: swipe on a phone, arrows on a computer.
 * For rooms without a detail page of their own (the Village's first-floor
 * rooms), so every photo is still a tap away.
 */
export function PhotoStrip({
  images,
  className = 'h-64',
}: {
  images: ImageRef[];
  className?: string;
}) {
  const strip = useRef<HTMLDivElement>(null);
  const step = (dir: number) => {
    const el = strip.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth, behavior: 'smooth' });
  };

  return (
    <div className={`group relative ${className}`}>
      <div
        ref={strip}
        className="flex h-full snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {images.map((ref, i) => {
          const image = resolveImage(ref);
          return (
            <Image
              key={ref.base}
              src={image.fallbackSrc}
              avifSrcSet={image.avifSrcSet}
              webpSrcSet={image.webpSrcSet}
              sizes="(min-width: 640px) 50vw, 100vw"
              lqip={image.lqip}
              alt={image.alt}
              width={image.width}
              height={image.height}
              loading={i === 0 ? 'eager' : 'lazy'}
              className="h-full w-full shrink-0 snap-center object-cover"
            />
          );
        })}
      </div>
      {images.length > 1 && (
        <>
          <span className="bg-ink/60 pointer-events-none absolute right-3 bottom-3 rounded-full px-3 py-1 text-[10px] font-semibold tracking-widest text-white uppercase">
            {images.length} photos · swipe
          </span>
          <button
            type="button"
            onClick={() => step(-1)}
            aria-label="Previous photo"
            className="text-ink absolute top-1/2 left-2 hidden -translate-y-1/2 rounded-full bg-white/85 p-1.5 shadow sm:group-hover:block"
          >
            <ChevronLeft size={18} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => step(1)}
            aria-label="Next photo"
            className="text-ink absolute top-1/2 right-2 hidden -translate-y-1/2 rounded-full bg-white/85 p-1.5 shadow sm:group-hover:block"
          >
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        </>
      )}
    </div>
  );
}
