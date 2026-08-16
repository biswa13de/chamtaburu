import { useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Image } from './Image';
import type { GalleryImage } from './Gallery';

interface LightboxProps {
  images: GalleryImage[];
  index: number;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

// Click-to-enlarge modal. Escape closes, focus is trapped inside while open,
// and the initial trigger regains focus on close. Respects prefers-reduced-motion.
export function Lightbox({ images, index, onClose, onIndexChange }: LightboxProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<Element | null>(null);
  const reduceMotion = useReducedMotion();
  const image = images[index]!;

  useEffect(() => {
    triggerRef.current = document.activeElement;
    dialogRef.current?.focus();
    return () => {
      if (triggerRef.current instanceof HTMLElement) triggerRef.current.focus();
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'ArrowLeft') {
        onIndexChange((index - 1 + images.length) % images.length);
        return;
      }
      if (e.key === 'ArrowRight') {
        onIndexChange((index + 1) % images.length);
        return;
      }
      if (e.key === 'Tab') {
        const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
        if (!focusable || focusable.length === 0) return;
        const first = focusable[0]!;
        const last = focusable[focusable.length - 1]!;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [index, images.length, onClose, onIndexChange]);

  const transition = reduceMotion ? { duration: 0 } : undefined;

  return (
      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={image.alt}
        tabIndex={-1}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={transition}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
        onClick={onClose}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-6 top-6 text-white/80 hover:text-white"
        >
          <X size={28} />
        </button>

        {images.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onIndexChange((index - 1 + images.length) % images.length);
              }}
              aria-label="Previous image"
              className="absolute left-4 text-white/80 hover:text-white"
            >
              <ChevronLeft size={32} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onIndexChange((index + 1) % images.length);
              }}
              aria-label="Next image"
              className="absolute right-4 text-white/80 hover:text-white"
            >
              <ChevronRight size={32} />
            </button>
          </>
        )}

        <div className="max-h-[85vh] max-w-4xl" onClick={(e) => e.stopPropagation()}>
          <Image
            src={image.src}
            alt={image.alt}
            width={image.width}
            height={image.height}
            loading="eager"
            className="max-h-[85vh] w-auto rounded-lg object-contain"
          />
        </div>
      </motion.div>
  );
}
