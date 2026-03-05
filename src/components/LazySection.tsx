import { useRef, useState, useEffect, ReactNode } from 'react';

interface LazySectionProps {
  children: ReactNode;
  rootMargin?: string;
  minHeight?: string;
  onVisible?: () => void;
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
