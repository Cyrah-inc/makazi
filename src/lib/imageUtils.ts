/**
 * Optimizes Supabase Storage image URLs by appending transform parameters.
 * Only applies to Supabase Storage URLs — external URLs are returned as-is.
 *
 * @param url - Original image URL
 * @param width - Desired width in pixels
 * @param quality - JPEG/WebP quality 1-100 (default 75)
 * @returns Optimized URL with Supabase transform params
 */
export function getOptimizedImageUrl(
  url: string | undefined | null,
  width: number,
  quality: number = 75
): string {
  if (!url) return '/placeholder.svg';

  // Only transform Supabase Storage URLs
  // Pattern: .../storage/v1/object/public/...
  if (!url.includes('/storage/v1/object/public/')) {
    return url;
  }

  // Replace /object/ with /render/image/ for Supabase Image Transforms
  const transformUrl = url.replace(
    '/storage/v1/object/public/',
    '/storage/v1/render/image/public/'
  );

  const separator = transformUrl.includes('?') ? '&' : '?';
  return `${transformUrl}${separator}width=${width}&quality=${quality}`;
}

/** Preset sizes for common use cases */
export const IMAGE_SIZES = {
  /** Property card thumbnails */
  CARD: { width: 400, quality: 75 },
  /** Property detail main image */
  DETAIL: { width: 800, quality: 80 },
  /** Property detail thumbnail strip */
  DETAIL_THUMB: { width: 160, quality: 70 },
  /** Location section cards */
  LOCATION: { width: 300, quality: 75 },
  /** Dashboard list thumbnails */
  DASHBOARD: { width: 100, quality: 70 },
  /** Admin/modal preview images */
  PREVIEW: { width: 600, quality: 75 },
  /** Small inline thumbnails (e.g. inquiry lists) */
  INLINE: { width: 80, quality: 70 },
} as const;
