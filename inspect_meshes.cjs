const fs = require('fs');

async function checkGLBMeshes() {
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

  function printMeshesForMaterial(matName) {
    console.log(`\n--- Meshes using material: ${matName} ---`);
    const matIndex = jsonChunk.materials.findIndex(m => m.name === matName);
    if (matIndex === -1) {
      console.log('Material not found');
      return;
    }
    for (let i = 0; i < jsonChunk.nodes.length; i++) {
        const node = jsonChunk.nodes[i];
        if (node.mesh !== undefined) {
             const mesh = jsonChunk.meshes[node.mesh];
             let usesMat = false;
             for (const prim of mesh.primitives) {
                 if (prim.material === matIndex) usesMat = true;
             }
             if (usesMat) {
                 console.log(`Node: ${node.name || ('Node_' + i)}, Mesh: ${mesh.name || ('Mesh_' + node.mesh)}`);
             }
        }
    }
  }

  printMeshesForMaterial('amgprojone_paint');
  printMeshesForMaterial('amgprojone_carbon');
  printMeshesForMaterial('amgprojone_clearglass2');
  printMeshesForMaterial('amgprojone_clearglass');
  printMeshesForMaterial('amgprojone_glass_005');
}

checkGLBMeshes();
