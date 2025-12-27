import React, { useState, useEffect } from 'react';
import { getImageSources, supportsWebP } from '../utils/imageUtils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number | string;
  height?: number | string;
  loading?: 'lazy' | 'eager';
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * OptimizedImage component that automatically uses WebP format when available
 * Falls back to original format if WebP is not supported or not available
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  width,
  height,
  loading = 'lazy',
  priority = false,
  onLoad,
  onError
}) => {
  const [webpSupported, setWebpSupported] = useState(false);
  const [imageError, setImageError] = useState(false);
  const imageSources = getImageSources(src);

  useEffect(() => {
    setWebpSupported(supportsWebP());
  }, []);

  const handleError = () => {
    setImageError(true);
    onError?.();
  };

  const handleLoad = () => {
    onLoad?.();
  };

  // If WebP is not available or image failed to load, use original
  if (!webpSupported || imageError || !imageSources.webpSrc || imageSources.webpSrc === imageSources.originalSrc) {
    return (
      <img
        src={imageSources.originalSrc}
        alt={alt}
        className={className}
        width={width}
        height={height}
        loading={priority ? 'eager' : loading}
        onLoad={handleLoad}
        onError={handleError}
        decoding="async"
      />
    );
  }

  // Use picture element for WebP with fallback
  return (
    <picture>
      <source srcSet={imageSources.webpSrc} type="image/webp" />
      <img
        src={imageSources.originalSrc}
        alt={alt}
        className={className}
        width={width}
        height={height}
        loading={priority ? 'eager' : loading}
        onLoad={handleLoad}
        onError={handleError}
        decoding="async"
      />
    </picture>
  );
};

export default OptimizedImage;

