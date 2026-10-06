import { describe, it, expect } from 'vitest';
import { getChapterAnimationState, CHAPTER_DATA } from './chapterTransitions';

describe('getChapterAnimationState', () => {
  it('ensures inactive chapters are 100% hidden', () => {
    for (let c = 0; c < 9; c++) {
      if (c === 0) continue;
      const state = getChapterAnimationState(c, 0, 0.5);
      expect(state.opacity).toBe(0);
      expect(state.isVisible).toBe(false);
    }
  });

  it('chapter 0 starts fully visible and holds before smooth exit', () => {
    // Beginning
    const start = getChapterAnimationState(0, 0, 0.0);
    expect(start.opacity).toBe(1);
    expect(start.translateX).toBe(0);
    expect(start.isVisible).toBe(true);

    // Mid hold
    const mid = getChapterAnimationState(0, 0, 0.5);
    expect(mid.opacity).toBe(1);
    expect(mid.translateX).toBe(0);
    expect(mid.isVisible).toBe(true);

    // Exiting
    const exiting = getChapterAnimationState(0, 0, 0.8);
    expect(exiting.opacity).toBeLessThan(1);
    expect(exiting.opacity).toBeGreaterThan(0);
    expect(exiting.translateX).toBeLessThan(0);

    // Completely exited / clean gap
    const end = getChapterAnimationState(0, 0, 0.95);
    expect(end.opacity).toBe(0);
    expect(end.isVisible).toBe(false);
  });

  it('never allows overlapping visible chapters at any point across transitions', () => {
    // Sample densely across chapters 0 to 8 with progress 0..1
    for (let currentChapter = 0; currentChapter < 9; currentChapter++) {
      for (let p = 0; p <= 100; p++) {
        const local = p / 100;
        let visibleCount = 0;

        for (let chapterIndex = 0; chapterIndex < 9; chapterIndex++) {
          const state = getChapterAnimationState(chapterIndex, currentChapter, local);
          if (state.isVisible) {
            visibleCount++;
          }
        }

        // At any single moment, AT MOST 1 chapter is visible (could be 0 in transition gap)
        expect(visibleCount).toBeLessThanOrEqual(1);
      }
    }
  });

  it('contains valid data for all 9 chapters', () => {
    expect(CHAPTER_DATA.length).toBe(9);
    for (const [idx, data] of CHAPTER_DATA.entries()) {
      expect(data.titleLines.length).toBeGreaterThanOrEqual(1);
      expect(data.chapterNumber).toBe(`0${idx + 1}`);
      expect(data.eyebrowCategory).toBeTruthy();
      expect(data.eyebrowName).toBeTruthy();
      expect(data.description).toBeTruthy();
    }
  });
});
