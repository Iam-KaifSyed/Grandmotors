/**
 * Canonical anchors the timeline is allowed to address.
 *
 * Canonical frame (every adapter must convert into this):
 *   right-handed, +y up, +z toward the FRONT of the car, +x toward the car's LEFT.
 *   Car origin is ground level, centred between the axles' footprint.
 *   "FR" = front-right = -x. (Grand Motor serves India: right-hand drive,
 *   so the driver sits on the -x side.)
 *
 * Part channels are OFFSETS from each anchor's rest pose, in metres / radians,
 * expressed in the canonical frame about the anchor's own pivot.
 * The hood pivot sits on its rear hinge line; open = negative rx.
 */
export const ANCHOR_IDS = [
  'rig', // whole-car root (arrival translation)
  'hood',
  'wheelFL',
  'wheelFR',
  'wheelRL',
  'wheelRR',
  'tyreFR',
  'discFR',
  'caliperFR',
  'strutFR',
  'springFR',
  'engineBay',
  'engine',
  'engineCover',
  'airbox',
  'battery',
  'coolantTank',
  'dash',
  'cluster',
  'glassDriver',
  'glassWindscreen',
  'headlampL',
  'headlampR',
  'exhaust',
] as const;

export type AnchorId = (typeof ANCHOR_IDS)[number];
