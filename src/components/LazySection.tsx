import { useRef, useState, useEffect, ReactNode } from 'react';

interface LazySectionProps {
  children: ReactNode;
  /** Vertical margin around the root for early triggering (default: 200px) */
  rootMargin?: string;
  /** Minimum height placeholder before content loads */
  minHeight?: string;
}

/**
 * Defers rendering of children until the section enters (or is near) the viewport.
 * Reduces initial DOM nodes and delays data fetching for below-fold content.
 */
export function LazySection({ children, rootMargin = '200px', minHeight = '300px' }: LazySectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin]);

  if (visible) return <>{children}</>;

  return <div ref={ref} style={{ minHeight }} />;
}
