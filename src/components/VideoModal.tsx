import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Play, X } from 'lucide-react';

function toEmbedUrl(url: string): string | null {
  const youtube = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  if (youtube) return `https://www.youtube.com/embed/${youtube[1]}?autoplay=1`;

  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}?autoplay=1`;

  return null;
}

function VideoLightbox({ embedUrl, onClose }: { embedUrl: string; onClose: () => void }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <button
          onClick={onClose}
          aria-label="Close video"
          className="absolute top-6 right-6 text-white/80 hover:text-white"
        >
          <X size={28} />
        </button>
        <div className="w-full max-w-4xl aspect-video" onClick={(e) => e.stopPropagation()}>
          <iframe
            src={embedUrl}
            title="Video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full rounded-lg"
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// Shared open/close state + lightbox for a given video URL. Renders nothing
// (and openVideo becomes a no-op) if the URL isn't a recognized YouTube/Vimeo link.
export function useVideoModal(videoUrl?: string) {
  const [isOpen, setIsOpen] = useState(false);
  const embedUrl = videoUrl ? toEmbedUrl(videoUrl) : null;

  return {
    openVideo: () => embedUrl && setIsOpen(true),
    videoModal: isOpen && embedUrl ? <VideoLightbox embedUrl={embedUrl} onClose={() => setIsOpen(false)} /> : null,
  };
}

// Overlays a play button on its children (typically a thumbnail image);
// clicking it opens the YouTube/Vimeo video in a lightbox.
export function VideoTrigger({ videoUrl, children }: { videoUrl: string; children: React.ReactNode }) {
  const { openVideo, videoModal } = useVideoModal(videoUrl);

  return (
    <>
      <div className="relative">
        {children}
        <button
          onClick={openVideo}
          aria-label="Watch video"
          className="absolute inset-0 flex items-center justify-center group/play"
        >
          <span className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover/play:scale-110 transition-transform">
            <Play className="w-6 h-6 text-ink ml-1" fill="currentColor" />
          </span>
        </button>
      </div>
      {videoModal}
    </>
  );
}

// A standalone "Watch Video" pill button, for placing over a hero/banner
// rather than directly on a small thumbnail.
export function VideoButton({ videoUrl, className = '' }: { videoUrl: string; className?: string }) {
  const { openVideo, videoModal } = useVideoModal(videoUrl);

  return (
    <>
      <button
        onClick={openVideo}
        className={`flex items-center gap-2 bg-white/90 text-ink px-5 py-3 rounded-full text-xs font-bold tracking-widest uppercase hover:bg-white transition-colors ${className}`}
      >
        <Play size={14} fill="currentColor" /> Watch Video
      </button>
      {videoModal}
    </>
  );
}
