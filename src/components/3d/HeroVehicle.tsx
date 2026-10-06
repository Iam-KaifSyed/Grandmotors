/**
 * HeroVehicle (Mercedes-AMG ONE)
 * 
 * Model based on: "Cafe nhân sâm hòa tan Queen Food" 
 * by Khoai Lang Tím Sấy Giòn Queen Food (https://sketchfab.com/khoailangsayqueenfood)
 * License: CC-BY-4.0 (http://creativecommons.org/licenses/by/4.0/)
 * Source: https://sketchfab.com/3d-models/cafe-nhan-sam-hoa-tan-queen-food-e28a0fb813ad49e0ba610c7fa0137146
 * Note: Asset is an AMG ONE despite the humorous title.
 */
import { useEffect, useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import { ANCHOR_IDS, type AnchorId } from '../../experience/rig/anchors';
import { getFrame } from '../../lib/directorState';

export function HeroVehicle() {
  const { scene } = useGLTF('/models/transparency_mercedes_amg_one.glb');
  
  // Clone scene so we don't mutate the cached singleton if re-mounted
  const clonedScene = useMemo(() => scene.clone(), [scene]);

  // A map storing the rest transforms of objects we intend to animate
  const restPoses = useRef<Record<string, { position: THREE.Vector3, rotation: THREE.Euler, scale: THREE.Vector3 }>>({});

  // Map our semantic anchors to specific raw Object3D nodes in the GLTF
  const nodeMapping: Partial<Record<AnchorId, string[]>> = {
    doorL: ['amgprojone_door_L'],
    doorR: ['amgprojone_door_R'],
    wheelFL: ['amgprojone_tire_003', 'amgprojone_rim_003'],
    wheelFR: ['amgprojone_tire_002', 'amgprojone_rim_002'],
    wheelRL: ['amgprojone_tire_001', 'amgprojone_rim_001'],
    wheelRR: ['amgprojone_tire', 'amgprojone_rim'],
    powertrain: ['amgprojone_body_009_engine2_3_0'],
    aero: ['amgprojone_spoiler'],
    // glass, body, headlights, rearLights, cockpit mapping can be expanded later
  };

  useEffect(() => {
    // Preserve the SOURCE model's authored transparency.
    //
    // The GLB is a "Transparency / cutaway" edition of the AMG ONE. The cutaway
    // look is NOT achieved with transmission. It is baked into the glTF materials
    // as `alphaMode: BLEND` with low baseColorFactor alpha, e.g.:
    //   amgprojone_paint   -> BLEND, baseColor alpha 0.1
    //   amgprojone_carbon  -> BLEND, baseColor alpha 0.1
    //   amgprojone_clearglass / clearglass2 / glass_005 -> BLEND, alpha 0.44..0.82
    // The only material extensions present are KHR_materials_emissive_strength
    // and KHR_materials_specular -- there is no KHR_materials_transmission.
    //
    // GLTFLoader already maps `alphaMode: BLEND` to `material.transparent = true`
    // and carries the alpha into `material.opacity`. The previous implementation
    // REPLACED paint/carbon with a transmission MeshPhysicalMaterial (opacity 1),
    // which discarded the authored alpha and rendered the body as a solid shell.
    //
    // So instead of rebuilding materials, we keep every material exactly as the
    // loader produced it and only correct render-ordering flags that make a
    // multi-layered transparent model read correctly (see internals through the
    // body): render both faces, and don't let transparent surfaces write depth
    // (which would otherwise occlude the components behind them).
    const seen = new Set<THREE.Material>();
    const tune = (material: THREE.Material) => {
      if (seen.has(material)) return;
      seen.add(material);

      const m = material as THREE.MeshStandardMaterial;
      // `transparent`/`opacity` come straight from the GLB's alphaMode + alpha.
      // Only touch materials the source authored as blended.
      if (m.transparent) {
        // Show interior-facing geometry through the panels.
        m.side = THREE.DoubleSide;
        // Transparent panels must not write depth, otherwise they hide the
        // chassis/engine/cockpit sitting behind them. depthTest stays on so
        // opaque internals still occlude each other correctly.
        m.depthWrite = false;
        m.depthTest = true;
        m.needsUpdate = true;
      }
    };

    clonedScene.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;
      // Render transparent panels after opaque internals in the sort order.
      mesh.renderOrder = 1;
      const mat = mesh.material;
      if (Array.isArray(mat)) mat.forEach(tune);
      else if (mat) tune(mat);
    });

    // Capture resting poses for all nodes we will animate
    for (const [, nodeNames] of Object.entries(nodeMapping)) {
      nodeNames.forEach(name => {
        const node = clonedScene.getObjectByName(name);
        if (node) {
          restPoses.current[name] = {
            position: node.position.clone(),
            rotation: node.rotation.clone(),
            // @ts-ignore
            scale: node.scale.clone(),
          };
        }
      });
    }
  }, [clonedScene]);

  const rigRef = useRef<THREE.Group>(null);

  useFrame(() => {
    const frame = getFrame();
    if (!frame) return;

    // 1. Apply 'rig' (whole car) properties to the root group
    if (rigRef.current) {
      const px = frame.values['rig.px'] ?? 0;
      const py = frame.values['rig.py'] ?? 0;
      const pz = frame.values['rig.pz'] ?? 0;
      const rx = frame.values['rig.rx'] ?? 0;
      const ry = frame.values['rig.ry'] ?? 0;
      const rz = frame.values['rig.rz'] ?? 0;
      
      rigRef.current.position.set(px, py, pz);
      rigRef.current.rotation.set(rx, ry, rz);
    }

    // 2. Apply other anchor properties to the raw GLTF nodes
    for (const id of ANCHOR_IDS) {
      if (id === 'rig') continue; // handled above

      const px = frame.values[`${id}.px`] ?? 0;
      const py = frame.values[`${id}.py`] ?? 0;
      const pz = frame.values[`${id}.pz`] ?? 0;
      const rx = frame.values[`${id}.rx`] ?? 0;
      const ry = frame.values[`${id}.ry`] ?? 0;
      const rz = frame.values[`${id}.rz`] ?? 0;
      const sy = frame.values[`${id}.sy`] ?? 0;

      // If there's no animation on this channel, don't do work
      if (px === 0 && py === 0 && pz === 0 && rx === 0 && ry === 0 && rz === 0 && sy === 0) {
        continue;
      }

      const rawNodes = nodeMapping[id];
      if (!rawNodes) continue;

      rawNodes.forEach(nodeName => {
        const node = clonedScene.getObjectByName(nodeName);
        const rest = restPoses.current[nodeName];
        if (node && rest) {
          // Offsets apply relative to the rest pose
          node.position.set(
            rest.position.x + px,
            rest.position.y + py,
            rest.position.z + pz
          );
          node.rotation.set(
            rest.rotation.x + rx,
            rest.rotation.y + ry,
            rest.rotation.z + rz
          );
          node.scale.set(
            rest.scale.x,
            rest.scale.y * (1 + sy),
            rest.scale.z
          );
        }
      });
    }
  });

  return (
    <group ref={rigRef}>
      <primitive object={clonedScene} />
    </group>
  );
}

useGLTF.preload('/models/transparency_mercedes_amg_one.glb');
