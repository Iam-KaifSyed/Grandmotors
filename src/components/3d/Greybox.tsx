import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ANCHOR_IDS } from '../../experience/rig/anchors';
import type { AnchorId } from '../../experience/rig/anchors';
import { getFrame } from '../../lib/directorState';

/**
 * Greybox adapter — implements the CarRig interface with primitive geometry.
 * Reading channels from the Director frame and applying them to Three.js groups.
 * Swap this whole component (or its internals) for the real G-Wagen model in Stage 2+.
 *
 * Transform convention (canonical frame):
 *   PartChannel offsets are applied as: position += [px, py, pz], euler += [rx, ry, rz], scaleY += sy
 */
export function Greybox() {
  // A flat map of anchor id → group ref
  const anchors = useRef<Partial<Record<AnchorId, THREE.Group>>>({});

  useFrame(() => {
    const frame = getFrame();
    if (!frame) return;

    for (const id of ANCHOR_IDS) {
      const g = anchors.current[id];
      if (!g) continue;

      const px = frame.values[`${id}.px`] ?? 0;
      const py = frame.values[`${id}.py`] ?? 0;
      const pz = frame.values[`${id}.pz`] ?? 0;
      const rx = frame.values[`${id}.rx`] ?? 0;
      const ry = frame.values[`${id}.ry`] ?? 0;
      const rz = frame.values[`${id}.rz`] ?? 0;
      const sy = frame.values[`${id}.sy`] ?? 0;

      g.position.set(px, py, pz);
      g.rotation.set(rx, ry, rz);
      g.scale.set(1, 1 + sy, 1);
    }
  });

  function ref(id: AnchorId) {
    return (el: THREE.Group | null) => {
      if (el) anchors.current[id] = el;
    };
  }

  return (
    // rig root — receives whole-car arrival translation (e.g. rig.pz coming in from deep Z)
    <group ref={ref('rig')}>

      {/* ─── ENGINE BAY REGION ─────────────────────────────────────── */}
      <group ref={ref('engineBay')}>
        {/* Bulk bay shell */}
        <mesh position={[0, 0.75, 1.6]}>
          <boxGeometry args={[1.6, 0.6, 1.0]} />
          <meshStandardMaterial color="#3a3a3a" wireframe />
        </mesh>

        {/* Engine block */}
        <group ref={ref('engine')}>
          <mesh position={[0, 0.7, 1.55]}>
            <boxGeometry args={[0.75, 0.45, 0.55]} />
            <meshStandardMaterial color="#222" />
          </mesh>

          {/* Engine cover (lifts off) */}
          <group ref={ref('engineCover')}>
            <mesh position={[0, 0.95, 1.55]}>
              <boxGeometry args={[0.72, 0.06, 0.52]} />
              <meshStandardMaterial color="#555" />
            </mesh>
          </group>
        </group>

        {/* Airbox — driver side (+x is left/driver in RHD) */}
        <group ref={ref('airbox')}>
          <mesh position={[0.45, 0.75, 1.75]}>
            <boxGeometry args={[0.22, 0.22, 0.28]} />
            <meshStandardMaterial color="#1a1a1a" />
          </mesh>
        </group>

        {/* Battery — passenger side (-x) */}
        <group ref={ref('battery')}>
          <mesh position={[-0.42, 0.72, 1.35]}>
            <boxGeometry args={[0.22, 0.22, 0.22]} />
            <meshStandardMaterial color="#2a3a2a" />
          </mesh>
        </group>

        {/* Coolant tank */}
        <group ref={ref('coolantTank')}>
          <mesh position={[-0.36, 0.72, 1.8]}>
            <cylinderGeometry args={[0.09, 0.09, 0.2, 10]} />
            <meshStandardMaterial color="#ddd" transparent opacity={0.7} />
          </mesh>
        </group>
      </group>

      {/* ─── HOOD (pivot at rear hinge line z≈1.0, above bay) ──────── */}
      {/* Hood opens by rotating around negative X (rx < 0 → tips forward) */}
      <group position={[0, 0.96, 1.0]} ref={ref('hood')}>
        <mesh position={[0, 0.04, 0.62]}>
          <boxGeometry args={[1.65, 0.05, 1.2]} />
          <meshStandardMaterial color="#aaa" />
        </mesh>
      </group>

      {/* ─── CABIN / DASH ─────────────────────────────────────────── */}
      <group ref={ref('dash')}>
        <mesh position={[0, 0.9, 0.45]}>
          <boxGeometry args={[1.55, 0.3, 0.38]} />
          <meshStandardMaterial color="#222" />
        </mesh>
        <group ref={ref('cluster')}>
          <mesh position={[-0.38, 1.02, 0.38]}>
            <boxGeometry args={[0.38, 0.18, 0.06]} />
            <meshStandardMaterial color="#111" emissive="#001122" emissiveIntensity={0} />
          </mesh>
        </group>
      </group>

      {/* ─── GLASS ────────────────────────────────────────────────── */}
      <group ref={ref('glassWindscreen')}>
        <mesh position={[0, 1.22, 0.72]} rotation={[-0.45, 0, 0]}>
          <planeGeometry args={[1.42, 0.76]} />
          <meshPhysicalMaterial
            color="#88cbdc"
            transmission={0.85}
            roughness={0.05}
            transparent
            opacity={0.5}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
      <group ref={ref('glassDriver')}>
        <mesh position={[0.79, 1.08, 0.2]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[0.75, 0.48]} />
          <meshPhysicalMaterial
            color="#88cbdc"
            transmission={0.85}
            roughness={0.05}
            transparent
            opacity={0.5}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* ─── FRONT-RIGHT WHEEL ASSEMBLY (−x, RHD passenger side) ───── */}
      {/* Wheel centre at about [−0.9, 0.42, 1.42]. */}
      <group position={[-0.9, 0.42, 1.42]}>
        <group ref={ref('strutFR')}>
          <mesh position={[0, 0.28, 0]}>
            <cylinderGeometry args={[0.025, 0.025, 0.44, 8]} />
            <meshStandardMaterial color="#555" />
          </mesh>
        </group>
        <group ref={ref('springFR')}>
          <mesh position={[0, 0.28, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 0.4, 12]} />
            <meshStandardMaterial color="#882222" wireframe />
          </mesh>
        </group>
        <group ref={ref('wheelFR')}>
          {/* Disc */}
          <group ref={ref('discFR')} rotation={[0, 0, Math.PI / 2]}>
            <mesh>
              <cylinderGeometry args={[0.2, 0.2, 0.04, 20]} />
              <meshStandardMaterial color="#888" />
            </mesh>
          </group>
          {/* Caliper */}
          <group ref={ref('caliperFR')}>
            <mesh position={[-0.06, 0, -0.14]}>
              <boxGeometry args={[0.09, 0.19, 0.2]} />
              <meshStandardMaterial color="#cc2222" />
            </mesh>
          </group>
          {/* Tyre */}
          <group ref={ref('tyreFR')} rotation={[0, 0, Math.PI / 2]}>
            <mesh>
              <torusGeometry args={[0.25, 0.14, 8, 18]} />
              <meshStandardMaterial color="#111" />
            </mesh>
          </group>
        </group>
      </group>

      {/* ─── FRONT-LEFT WHEEL (+x, driver side) ──────────────────── */}
      <group position={[0.9, 0.42, 1.42]}>
        <group ref={ref('wheelFL')} rotation={[0, 0, Math.PI / 2]}>
          <mesh>
            <torusGeometry args={[0.25, 0.14, 8, 18]} />
            <meshStandardMaterial color="#111" />
          </mesh>
        </group>
      </group>

      {/* ─── REAR-RIGHT WHEEL ─────────────────────────────────────── */}
      <group position={[-0.9, 0.42, -1.0]}>
        <group ref={ref('wheelRR')} rotation={[0, 0, Math.PI / 2]}>
          <mesh>
            <torusGeometry args={[0.25, 0.14, 8, 18]} />
            <meshStandardMaterial color="#111" />
          </mesh>
        </group>
      </group>

      {/* ─── REAR-LEFT WHEEL ──────────────────────────────────────── */}
      <group position={[0.9, 0.42, -1.0]}>
        <group ref={ref('wheelRL')} rotation={[0, 0, Math.PI / 2]}>
          <mesh>
            <torusGeometry args={[0.25, 0.14, 8, 18]} />
            <meshStandardMaterial color="#111" />
          </mesh>
        </group>
      </group>

      {/* ─── HEADLAMPS ──────────────────────────────────────────── */}
      <group ref={ref('headlampL')}>
        <mesh position={[0.56, 0.72, 2.08]}>
          <boxGeometry args={[0.3, 0.2, 0.08]} />
          <meshStandardMaterial color="#ddd" emissive="#ddd" emissiveIntensity={0} />
        </mesh>
      </group>
      <group ref={ref('headlampR')}>
        <mesh position={[-0.56, 0.72, 2.08]}>
          <boxGeometry args={[0.3, 0.2, 0.08]} />
          <meshStandardMaterial color="#ddd" emissive="#ddd" emissiveIntensity={0} />
        </mesh>
      </group>

      {/* ─── EXHAUST ────────────────────────────────────────────── */}
      <group ref={ref('exhaust')}>
        <mesh position={[-0.48, 0.22, -1.62]}>
          <cylinderGeometry args={[0.04, 0.05, 0.18, 10]} />
          <meshStandardMaterial color="#222" />
        </mesh>
      </group>

    </group>
  );
}
