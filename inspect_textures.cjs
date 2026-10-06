const fs = require('fs');

async function checkGLBTexture() {
  const buffer = fs.readFileSync('public/models/amg-one.glb');

  const length = buffer.readUInt32LE(8);
  let offset = 12;
  let jsonChunk = null;

  while (offset < length) {
    const chunkLength = buffer.readUInt32LE(offset);
    const chunkType = buffer.readUInt32LE(offset + 4);

    if (chunkType === 0x4E4F534A) {
      jsonChunk = JSON.parse(buffer.slice(offset + 8, offset + 8 + chunkLength).toString('utf8'));
      break;
    }
    offset += chunkLength + 8;
  }

  if (!jsonChunk) return;

  const paintMat = jsonChunk.materials.find(m => m.name === 'amgprojone_paint');
  const carbonMat = jsonChunk.materials.find(m => m.name === 'amgprojone_carbon');

  function checkMat(mat) {
    if (!mat) return;
    console.log(`\nMaterial: ${mat.name}`);
    if (mat.pbrMetallicRoughness && mat.pbrMetallicRoughness.baseColorTexture) {
      const texIndex = mat.pbrMetallicRoughness.baseColorTexture.index;
      const texture = jsonChunk.textures[texIndex];
      const imageIndex = texture.source;
      const image = jsonChunk.images[imageIndex];
      console.log(`  baseColorTexture (image ${imageIndex}): mimeType=${image.mimeType}, name=${image.name}`);
    } else {
      console.log('  No baseColorTexture');
    }
  }

  checkMat(paintMat);
  checkMat(carbonMat);

  // let's do a fast scan of all materials to see if they use PNGs
  console.log('\n--- Materials with PNG base color ---');
  for (const mat of jsonChunk.materials) {
    if (mat.pbrMetallicRoughness && mat.pbrMetallicRoughness.baseColorTexture) {
      const texIndex = mat.pbrMetallicRoughness.baseColorTexture.index;
      const texture = jsonChunk.textures[texIndex];
      const imageIndex = texture.source;
      const image = jsonChunk.images[imageIndex];
      if (image && image.mimeType === 'image/png') {
        console.log(` ${mat.name} uses ${image.mimeType} (name=${image.name})`);
      }
    }
  }
}

checkGLBTexture();
