import type Lenis from 'lenis';

/**
 * Shared handle to the hero's Lenis instance so UI outside ExperienceRoot
 * (e.g. the HUD "Scroll to Explore" cue) can trigger a smooth, animated
 * scroll down to the website content. This only drives the existing scroll
 * position — identical to a user scrolling — so the 3D car animation, camera
 * sequence and timeline are never touched.
 */
let lenis: Lenis | null = null;

export function registerLenis(instance: Lenis | null) {
  lenis = instance;
}

/**
 * Smoothly scroll from the hero down to the start of the website content.
 * Falls back to native smooth scrolling if Lenis is unavailable.
 */
export function scrollToSite(targetId?: string | unknown) {
  if (typeof document === 'undefined') return;
  const id = typeof targetId === 'string' && targetId ? targetId : 'site-content';
  const cleanId = id.startsWith('#') ? id.slice(1) : id;
  const target = document.getElementById(cleanId);
  if (!target) return;

  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  if (lenis) {
    lenis.start();
    lenis.scrollTo(target, {
      duration: reduce ? 0 : 1.6,
      easing: (t: number) => 1 - Math.pow(1 - t, 3), // easeOutCubic
      force: true,
    });
    return;
  }

  const top = target.getBoundingClientRect().top + window.scrollY;
  window.scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
}
