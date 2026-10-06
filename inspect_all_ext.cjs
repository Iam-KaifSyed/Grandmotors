const fs = require('fs');
async function checkAllExt() {
  const buffer = fs.readFileSync('public/models/transparency_mercedes_amg_one.glb');
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
  console.log('Extensions used in GLB:', jsonChunk.extensionsUsed);
  console.log('Extensions required in GLB:', jsonChunk.extensionsRequired);

}
checkAllExt();
