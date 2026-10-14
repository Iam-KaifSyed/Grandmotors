import { useEffect, useRef, useState } from 'react';

type RevealOptions = { threshold?: number; rootMargin?: string; once?: boolean };

// Shared IntersectionObserver singleton to prevent creating dozens of observers
let sharedObserver: IntersectionObserver | null = null;
const targetCallbacks = new WeakMap<Element, (isIntersecting: boolean) => void>();

function getSharedObserver(): IntersectionObserver | null {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return null;
  if (!sharedObserver) {
    sharedObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const cb = targetCallbacks.get(entry.target);
          if (cb) {
            cb(entry.isIntersecting);
          }
        }
      },
      {
        threshold: 0.05,
        rootMargin: '0px 0px 50px 0px',
      }
    );
  }
  return sharedObserver;
}

/**
 * Lightweight, high-performance scroll-reveal hook.
 * Uses a single shared IntersectionObserver to avoid creating duplicate observers,
 * removes unneeded timeout loops, and prevents unnecessary layout thrashing.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(
  options?: RevealOptions
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
      el.classList.add('is-visible');
      setRevealed(true);
      return;
    }

    // Check if element is already within viewport on mount
    const rect = el.getBoundingClientRect();
    if (rect.top <= window.innerHeight + 50 && rect.bottom >= 0) {
      el.classList.add('is-visible');
      setRevealed(true);
      if (options?.once !== false) return;
    }

    const observer = getSharedObserver();
    if (!observer) {
      el.classList.add('is-visible');
      setRevealed(true);
      return;
    }

    const onIntersect = (isIntersecting: boolean) => {
      if (isIntersecting) {
        el.classList.add('is-visible');
        setRevealed(true);
        if (options?.once !== false) {
          observer.unobserve(el);
          targetCallbacks.delete(el);
        }
      } else if (options?.once === false) {
        el.classList.remove('is-visible');
        setRevealed(false);
      }
    };

    targetCallbacks.set(el, onIntersect);
    observer.observe(el);

    return () => {
      observer.unobserve(el);
      targetCallbacks.delete(el);
    };
  }, [options?.threshold, options?.rootMargin, options?.once]);

  return { ref, revealed };
}

