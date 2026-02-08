/**
 * Returns an optimized image URL.
 *
 * For Supabase Storage URLs we simply return the original public URL
 * (Image Transforms require a paid Pro plan and would 404 otherwise).
 * For external URLs (e.g. Unsplash) we pass through as-is.
 *
 * @param url - Original image URL
 * @param _width - (reserved for future use)
 * @param _quality - (reserved for future use)
 * @returns Image URL safe to use in <img> tags
 */
export function getOptimizedImageUrl(
  url: string | undefined | null,
  _width?: number,
  _quality?: number
): string {
  if (!url) return '/placeholder.svg';
  return url;
}

/** Preset sizes for common use cases (kept for API compatibility) */
export const IMAGE_SIZES = {
  CARD: { width: 400, quality: 75 },
  DETAIL: { width: 800, quality: 80 },
  DETAIL_THUMB: { width: 160, quality: 70 },
  LOCATION: { width: 300, quality: 75 },
  DASHBOARD: { width: 100, quality: 70 },
  PREVIEW: { width: 600, quality: 75 },
  INLINE: { width: 80, quality: 70 },
} as const;
