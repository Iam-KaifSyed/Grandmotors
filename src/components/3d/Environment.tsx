import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Environment as DreiEnvironment, useGLTF, MeshReflectorMaterial } from '@react-three/drei';
import { getFrame } from '../../lib/directorState';
import { Effects } from './Effects';

/**
 * Full enclosed concrete service bay built from bay-environment.glb.
 *
 * The GLB itself is only a single floor plane (`Plane.044_Concrete Tiles_0`)
 * with a complete PBR `Concrete_Tiles` material (baseColor + metalRough +
 * normal maps, RepeatWrapping). It has NO walls or ceiling geometry, so we
 * lift its concrete MATERIAL out of the file and re-use it on floor, four
 * walls and a ceiling that we build here. Each surface clones the material
 * and sets its own texture `repeat` so tiles stay a realistic ~1 m size
 * instead of one giant tile stretched across the room.
 */

// Room dimensions (metres). The AMG ONE is ~4.5 m long, so this reads as a
// generous but believable private bay.
const BAY_W = 26; // width  (X)
const BAY_H = 9;  // height (Y)
const BAY_D = 34; // depth  (Z)
const TILE_SIZE = 1.4; // metres per concrete tile

type ConcreteMaps = {
  map: THREE.Texture | null;
  normalMap: THREE.Texture | null;
  roughnessMap: THREE.Texture | null;
  metalnessMap: THREE.Texture | null;
};

/** Clone the concrete material's maps and tile them for a surface of w x h metres. */
function makeConcreteMaterial(src: ConcreteMaps, w: number, h: number) {
  const repeatX = Math.max(1, Math.round(w / TILE_SIZE));
  const repeatY = Math.max(1, Math.round(h / TILE_SIZE));

  const clone = (t: THREE.Texture | null, srgb: boolean) => {
    if (!t) return null;
    const c = t.clone();
    c.wrapS = c.wrapT = THREE.RepeatWrapping;
    c.repeat.set(repeatX, repeatY);
    c.needsUpdate = true;
    if (srgb) c.colorSpace = THREE.SRGBColorSpace;
    return c;
  };

  return new THREE.MeshStandardMaterial({
    map: clone(src.map, true),
    normalMap: clone(src.normalMap, false),
    roughnessMap: clone(src.roughnessMap, false),
    metalnessMap: clone(src.metalnessMap, false),
    roughness: 0.5,     // satin sheen, picks up the lights, not a mirror
    metalness: 0.15,
    color: new THREE.Color('#8a8d90'),
    side: THREE.FrontSide,
  });
}

