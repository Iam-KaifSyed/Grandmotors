const fs = require('fs');

async function checkGLB() {
  const buffer = fs.readFileSync('public/models/amg-one.glb');

  // Basic GLB parsing
  const magic = buffer.readUInt32LE(0);
  if (magic !== 0x46546C67) {
    console.error('Not a GLB file');
    return;
  }

  const version = buffer.readUInt32LE(4);
  const length = buffer.readUInt32LE(8);

  let offset = 12;
  let jsonChunk = null;

  while (offset < length) {
    const chunkLength = buffer.readUInt32LE(offset);
    const chunkType = buffer.readUInt32LE(offset + 4);

    // JSON chunk
    if (chunkType === 0x4E4F534A) {
      const chunkData = buffer.slice(offset + 8, offset + 8 + chunkLength);
      jsonChunk = JSON.parse(chunkData.toString('utf8'));
      break;
    }

    offset += chunkLength + 8;
  }

  if (jsonChunk && jsonChunk.materials) {
    console.log(`Found ${jsonChunk.materials.length} materials.\n`);

    for (const mat of jsonChunk.materials) {
      let isTransparent = false;
      if (mat.alphaMode === 'BLEND' || mat.alphaMode === 'MASK') isTransparent = true;
      if (mat.pbrMetallicRoughness && mat.pbrMetallicRoughness.baseColorFactor && mat.pbrMetallicRoughness.baseColorFactor[3] < 1.0) isTransparent = true;
      if (mat.extensions && mat.extensions.KHR_materials_transmission) isTransparent = true;

      if (isTransparent || mat.name.toLowerCase().includes('glass') || mat.name.toLowerCase().includes('windshield')) {
        console.log(`--- [Potential Transparent] Material: ${mat.name} ---`);
      } else {
        console.log(`Material: ${mat.name}`);
      }

      console.log(`  alphaMode: ${mat.alphaMode || 'OPAQUE'}`);
      console.log(`  alphaCutoff: ${mat.alphaCutoff}`);
      if (mat.pbrMetallicRoughness) {
        console.log(`  baseColorFactor: ${JSON.stringify(mat.pbrMetallicRoughness.baseColorFactor)}`);
        console.log(`  metallicFactor: ${mat.pbrMetallicRoughness.metallicFactor}`);
        console.log(`  roughnessFactor: ${mat.pbrMetallicRoughness.roughnessFactor}`);
      }
      if (mat.extensions) {
        console.log(`  extensions: ${Object.keys(mat.extensions).join(', ')}`);
        if (mat.extensions.KHR_materials_transmission) {
          console.log(`    transmissionFactor: ${mat.extensions.KHR_materials_transmission.transmissionFactor}`);
        }
      }
    }
  } else {
    console.log('No materials found in JSON chunk.');
  }
}

checkGLB();
