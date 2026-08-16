import type { ReactNode } from 'react';
import { Image } from './Image';

interface HeroProps {
  image: { src: string; alt: string; width: number; height: number };
  heading: string;
  subheading?: string;
  /** Button(s), typically a <Button to="..."> or WhatsApp link. */
  cta?: ReactNode;
  /** Shorter viewport height for interior pages vs. the home hero. */
  size?: 'full' | 'compact';
}

// Full-bleed image hero with heading/subheading/CTA slot, replacing the
// repeated hero-section markup previously duplicated across pages.
export function Hero({ image, heading, subheading, cta, size = 'full' }: HeroProps) {
  return (
    <section
      className={`relative flex items-center justify-center overflow-hidden ${
        size === 'full' ? 'h-[80vh]' : 'h-[40vh]'
      }`}
    >
      <Image
        src={image.src}
        alt={image.alt}
        width={image.width}
        height={image.height}
        loading="eager"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative z-10 max-w-4xl px-4 text-center text-white">
        <h1 className="mb-4 font-serif text-4xl font-medium leading-tight md:text-6xl">{heading}</h1>
        {subheading && (
          <p className="mb-8 text-sm font-light uppercase tracking-widest opacity-90 md:text-lg">{subheading}</p>
        )}
        {cta && <div className="flex flex-wrap justify-center gap-4">{cta}</div>}
      </div>
    </section>
  );
}
