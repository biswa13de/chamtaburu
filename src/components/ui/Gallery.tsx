import { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { Image } from './Image';
import { Lightbox } from './Lightbox';

export interface GalleryImage {
  src: string;
  alt: string;
  width: number;
  height: number;
}

interface GalleryProps {
  images: GalleryImage[];
  className?: string;
}

// Simple responsive image grid with click-to-enlarge via Lightbox.
export function Gallery({ images, className = '' }: GalleryProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <>
      <div className={`grid grid-cols-2 gap-4 sm:grid-cols-3 ${className}`}>
        {images.map((img, i) => (
          <button
            key={img.src}
            onClick={() => setOpenIndex(i)}
            className="group aspect-square overflow-hidden rounded-lg"
            aria-label={`Open image: ${img.alt}`}
          >
            <Image
              src={img.src}
              alt={img.alt}
              width={img.width}
              height={img.height}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </button>
        ))}
      </div>
      <AnimatePresence>
        {openIndex !== null && (
          <Lightbox
            key="lightbox"
            images={images}
            index={openIndex}
            onClose={() => setOpenIndex(null)}
            onIndexChange={setOpenIndex}
          />
        )}
      </AnimatePresence>
    </>
  );
}
