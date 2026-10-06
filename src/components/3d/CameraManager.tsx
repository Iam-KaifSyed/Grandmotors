import { useFrame, useThree } from '@react-three/fiber';
import { getFrame } from '../../lib/directorState';
import * as THREE from 'three';

/**
 * Reads the current Frame every tick and drives the R3F camera.
 * No state — pure imperative; the director owns position and FOV.
 */
export function CameraManager() {
  const { camera } = useThree();

  useFrame(() => {
    const frame = getFrame();
    if (!frame) return;

    camera.position.set(frame.camera.pos[0], frame.camera.pos[1], frame.camera.pos[2]);
    camera.lookAt(frame.camera.look[0], frame.camera.look[1], frame.camera.look[2]);
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = frame.camera.fov;
      camera.updateProjectionMatrix();
    }
  });

  return null;
}
