const fs = require('fs');

async function checkGLBExtras() {
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

  console.log('amgprojone_paint extras/extensions:', paintMat.extras, paintMat.extensions);
  console.log('amgprojone_carbon extras/extensions:', carbonMat.extras, carbonMat.extensions);

}

checkGLBExtras();
