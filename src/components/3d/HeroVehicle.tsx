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
    // Fix materials that need transparency (glass/windows)
    // The asset is a "Transparency Mercedes AMG One". The body panels (paint, carbon)
    // are meant to be translucent so we can see the internal structure.
    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const mat = mesh.material as THREE.MeshStandardMaterial;

        // Upgrade body panels to translucent glassy physical materials
        if (mat.name === 'amgprojone_paint' || mat.name === 'amgprojone_carbon') {
          // Convert to MeshPhysicalMaterial for high fidelity transmission
          const physicalMat = new THREE.MeshPhysicalMaterial({
            color: mat.color,
            map: mat.map,
            metalness: 0.1,    // Lower metalness so transmission works better
            roughness: 0.2,    // Glassy finish
            normalMap: mat.normalMap,
            // Transparency settings:
            transparent: true,
            transmission: 0.85, // Strong transmission to see through
            opacity: 1,        // Opacity should be 1 if we're using transmission
            thickness: 0.5,    // Refraction thickness
            ior: 1.45,         // Glass IOR
            side: THREE.DoubleSide,
            depthWrite: false, // Prevents ordering issues with internal components
          });

          if (mat.name === 'amgprojone_carbon' && mat.map) {
            // Keep the carbon look but slightly darker / tinted
            physicalMat.color.setHex(0x222222);
            physicalMat.roughness = 0.3;
            physicalMat.transmission = 0.7; // Carbon a bit less transparent
          }

          mesh.material = physicalMat;
        }
        else if (mat.name.toLowerCase().includes('glass') || mat.name.toLowerCase().includes('windshield')) {
          mat.transparent = true;
          mat.side = THREE.DoubleSide;
          mat.needsUpdate = true;
        }
      }
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
