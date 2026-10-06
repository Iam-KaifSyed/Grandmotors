const fs = require('fs');

const chs = [
  '03-engine', '04-brakes', '05-suspension', '06-diagnostics', '07-reassembly', '08-ignition'
];

for (const ch of chs) {
  const name = ch.split('-')[1];
  const content = `import type { Chapter } from '../core/types';
import { cam, shot } from './util';

export const ${name}: Chapter = {
  id: '${name}',
  beats: 1,
  camera: [cam(0, shot([0, 1.5, 7.4], [0, 0.95, 0.4], 34)), cam(1, shot([0, 1.5, 7.4], [0, 0.95, 0.4], 34))],
  tracks: [],
  overlays: []
};
`;
  fs.writeFileSync(`src/experience/chapters/${ch}.ts`, content);
}
