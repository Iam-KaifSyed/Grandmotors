export interface ChapterAnimationState {
  opacity: number;
  transform: string;
  isVisible: boolean;
}

export type Direction = 'left' | 'right' | 'up' | 'down';

export function getChapterAnimationState(
  chapterIndex: number,
  currentChapter: number,
  localProgress: number,
  direction: Direction = 'right',
  totalChapters = 9
): ChapterAnimationState {
  if (chapterIndex !== currentChapter) {
    return { opacity: 0, transform: 'translate(0px, 0px)', isVisible: false };
  }

  const isFirstChapter = chapterIndex === 0;
  const isLastChapter = chapterIndex === totalChapters - 1;

  let opacity = 0;
  let tx = 0;
  let ty = 0;

  const dx = direction === 'left' ? -50 : direction === 'right' ? 50 : 0;
  const dy = direction === 'up' ? 50 : direction === 'down' ? -50 : 0;

  if (isFirstChapter) {
    if (localProgress < 0.70) {
      opacity = 1;
      tx = 0; ty = 0;
    } else if (localProgress < 0.90) {
      const exitT = (localProgress - 0.70) / 0.20;
      const smoothT = exitT * exitT * (3 - 2 * exitT);
      opacity = 1 - smoothT;
      tx = -dx * smoothT;
      ty = -dy * smoothT;
    } else {
      opacity = 0;
      tx = -dx; ty = -dy;
    }
  } else if (isLastChapter) {
    if (localProgress < 0.08) {
      opacity = 0;
      tx = dx; ty = dy;
    } else if (localProgress < 0.25) {
      const enterT = (localProgress - 0.08) / 0.17;
      const smoothT = enterT * enterT * (3 - 2 * enterT);
      opacity = smoothT;
      tx = dx * (1 - smoothT);
      ty = dy * (1 - smoothT);
    } else {
      opacity = 1;
      tx = 0; ty = 0;
    }
  } else {
    if (localProgress < 0.08) {
      opacity = 0;
      tx = dx; ty = dy;
    } else if (localProgress < 0.25) {
      const enterT = (localProgress - 0.08) / 0.17;
      const smoothT = enterT * enterT * (3 - 2 * enterT);
      opacity = smoothT;
      tx = dx * (1 - smoothT);
      ty = dy * (1 - smoothT);
    } else if (localProgress <= 0.72) {
      opacity = 1;
      tx = 0; ty = 0;
    } else if (localProgress < 0.92) {
      const exitT = (localProgress - 0.72) / 0.20;
      const smoothT = exitT * exitT * (3 - 2 * exitT);
      opacity = 1 - smoothT;
      tx = -dx * smoothT;
      ty = -dy * smoothT;
    } else {
      opacity = 0;
      tx = -dx; ty = -dy;
    }
  }

  const isVisible = opacity > 0.001;
  return {
    opacity: isVisible ? opacity : 0,
    transform: `translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px)`,
    isVisible,
  };
}

export interface ChapterData {
  eyebrowCategory: string;
  eyebrowName: string;
  titleLines: string[];
  description: string;
  services?: string[];
  chapterNumber: string;
  chapterLabel: string;
  direction: Direction;
}

