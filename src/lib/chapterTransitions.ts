export interface ChapterAnimationState {
  opacity: number;
  translateX: number;
  isVisible: boolean;
}

/**
 * Computes deterministic transition states for chapter typography groups.
 * 
 * Rules:
 * - EXACTLY ONE chapter's typography may be visible at any given moment.
 * - Old text exits completely (opacity 1 -> 0, transform 0 -> -50px).
 * - A brief clean visual gap occurs where no headline is visible.
 * - New text enters cleanly (opacity 0 -> 1, transform 50px -> 0).
 * - Full hold state in the middle of each chapter.
 */
export function getChapterAnimationState(
  chapterIndex: number,
  currentChapter: number,
  localProgress: number,
  totalChapters = 9
): ChapterAnimationState {
  // If not the active chapter, guaranteed to be 100% invisible
  if (chapterIndex !== currentChapter) {
    return { opacity: 0, translateX: 0, isVisible: false };
  }

  const isFirstChapter = chapterIndex === 0;
  const isLastChapter = chapterIndex === totalChapters - 1;

  let opacity = 0;
  let translateX = 0;

  if (isFirstChapter) {
    // Chapter 0 (Landing Hero): starts fully visible
    if (localProgress < 0.70) {
      // Hold phase
      opacity = 1;
      translateX = 0;
    } else if (localProgress < 0.90) {
      // Exit phase: 0.70 -> 0.90
      const exitT = (localProgress - 0.70) / 0.20;
      const smoothT = exitT * exitT * (3 - 2 * exitT); // smoothstep
      opacity = 1 - smoothT;
      translateX = -50 * smoothT;
    } else {
      // Complete exit / transition gap (0.90 -> 1.00)
      opacity = 0;
      translateX = -50;
    }
  } else if (isLastChapter) {
    // Last chapter: enters and holds
    if (localProgress < 0.08) {
      // Pre-entry gap
      opacity = 0;
      translateX = 50;
    } else if (localProgress < 0.25) {
      // Entry phase: 0.08 -> 0.25
      const enterT = (localProgress - 0.08) / 0.17;
      const smoothT = enterT * enterT * (3 - 2 * enterT);
      opacity = smoothT;
      translateX = 50 * (1 - smoothT);
    } else {
      // Hold through end
      opacity = 1;
      translateX = 0;
    }
  } else {
    // Intermediate chapters (1 through N-2)
    if (localProgress < 0.08) {
      // Pre-entry gap: complete visual cleanliness
      opacity = 0;
      translateX = 50;
    } else if (localProgress < 0.25) {
      // Entry phase: 0.08 -> 0.25
      const enterT = (localProgress - 0.08) / 0.17;
      const smoothT = enterT * enterT * (3 - 2 * enterT);
      opacity = smoothT;
      translateX = 50 * (1 - smoothT);
    } else if (localProgress <= 0.72) {
      // Hold phase
      opacity = 1;
      translateX = 0;
    } else if (localProgress < 0.92) {
      // Exit phase: 0.72 -> 0.92
      const exitT = (localProgress - 0.72) / 0.20;
      const smoothT = exitT * exitT * (3 - 2 * exitT);
      opacity = 1 - smoothT;
      translateX = -50 * smoothT;
    } else {
      // Exit gap: complete visual cleanliness (0.92 -> 1.00)
      opacity = 0;
      translateX = -50;
    }
  }

  const isVisible = opacity > 0.001;
  return {
    opacity: isVisible ? opacity : 0,
    translateX,
    isVisible,
  };
}

export interface ChapterData {
  eyebrowCategory: string;
  eyebrowName: string;
  titleLines: string[];
  description: string;
  chapterNumber: string;
  chapterLabel: string;
}

export const CHAPTER_DATA: readonly ChapterData[] = [
  {
    eyebrowCategory: 'GRAND MOTOR',
    eyebrowName: 'PERFORMANCE SERVICE',
    titleLines: ['PRECISION', 'IN MOTION'],
    description: 'Performance-driven automotive service. Built around precision, diagnostics and care.',
    chapterNumber: '01',
    chapterLabel: 'GARAGE ARRIVAL',
  },
  {
    eyebrowCategory: 'GRAND MOTOR',
    eyebrowName: 'ENGINEERING PHILOSOPHY',
    titleLines: ['ENGINEERED', 'FOR THE ROAD'],
    description: 'Meticulous attention to every tolerance, system and surface.',
    chapterNumber: '02',
    chapterLabel: 'VEHICLE ARRIVAL',
  },
  {
    eyebrowCategory: 'GRAND MOTOR',
    eyebrowName: 'SYSTEMS & DIAGNOSTICS',
    titleLines: ['POWER', 'STARTS WITHIN'],
    description: 'Precision diagnostics uncovering pure Formula 1 hybrid capability.',
    chapterNumber: '03',
    chapterLabel: 'AERO & REVEAL',
  },
  {
    eyebrowCategory: 'GRAND MOTOR',
    eyebrowName: 'POWERTRAIN ARCHITECTURE',
    titleLines: ['HYBRID', 'CORE V6'],
    description: '1.6L turbocharged V6 with quad electric motor assist producing over 1,000 HP.',
    chapterNumber: '04',
    chapterLabel: 'POWERTRAIN',
  },
  {
    eyebrowCategory: 'GRAND MOTOR',
    eyebrowName: 'BRAKING SYSTEMS',
    titleLines: ['CARBON', 'CERAMIC'],
    description: 'High-temperature ceramic composite braking with instant thermal dissipation.',
    chapterNumber: '05',
    chapterLabel: 'DECELERATION',
  },
  {
    eyebrowCategory: 'GRAND MOTOR',
    eyebrowName: 'CHASSIS DYNAMICS',
    titleLines: ['ACTIVE', 'SUSPENSION'],
    description: 'Pushrod architecture with adaptive damping and active aerodynamic lowering.',
    chapterNumber: '06',
    chapterLabel: 'KINEMATICS',
  },
  {
    eyebrowCategory: 'GRAND MOTOR',
    eyebrowName: 'SYSTEM DIAGNOSTICS',
    titleLines: ['DIGITAL', 'TELEMETRY'],
    description: 'Continuous sensor analysis monitoring high-voltage and powertrain vitals.',
    chapterNumber: '07',
    chapterLabel: 'DIAGNOSTICS',
  },
  {
    eyebrowCategory: 'GRAND MOTOR',
    eyebrowName: 'INTEGRATION',
    titleLines: ['TOTAL', 'SYNTHESIS'],
    description: 'Every subsystem calibrated in harmony for track-level reliability.',
    chapterNumber: '08',
    chapterLabel: 'SYNTHESIS',
  },
  {
    eyebrowCategory: 'GRAND MOTOR',
    eyebrowName: 'FINAL CALIBRATION',
    titleLines: ['READY', 'TO IGNITE'],
    description: 'System checks complete. Schedule your performance service today.',
    chapterNumber: '09',
    chapterLabel: 'IGNITION',
  },
] as const;
