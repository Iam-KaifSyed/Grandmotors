import { useEffect, useRef, useState } from 'react';

/**
 * Lightweight scroll-reveal hook. Adds a `revealed` flag when the element
 * first enters the viewport. Respects prefers-reduced-motion by revealing
 * immediately. Includes a safety timeout fallback so content is never stuck invisible.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(
  options?: { threshold?: number; rootMargin?: string; once?: boolean }
) {
  const ref = useRef<T>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (reduce) {
      setRevealed(true);
      return;
    }

    // Safety fallback: reveal after a short timeout so content is never stuck invisible
    const fallbackTimer = setTimeout(() => {
      setRevealed(true);
    }, 1200);

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setRevealed(true);
            if (options?.once !== false) observer.unobserve(entry.target);
          } else if (options?.once === false) {
            setRevealed(false);
          }
        }
      },
      {
        threshold: options?.threshold ?? 0.02,
        rootMargin: options?.rootMargin ?? '0px 0px 150px 0px',
      }
    );

    observer.observe(el);
    return () => {
      clearTimeout(fallbackTimer);
      observer.disconnect();
    };
  }, [options?.threshold, options?.rootMargin, options?.once]);

  return { ref, revealed };
}
