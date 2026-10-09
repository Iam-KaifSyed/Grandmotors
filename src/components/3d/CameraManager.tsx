import { useFrame, useThree } from '@react-three/fiber';
import { getFrame } from '../../lib/directorState';
import * as THREE from 'three';

const BASELINE_ASPECT = 16 / 9; // Reference desktop aspect ratio

/**
 * Reads the current Frame every tick and drives the R3F camera.
 * Dynamically adjusts vertical FOV on mobile & tablet aspect ratios
 * to keep the vehicle perfectly framed without horizontal clipping.
 */
export function CameraManager() {
  const { camera, size } = useThree();

  useFrame(() => {
    const frame = getFrame();
    if (!frame) return;

    camera.position.set(frame.camera.pos[0], frame.camera.pos[1], frame.camera.pos[2]);
    camera.lookAt(frame.camera.look[0], frame.camera.look[1], frame.camera.look[2]);

    if (camera instanceof THREE.PerspectiveCamera) {
      let targetFov = frame.camera.fov;
      const currentAspect = size.width / Math.max(1, size.height);

      if (currentAspect < BASELINE_ASPECT) {
        // Calculate FOV adjustment to maintain horizontal framing on mobile & tablets
        const aspectFactor = BASELINE_ASPECT / currentAspect;
        // Smooth dampening curve to prevent extreme distortion on ultra-narrow aspect ratios
        const clampedFactor = Math.min(1.85, Math.max(1.0, Math.pow(aspectFactor, 0.72)));
        const radFov = (targetFov * Math.PI) / 180;
        const adjustedRadFov = 2 * Math.atan(Math.tan(radFov / 2) * clampedFactor);
        targetFov = (adjustedRadFov * 180) / Math.PI;
      }

      camera.fov = targetFov;
      camera.updateProjectionMatrix();
    }
  });

  return null;
}
