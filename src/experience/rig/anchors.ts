export const ANCHOR_IDS = [
  'rig', // whole-car root (arrival translation)
  'body',
  'glass',
  'wheelFL',
  'wheelFR',
  'wheelRL',
  'wheelRR',
  'tyreFL',
  'tyreFR',
  'tyreRL',
  'tyreRR',
  // Brakes/suspension are unsupported by this model, omitted.
  'powertrain', // we map the engine mesh here
  'cockpit',    // we map the interior here
  'headlights',
  'rearLights',
  'doorL',
  'doorR',
  'aero',       // rear spoiler/wing
] as const;

export type AnchorId = (typeof ANCHOR_IDS)[number];
