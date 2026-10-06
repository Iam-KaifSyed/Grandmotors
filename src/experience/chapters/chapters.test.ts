import { describe, expect, it } from 'vitest';
import { CHAPTERS, timeline } from './index';

const EPS = 1e-7;

describe('the nine chapters', () => {
  it('compile in the approved order', () => {
    expect(CHAPTERS.map((c) => c.id)).toEqual([
      'open',
      'arrival',
      'reveal',
      'engine',
      'brakes',
      'suspension',
      'diagnostics',
      'reassembly',
      'ignition',
    ]);
    expect(timeline.ranges).toHaveLength(9);
    expect(timeline.ranges.at(-1)!.end).toBeCloseTo(1);
  });

  it('keep the camera and every channel continuous at each chapter boundary', () => {
    for (const r of timeline.ranges.slice(1)) {
      const a = timeline.sample(r.start - EPS);
      const b = timeline.sample(r.start + EPS);
      expect(b.chapter).toBe(a.chapter + 1);

      for (let i = 0; i < 3; i++) {
        expect(Math.abs(a.camera.pos[i]! - b.camera.pos[i]!)).toBeLessThan(1e-3);
        expect(Math.abs(a.camera.look[i]! - b.camera.look[i]!)).toBeLessThan(1e-3);
      }
      expect(Math.abs(a.camera.fov - b.camera.fov)).toBeLessThan(1e-3);

      for (const ch of Object.keys(a.values) as Array<keyof typeof a.values>) {
        const d = Math.abs((a.values[ch] ?? 0) - (b.values[ch] ?? 0));
        expect(d, `${ch} jumps entering "${r.id}"`).toBeLessThan(1e-3);
      }
    }
  });

  it('end assembled: lifted parts, hood, wheel and glass are back at rest', () => {
    const end = timeline.sample(1).values;
    for (const ch of [
      'hood.rx',
      'engineCover.py',
      'airbox.py',
      'battery.py',
      'coolantTank.py',
      'wheelFR.px',
      'springFR.sy',
      'wheelFR.py',
      'rig.pz',
    ] as const) {
      expect(end[ch] ?? 0, ch).toBeCloseTo(0);
    }
    expect(end['fx.glass']).toBeCloseTo(1);
    expect(end['fx.tyre']).toBeCloseTo(1);
    expect(end['fx.scan']).toBeCloseTo(0);
    expect(end['light.headlamps']).toBeCloseTo(1);
  });

  it('start dark', () => {
    const v = timeline.sample(0).values;
    expect(v['light.ambient']).toBeCloseTo(0);
    expect(v['light.headlamps']).toBeCloseTo(0);
    expect(v['light.key']).toBeCloseTo(0);
  });
});
