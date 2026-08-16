import type { ImgHTMLAttributes } from 'react';

// alt is required (no default, no optional) — Phase 1 checklist item.
// srcSet/sizes are accepted so this is ready to receive Phase 3's
// generated AVIF/WebP responsive sets without a call-site rewrite.
interface ImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'alt' | 'loading'> {
  src: string;
  alt: string;
  width: number;
  height: number;
  srcSet?: string;
  sizes?: string;
  loading?: 'lazy' | 'eager';
}

export function Image({ src, alt, width, height, loading = 'lazy', className = '', ...props }: ImageProps) {
  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading={loading}
      decoding="async"
      className={className}
      {...props}
    />
  );
}
