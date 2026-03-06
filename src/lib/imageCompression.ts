/**
 * Client-side image compression using canvas.
 * Resizes images to a max dimension and converts to WebP (with JPEG fallback).
 */

const MAX_DIMENSION = 1600;
const QUALITY = 0.82;

export async function compressImage(file: File): Promise<File> {
  // Skip non-image files (videos, etc.)
  if (!file.type.startsWith('image/')) return file;

  // Skip GIFs (animated)
  if (file.type === 'image/gif') return file;

  // Skip small images (< 200KB) — already fine
  if (file.size < 200 * 1024) return file;

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      // Only resize if exceeds max dimension
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file); // fallback to original
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Try WebP first, fallback to JPEG
      const tryFormat = (format: string, quality: number) => {
        canvas.toBlob(
          (blob) => {
            if (blob && blob.size < file.size) {
              const ext = format === 'image/webp' ? 'webp' : 'jpg';
              const newName = file.name.replace(/\.[^.]+$/, `.${ext}`);
              resolve(new File([blob], newName, { type: format }));
            } else if (format === 'image/webp') {
              // WebP not supported or bigger, try JPEG
              tryFormat('image/jpeg', quality);
            } else {
              // Compressed is bigger than original, keep original
              resolve(file);
            }
          },
          format,
          quality
        );
      };

      tryFormat('image/webp', QUALITY);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file); // fallback to original
    };

    img.src = url;
  });
}

/**
 * Compress multiple images in parallel.
 */
export async function compressImages(files: File[]): Promise<File[]> {
  return Promise.all(files.map(compressImage));
}