function BayShell() {
  const { scene } = useGLTF('/models/bay-environment.glb');

  // Pull the concrete texture maps out of the GLB's single material.
  const maps = useMemo<ConcreteMaps>(() => {
    let found: THREE.MeshStandardMaterial | null = null;
    scene.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (mesh.isMesh && !found) {
        found = (Array.isArray(mesh.material) ? mesh.material[0] : mesh.material) as THREE.MeshStandardMaterial;
      }
    });
    const m = found as THREE.MeshStandardMaterial | null;
    return {
      map: m?.map ?? null,
      normalMap: m?.normalMap ?? null,
      roughnessMap: m?.roughnessMap ?? null,
      metalnessMap: m?.metalnessMap ?? null,
    };
  }, [scene]);

  // Floor keeps the concrete MAPS but is darkened; the live reflector below
  // supplies the wet streaky reflection seen in the reference.
  const floorMaps = useMemo(() => {
    const repeat = Math.max(1, Math.round(BAY_W / TILE_SIZE));
    const clone = (t: THREE.Texture | null, srgb: boolean) => {
      if (!t) return undefined;
      const c = t.clone();
      c.wrapS = c.wrapT = THREE.RepeatWrapping;
      c.repeat.set(repeat, Math.round(BAY_D / TILE_SIZE));
      c.needsUpdate = true;
      if (srgb) c.colorSpace = THREE.SRGBColorSpace;
      return c;
    };
    return {
      map: clone(maps.map, true),
      normalMap: clone(maps.normalMap, false),
      roughnessMap: clone(maps.roughnessMap, false),
    };
  }, [maps]);

  // Wall / ceiling materials (concrete, no reflection).
  const mats = useMemo(() => ({
    ceiling: makeConcreteMaterial(maps, BAY_W, BAY_D),
    wallFB: makeConcreteMaterial(maps, BAY_W, BAY_H), // front / back (span X)
    wallLR: makeConcreteMaterial(maps, BAY_D, BAY_H), // left / right (span Z)
  }), [maps]);

  // Dark concrete tones so the room reads moody, not flat grey.
  useEffect(() => {
    mats.ceiling.color.set('#2a2d30');
    mats.wallFB.color.set('#2f3335');
    mats.wallLR.color.set('#2f3335');
  }, [mats]);

  // Central row of recessed ceiling light strips (the signature glow).
  const STRIP_COUNT = 7;
  const strips = Array.from({ length: STRIP_COUNT }).map((_, i) => {
    const z = (i - (STRIP_COUNT - 1) / 2) * 3.6;
    return z;
  });

  // Drive the strips off the timeline so scene 1 is fully dark and the
  // strips power on (cool white) across scenes 2-9. We follow light.key,
  // which the chapters hold at 0 for ignition and ~1.0 everywhere else.
  const stripMatRefs = useRef<Array<THREE.MeshStandardMaterial | null>>([]);
  const stripLightRefs = useRef<Array<THREE.PointLight | null>>([]);
  useFrame(() => {
    const frame = getFrame();
    const level = frame ? frame.values['light.key'] ?? 0 : 0;
    stripMatRefs.current.forEach((m) => { if (m) m.emissiveIntensity = level * 3.2; });
    stripLightRefs.current.forEach((l) => { if (l) l.intensity = level * Math.PI * 2.2; });
  });

  return (
    <group>
      {/* ---- Floor: concrete texture + wet reflective sheen ---- */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[BAY_W, BAY_D]} />
        <MeshReflectorMaterial
          map={floorMaps.map}
          normalMap={floorMaps.normalMap}
          roughnessMap={floorMaps.roughnessMap}
          resolution={2048}
          blur={[300, 100]}
          mixBlur={2.0}
          mixStrength={1.4}
          mixContrast={1.1}
          roughness={0.35}
          metalness={0.25}
          depthScale={0.5}
          minDepthThreshold={0.3}
          maxDepthThreshold={1.2}
          color="#2b2e31"
          mirror={0.4}
        />
      </mesh>

      {/* ---- Ceiling ---- */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, BAY_H, 0]} receiveShadow>
        <planeGeometry args={[BAY_W, BAY_D]} />
        <primitive object={mats.ceiling} attach="material" />
      </mesh>

      {/* ---- Walls ---- */}
      <mesh position={[0, BAY_H / 2, -BAY_D / 2]} receiveShadow>
        <planeGeometry args={[BAY_W, BAY_H]} />
        <primitive object={mats.wallFB} attach="material" />
      </mesh>
      <mesh position={[0, BAY_H / 2, BAY_D / 2]} rotation={[0, Math.PI, 0]} receiveShadow>
        <planeGeometry args={[BAY_W, BAY_H]} />
        <primitive object={mats.wallFB} attach="material" />
      </mesh>
      <mesh position={[-BAY_W / 2, BAY_H / 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[BAY_D, BAY_H]} />
        <primitive object={mats.wallLR} attach="material" />
      </mesh>
      <mesh position={[BAY_W / 2, BAY_H / 2, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[BAY_D, BAY_H]} />
        <primitive object={mats.wallLR} attach="material" />
      </mesh>

      {/* ---- Central row of glowing recessed ceiling light strips ---- */}
      {/* Cool-white, driven by the timeline (off in scene 1, on 2-9). */}
      {strips.map((z, i) => (
        <group key={i} position={[0, BAY_H - 0.02, z]}>
          {/* Bright emissive panel facing down (bloom picks this up) */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <planeGeometry args={[1.1, 2.4]} />
            <meshStandardMaterial
              ref={(m) => { stripMatRefs.current[i] = m; }}
              color="#ffffff"
              emissive="#dbe8ff"
              emissiveIntensity={0}
              toneMapped={false}
            />
          </mesh>
          {/* A real light so each strip actually illuminates + reflects */}
          <pointLight
            ref={(l) => { stripLightRefs.current[i] = l; }}
            color="#dde9ff"
            intensity={0}
            distance={22}
            decay={1.4}
            position={[0, -0.3, 0]}
            castShadow={i === Math.floor(STRIP_COUNT / 2)}
            shadow-mapSize={[1024, 1024]}
            shadow-bias={-0.0005}
          />
        </group>
      ))}
    </group>
  );
}

export function Environment() {
  const { scene } = useThree();
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const keyRef = useRef<THREE.PointLight>(null);
  const headlampsRef = useRef<THREE.SpotLight>(null);
  const floorRef = useRef<THREE.PointLight>(null);
  const wallWashRef = useRef<THREE.PointLight>(null);

  useFrame(() => {
    const frame = getFrame();
    if (!frame) return;

    const ambientTrack = frame.values['light.ambient'] ?? 0;

    // Scale HDR environment reflection intensity based on ambient track
    scene.environmentIntensity = ambientTrack * 0.5;

    if (ambientRef.current) ambientRef.current.intensity = ambientTrack * Math.PI * 0.1;
    // Overhead cinematic key
    if (keyRef.current) keyRef.current.intensity = (frame.values['light.key'] ?? 0) * Math.PI * 1.5;
    // Front aero & headlamp accents
    if (headlampsRef.current) headlampsRef.current.intensity = (frame.values['light.headlamps'] ?? 0) * Math.PI * 0.5;
    // Rim / vehicle silhouette separation
    if (floorRef.current) floorRef.current.intensity = (frame.values['light.floor'] ?? 0) * Math.PI * 1;
    // Architectural wall wash
    if (wallWashRef.current) wallWashRef.current.intensity = ambientTrack * Math.PI * 0.5;
  });

  return (
    <>
      {/* Base deep charcoal atmospheric background */}
      <color attach="background" args={['#050607']} />

      {/* Light haze down the hall for depth (tuned to the enclosed bay) */}
      <fog attach="fog" args={['#060708', 10, 42]} />

      {/* Soft IBL so the car's carbon + paint still read */}
      <DreiEnvironment preset="warehouse" />

      <ambientLight ref={ambientRef} color="#aebecf" />

      {/* Cinematic overhead key light (cool) */}
      <pointLight
        ref={keyRef}
        color="#cfe0f2"
        position={[0.5, 4.2, 1.2]}
        distance={18}
        decay={1.6}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
      />

      {/* Rim light - separating the vehicle from the background */}
      <pointLight
        ref={floorRef}
        color="#798ba0"
        position={[-2.8, 1.8, -3.5]}
        distance={14}
        decay={1.8}
      />

      {/* Soft front fill light (cool) */}
      <spotLight
        ref={headlampsRef}
        color="#c3d2e4"
        position={[-0.8, 1.6, 4.2]}
        angle={Math.PI / 3.8}
        penumbra={1}
        distance={12}
        decay={2}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0001}
      />

      {/* Architectural Background Wash Light creating depth behind the car */}
      <pointLight
        ref={wallWashRef}
        color="#1f2429"
        position={[0, 2.5, -5.5]}
        distance={16}
        decay={1.4}
      />

      {/* ============================================================ */}
      {/* ENCLOSED CONCRETE BAY (floor + walls + ceiling)              */}
      {/* All surfaces use the Concrete_Tiles material from the GLB.   */}
      {/* ============================================================ */}
      <BayShell />

      <Effects />
    </>
  );
}

useGLTF.preload('/models/bay-environment.glb');
