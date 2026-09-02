import { useState, type CSSProperties, type ImgHTMLAttributes } from 'react';

// alt is required (no default, no optional) — Phase 1 checklist item, kept
// intact through the Phase 3 rewrite below.
interface ImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'alt' | 'loading' | 'src' | 'srcSet'> {
  alt: string;
  width: number;
  height: number;
  loading?: 'lazy' | 'eager';
  /**
   * Fallback <img> src/srcSet — used directly when no avifSrcSet/webpSrcSet
   * is given (a plain <img>, for one-off images outside the manifest), and
   * as the final <picture> fallback (JPEG, "very old browsers") otherwise.
   */
  src: string;
  srcSet?: string;
  /** AVIF responsive source set, e.g. "/img/village/x-480.avif 480w, ...". */
  avifSrcSet?: string;
  /** WebP responsive source set, e.g. "/img/village/x-480.webp 480w, ...". */
  webpSrcSet?: string;
  /** `sizes` attribute shared by every <source> and the fallback <img>. */
  sizes?: string;
  /** Base64 LQIP data URI shown as a blurred placeholder until the real image loads. */
  lqip?: string;
}

// Real <picture> element: AVIF primary, WebP fallback, <img> (JPEG or
// whatever `src` is) as the final fallback for very old browsers — see
// docs/04-photography.md §4. When `lqip` is provided, it's painted as a
// CSS background (via a wrapper element — <picture> itself may only
// contain <source>/<img>) and the real <img> fades in over it once loaded,
// avoiding a blank flash and reducing perceived layout shift.
export function Image({
  src,
  srcSet,
  avifSrcSet,
  webpSrcSet,
  sizes,
  lqip,
  alt,
  width,
  height,
  loading = 'lazy',
  className = '',
  style,
  ...props
}: ImageProps) {
  const [loaded, setLoaded] = useState(false);

  const imgStyle: CSSProperties = {
    ...style,
    ...(lqip && { transition: 'opacity 300ms ease', opacity: loaded ? 1 : 0 }),
  };

  const picture = (
    <picture>
      {avifSrcSet && <source type="image/avif" srcSet={avifSrcSet} sizes={sizes} />}
      {webpSrcSet && <source type="image/webp" srcSet={webpSrcSet} sizes={sizes} />}
      <img
        src={src}
        srcSet={srcSet}
        sizes={sizes}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={className}
        style={imgStyle}
        {...props}
      />
    </picture>
  );

  if (!lqip) {
    return picture;
  }

  // Wrapper carries the blurred placeholder as a background so it's visible
  // through the real <img> until `loaded` flips it to opacity: 1.
  return (
    <div
      style={{
        backgroundImage: `url(${lqip})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
      className={className}
    >
      {picture}
    </div>
  );
}
