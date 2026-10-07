const fs = require('fs');

function readGLB(path) {
  const buffer = fs.readFileSync(path);
  const magic = buffer.readUInt32LE(0);
  if (magic !== 0x46546C67) { console.error('Not a GLB:', path); return null; }
  const length = buffer.readUInt32LE(8);
  let offset = 12;
  while (offset < length) {
    const chunkLength = buffer.readUInt32LE(offset);
    const chunkType = buffer.readUInt32LE(offset + 4);
    if (chunkType === 0x4E4F534A) {
      return JSON.parse(buffer.slice(offset + 8, offset + 8 + chunkLength).toString('utf8'));
    }
    offset += chunkLength + 8;
  }
  return null;
}

const j = readGLB('public/models/bay-environment.glb');
if (!j) process.exit(1);

console.log('=== bay-environment.glb ===');
console.log('extensionsUsed:', j.extensionsUsed);
console.log('extensionsRequired:', j.extensionsRequired);
console.log('scenes:', (j.scenes || []).length, ' nodes:', (j.nodes || []).length);
console.log('meshes:', (j.meshes || []).length);
console.log('materials:', (j.materials || []).length);
console.log('textures:', (j.textures || []).length, ' images:', (j.images || []).length);
console.log('cameras:', (j.cameras || []).length);
console.log('lights (KHR_lights_punctual):',
  j.extensions && j.extensions.KHR_lights_punctual
    ? (j.extensions.KHR_lights_punctual.lights || []).length : 0);

console.log('\n--- Top-level node names ---');
const sceneRoot = (j.scenes && j.scenes[0] && j.scenes[0].nodes) || [];
sceneRoot.forEach(i => console.log(' -', (j.nodes[i] && j.nodes[i].name) || `node ${i}`));

console.log('\n--- Mesh names (first 40) ---');
(j.meshes || []).slice(0, 40).forEach(m => console.log(' -', m.name));

console.log('\n--- Materials ---');
(j.materials || []).forEach(m => {
  const pbr = m.pbrMetallicRoughness || {};
  console.log(` - ${m.name} | alphaMode:${m.alphaMode || 'OPAQUE'} | baseColor:${JSON.stringify(pbr.baseColorFactor)} | hasBaseTex:${!!(pbr.baseColorTexture)} | emissive:${JSON.stringify(m.emissiveFactor)}`);
});

console.log('\n--- Images ---');
(j.images || []).forEach((im, i) => console.log(` [${i}] ${im.name || ''} ${im.mimeType || ''} ${im.uri ? '(uri:' + im.uri + ')' : '(embedded)'}`));

console.log('\n--- Material texture slots (material 0) ---');
const m0 = (j.materials || [])[0];
if (m0) {
  const pbr = m0.pbrMetallicRoughness || {};
  console.log(' baseColorTexture:', JSON.stringify(pbr.baseColorTexture));
  console.log(' metallicRoughnessTexture:', JSON.stringify(pbr.metallicRoughnessTexture));
  console.log(' normalTexture:', JSON.stringify(m0.normalTexture));
  console.log(' occlusionTexture:', JSON.stringify(m0.occlusionTexture));
  console.log(' emissiveTexture:', JSON.stringify(m0.emissiveTexture));
  console.log(' extensions:', JSON.stringify(m0.extensions));
}
console.log('\n--- Textures -> source/sampler ---');
(j.textures || []).forEach((t, i) => console.log(` tex[${i}] source:${t.source} sampler:${t.sampler}`));
console.log('\n--- Samplers ---');
(j.samplers || []).forEach((s, i) => console.log(` sampler[${i}] wrapS:${s.wrapS} wrapT:${s.wrapT}`));
console.log('\n--- Mesh 0 primitive attributes (has UVs?) ---');
const mesh0 = (j.meshes || [])[0];
if (mesh0) mesh0.primitives.forEach((p, i) => console.log(` prim[${i}] attrs:`, Object.keys(p.attributes).join(', ')));
