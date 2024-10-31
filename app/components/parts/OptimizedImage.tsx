interface OptimizedImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
  loading?: 'lazy' | 'eager';
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  objectPosition?: string;
  webpSrc?: string;
  srcSet?: string;
  sizes?: string;
  onLoad?: () => void;
  onError?: () => void;
  quality?: number;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
}: OptimizedImageProps) {
  const webpSrc = src.replace('.png', '.webp');

  return (
    <picture>
      <source srcSet={webpSrc} type="image/webp" />
      <source srcSet={src} type="image/png" />
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : 'auto'}
      />
    </picture>
  );
}
