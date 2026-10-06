import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { MeshReflectorMaterial, Environment as DreiEnvironment } from '@react-three/drei';
import { getFrame } from '../../lib/directorState';
import { Effects } from './Effects';

export function Environment() {
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const keyRef = useRef<THREE.PointLight>(null);
  const headlampsRef = useRef<THREE.SpotLight>(null);
  const floorRef = useRef<THREE.PointLight>(null);
  const wallWashRef = useRef<THREE.PointLight>(null);

  useFrame(() => {
    const frame = getFrame();
    if (!frame) return;

    if (ambientRef.current) ambientRef.current.intensity = (frame.values['light.ambient'] ?? 0) * Math.PI * 0.7;
    // Overhead cinematic key
    if (keyRef.current) keyRef.current.intensity = (frame.values['light.key'] ?? 0) * Math.PI * 16;
    // Front aero & headlamp accents
    if (headlampsRef.current) headlampsRef.current.intensity = (frame.values['light.headlamps'] ?? 0) * Math.PI * 3.5;
    // Rim / vehicle silhouette separation
    if (floorRef.current) floorRef.current.intensity = (frame.values['light.floor'] ?? 0) * Math.PI * 8;
    // Architectural wall wash
    if (wallWashRef.current) wallWashRef.current.intensity = (frame.values['light.ambient'] ?? 0.1) * Math.PI * 6;
  });

  return (
    <>
      {/* Base deep charcoal atmospheric background */}
      <color attach="background" args={['#07090a']} />
      
      {/* Soft atmospheric haze keeping depth behind the vehicle */}
      <fog attach="fog" args={['#07090a', 6, 26]} />

      {/* Studio reflections for realistic carbon fiber and paint sheen */}
      <DreiEnvironment preset="studio" environmentIntensity={0.5} />

      <ambientLight ref={ambientRef} color="#b8c0c8" intensity={0.15} />

      {/* Cinematic overhead key light */}
      <pointLight 
        ref={keyRef} 
        color="#f8fafc" 
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
        color="#8fa3b8" 
        position={[-2.8, 1.8, -3.5]} 
        distance={14} 
        decay={1.5} 
      />

      {/* Soft front fill light */}
      <spotLight
        ref={headlampsRef}
        color="#e2e8f0"
        position={[-0.8, 1.6, 4.2]}
        angle={Math.PI / 3.8}
        penumbra={0.9}
        distance={12}
        decay={1.8}
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
      {/* ARCHITECTURAL GARAGE DEPTH LAYERS                            */}
      {/* ============================================================ */}

      {/* Layer 1: Foreground / Midground Ground Plane */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <MeshReflectorMaterial
          blur={[400, 100]}
          resolution={1024}
          mixBlur={2.2}
          mixStrength={3.2}
          roughness={0.65}
          depthScale={1.1}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#0d0f12"
          metalness={0.4}
          mirror={0.45}
        />
      </mesh>

      {/* Layer 2: Rear Architectural Wall Panels */}
      <group position={[0, 4, -7.5]}>
        {/* Main central matte wall */}
        <mesh position={[0, 0, 0]} receiveShadow>
          <planeGeometry args={[32, 10]} />
          <meshStandardMaterial 
            color="#111315" 
            roughness={0.9} 
            metalness={0.15} 
          />
        </mesh>

        {/* Subtle horizontal structural seam */}
        <mesh position={[0, -0.8, 0.05]}>
          <planeGeometry args={[32, 0.04]} />
          <meshStandardMaterial color="#25282b" roughness={0.7} metalness={0.3} />
        </mesh>
        <mesh position={[0, 2.2, 0.05]}>
          <planeGeometry args={[32, 0.03]} />
          <meshStandardMaterial color="#181b1e" roughness={0.7} metalness={0.3} />
        </mesh>

        {/* Structural vertical architectural columns */}
        <mesh position={[-5.5, 0, 0.1]} receiveShadow>
          <boxGeometry args={[0.3, 10, 0.2]} />
          <meshStandardMaterial color="#181b1e" roughness={0.8} metalness={0.2} />
        </mesh>
        <mesh position={[5.5, 0, 0.1]} receiveShadow>
          <boxGeometry args={[0.3, 10, 0.2]} />
          <meshStandardMaterial color="#181b1e" roughness={0.8} metalness={0.2} />
        </mesh>
        <mesh position={[-11, 0, 0.1]} receiveShadow>
          <boxGeometry args={[0.3, 10, 0.2]} />
          <meshStandardMaterial color="#14171a" roughness={0.85} metalness={0.2} />
        </mesh>
        <mesh position={[11, 0, 0.1]} receiveShadow>
          <boxGeometry args={[0.3, 10, 0.2]} />
          <meshStandardMaterial color="#14171a" roughness={0.85} metalness={0.2} />
        </mesh>
      </group>

      {/* Layer 3: Far Background Architectural Depth */}
      <mesh position={[0, 6, -15]}>
        <planeGeometry args={[60, 16]} />
        <meshBasicMaterial color="#07090a" />
      </mesh>

      {/* Ceiling Architectural Girders / Soft Geometry */}
      <group position={[0, 6.5, 0]}>
        <mesh position={[0, 0, -2]} rotation={[0, 0, Math.PI / 2]}>
          <boxGeometry args={[0.2, 24, 0.3]} />
          <meshStandardMaterial color="#111315" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0, 2]} rotation={[0, 0, Math.PI / 2]}>
          <boxGeometry args={[0.2, 24, 0.3]} />
          <meshStandardMaterial color="#111315" roughness={0.9} />
        </mesh>
      </group>

      <Effects />
    </>
  );
}
