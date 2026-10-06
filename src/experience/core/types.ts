import type { AnchorId } from '../rig/anchors';

export type Vec3 = readonly [number, number, number];

export type ChapterId =
  | 'open'
  | 'arrival'
  | 'reveal'
  | 'engine'
  | 'brakes'
  | 'suspension'
  | 'diagnostics'
  | 'reassembly'
  | 'ignition';

export type LightId =
  | 'ambient'
  | 'key'
  | 'headlamps'
  | 'bay'
  | 'floor'
  | 'detail'
  | 'cabin'
  | 'garage';

/** px..rz are offsets from rest; sy is a scale DELTA (0 = unchanged, -0.1 = 10% shorter). */
export type Axis = 'px' | 'py' | 'pz' | 'rx' | 'ry' | 'rz' | 'sy';

export type PartChannel = `${AnchorId}.${Axis}`;
export type LightChannel = `light.${LightId}`;
export type FxChannel =
  | 'fx.glass' // 1 opaque .. 0 transparent (driver window + windscreen)
  | 'fx.tyre' // 1 opaque .. 0 transparent
  | 'fx.wheelSpin' // cumulative revolutions
  | 'fx.sheen' // 0..1 position of the travelling reflection light along the body
  | 'fx.vibe' // engine idle vibration amount 0..1
  | 'fx.scan' // scanner sweep 0..1
  | 'fx.cluster' // instrument cluster wake 0..1
  | 'fx.exhaust' // exhaust haze 0..1
  | 'fx.hl.engine' // component highlight amounts 0..1
  | 'fx.hl.brake'
  | 'fx.hl.suspension';

export type Channel = PartChannel | LightChannel | FxChannel;

/** Channels whose resting value is not 0. */
export const CHANNEL_DEFAULTS: Partial<Record<Channel, number>> = {
  'fx.glass': 1,
  'fx.tyre': 1,
};

export type Ease = 'smooth' | 'linear' | 'out';

export interface CameraKey {
  /** Local chapter time, 0..1. */
  t: number;
  pos: Vec3;
  look: Vec3;
  fov: number;
  /** Zero camera velocity here (a deliberate dwell). */
  hold?: boolean;
}

export interface ScalarKey {
  t: number;
  v: number;
  /** Easing of the segment that ARRIVES at this key. Default 'smooth'. */
  ease?: Ease;
}

export interface Track {
  channel: Channel;
  keys: ScalarKey[];
}

export interface Overlay {
  /** Resolved against the content layer; carries no copy itself. */
  id: string;
  from: number;
  to: number;
  /** Fade width as a fraction of the chapter. Default 0.08. */
  fade?: number;
  fadeIn?: boolean; // default true
  fadeOut?: boolean; // default true
}

export interface Chapter {
  id: ChapterId;
  /** Scroll length. 1 beat is roughly one viewport height. */
  beats: number;
  /**
   * Camera keys, local t 0..1, first at 0 and last at 1.
   * The t=0 key MUST equal the previous chapter's t=1 key (enforced at compile time).
   */
  camera: CameraKey[];
  tracks: Track[];
  overlays: Overlay[];
}

export interface ActiveOverlay {
  id: string;
  opacity: number;
}

export interface Frame {
  chapter: number;
  chapterId: ChapterId;
  /** 0..1 within the current chapter. */
  local: number;
  camera: { pos: Vec3; look: Vec3; fov: number };
  values: Partial<Record<Channel, number>>;
  overlays: ActiveOverlay[];
}
