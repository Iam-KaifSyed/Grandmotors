const { NodeIO } = require('@gltf-transform/core');

async function inspect() {
  const io = new NodeIO();
  const document = await io.read('./public/models/transparency_mercedes_amg_one.glb');
  const root = document.getRoot();
  const nodes = root.listNodes();
  
  // Find a root node
  const rootNodes = nodes.filter(n => !n.getParentNode());
  rootNodes.forEach(node => {
      console.log(`Node: ${node.getName()}`);
      console.log(`Translation: ${node.getTranslation()}`);
      console.log(`Rotation: ${node.getRotation()}`);
      console.log(`Scale: ${node.getScale()}`);
  });
}
inspect().catch(console.error);