export const CHAPTER_DATA: readonly ChapterData[] = [
  {
    eyebrowCategory: 'GRAND MOTORS',
    eyebrowName: 'FINAL CALIBRATION',
    titleLines: ['READY', 'TO IGNITE'],
    description: 'System checks complete. Schedule your performance service today.',
    services: [],
    chapterNumber: '01',
    chapterLabel: 'IGNITION',
    direction: 'left',
  },
  {
    eyebrowCategory: 'GRAND MOTORS',
    eyebrowName: 'ENGINE & DIAGNOSTICS',
    titleLines: ['HEART', 'OF THE MACHINE'],
    description: 'Specialised engine services ensuring peak powertrain performance.',
    services: [
      'Engine repair',
      'Engine tuning',
      'Vehicle engine diagnostics',
      'Tune-up & inspection',
      'Emissions testing'
    ],
    chapterNumber: '02',
    chapterLabel: 'ENGINE & DIAGNOSTICS',
    direction: 'right',
  },
  {
    eyebrowCategory: 'GRAND MOTORS',
    eyebrowName: 'BRAKES',
    titleLines: ['DECELERATION', 'CONTROL'],
    description: 'High-performance braking maintenance and safety inspections.',
    services: [
      'Brake repair',
      'Brake replacement',
      'Safety inspection'
    ],
    chapterNumber: '03',
    chapterLabel: 'BRAKES',
    direction: 'up',
  },
  {
    eyebrowCategory: 'GRAND MOTORS',
    eyebrowName: 'TYRES & WHEELS',
    titleLines: ['ROAD', 'CONNECTION'],
    description: 'Comprehensive wheel services from alignment to pressure monitoring.',
    services: [
      'Tyres & replacement',
      'Tyre rotation',
      'Pressure testing',
      'Wheel alignment',
      'Tyre air pump'
    ],
    chapterNumber: '04',
    chapterLabel: 'TYRES & WHEELS',
    direction: 'down',
  },
  {
    eyebrowCategory: 'GRAND MOTORS',
    eyebrowName: 'STEERING & SUSPENSION',
    titleLines: ['PRECISION', 'KINEMATICS'],
    description: 'Adaptive damping and steering geometry calibration.',
    services: [
      'Steering/suspension repair',
      'Steering/suspension replacement',
      'Steering wheel repair'
    ],
    chapterNumber: '05',
    chapterLabel: 'STEERING & SUSPENSION',
    direction: 'left',
  },
  {
    eyebrowCategory: 'GRAND MOTORS',
    eyebrowName: 'ELECTRICAL & BATTERY',
    titleLines: ['ENERGY', 'SYSTEMS'],
    description: 'High-voltage analysis and complete electrical system repairs.',
    services: [
      'Electrical repair',
      'Battery maintenance/replacement',
      'Lighting repair',
      'Power window repair'
    ],
    chapterNumber: '06',
    chapterLabel: 'ELECTRICAL & BATTERY',
    direction: 'right',
  },
  {
    eyebrowCategory: 'GRAND MOTORS',
    eyebrowName: 'A/C & CLIMATE',
    titleLines: ['THERMAL', 'COMFORT'],
    description: 'Climate control installation, diagnostics, and continuous maintenance.',
    services: [
      'A/C installation/repair',
      'A/C services',
      'Re-gas/recharge',
      'A/C filter replacement',
      'Vehicle A/C recharge'
    ],
    chapterNumber: '07',
    chapterLabel: 'A/C & CLIMATE',
    direction: 'up',
  },
  {
    eyebrowCategory: 'GRAND MOTORS',
    eyebrowName: 'BODY, GLASS & INTERIOR',
    titleLines: ['STRUCTURAL', 'INTEGRITY'],
    description: 'Restoration of aerodynamics, chassis strength, and interior refinement.',
    services: [
      'Body/trim/chassis repair',
      'Body painting',
      'Glass/windshield handling',
      'Windows',
      'Upholstery/interior restoration'
    ],
    chapterNumber: '08',
    chapterLabel: 'BODY, GLASS & INTERIOR',
    direction: 'down',
  },
  {
    eyebrowCategory: 'GRAND MOTORS',
    eyebrowName: 'MAINTENANCE & CUSTOM',
    titleLines: ['BESPOKE', 'SERVICE'],
    description: 'General maintenance, detailing, and custom performance builds.',
    services: [
      'General maintenance',
      'Oil change',
      'Wipers & detailing',
      'Modifications & custom builds'
    ],
    chapterNumber: '09',
    chapterLabel: 'MAINTENANCE & CUSTOM',
    direction: 'up',
  },
];
