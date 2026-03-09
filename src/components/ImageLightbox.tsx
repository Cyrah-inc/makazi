import { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ImageLightboxProps {
  images: string[];
  initialIndex: number;
  open: boolean;
  onClose: () => void;
}

const ImageLightbox = ({ images, initialIndex, open, onClose }: ImageLightboxProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    if (open) setCurrentIndex(initialIndex);
  }, [open, initialIndex]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!open) return;
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowRight') setCurrentIndex(prev => (prev + 1) % images.length);
    if (e.key === 'ArrowLeft') setCurrentIndex(prev => (prev - 1 + images.length) % images.length);
  }, [open, images.length, onClose]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center" onClick={onClose}>
      {/* Close button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 z-10 text-white hover:bg-white/10 h-12 w-12"
        onClick={onClose}
      >
        <X className="h-6 w-6" />
      </Button>

      {/* Zoom toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 left-4 z-10 text-white hover:bg-white/10 h-12 w-12"
        onClick={(e) => { e.stopPropagation(); setZoomed(!zoomed); }}
      >
        {zoomed ? <ZoomOut className="h-6 w-6" /> : <ZoomIn className="h-6 w-6" />}
      </Button>

      {/* Counter */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/80 text-sm font-medium">
        {currentIndex + 1} / {images.length}
      </div>

      {/* Navigation */}
      {images.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/10 h-12 w-12"
            onClick={(e) => { e.stopPropagation(); setCurrentIndex((currentIndex - 1 + images.length) % images.length); setZoomed(false); }}
          >
            <ChevronLeft className="h-8 w-8" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/10 h-12 w-12"
            onClick={(e) => { e.stopPropagation(); setCurrentIndex((currentIndex + 1) % images.length); setZoomed(false); }}
          >
            <ChevronRight className="h-8 w-8" />
          </Button>
        </>
      )}

      {/* Image */}
      <div
        className={cn(
          "max-w-[90vw] max-h-[85vh] transition-transform duration-300",
          zoomed && "max-w-none max-h-none cursor-zoom-out"
        )}
        onClick={(e) => { e.stopPropagation(); if (zoomed) setZoomed(false); }}
      >
        <img
          src={images[currentIndex]}
          alt={`Image ${currentIndex + 1}`}
          className={cn(
            "object-contain transition-all duration-300",
            zoomed ? "w-auto h-auto max-w-[200vw] max-h-[200vh] scale-150" : "max-w-[90vw] max-h-[85vh]"
          )}
          draggable={false}
        />
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 max-w-[90vw] overflow-x-auto pb-1" onClick={(e) => e.stopPropagation()}>
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => { setCurrentIndex(idx); setZoomed(false); }}
              className={cn(
                "shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all",
                idx === currentIndex ? "border-white opacity-100" : "border-transparent opacity-50 hover:opacity-80"
              )}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageLightbox;
