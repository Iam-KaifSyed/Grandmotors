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

  useFrame(() => {
    const frame = getFrame();
    if (!frame) return;

    if (ambientRef.current) ambientRef.current.intensity = (frame.values['light.ambient'] ?? 0) * Math.PI * 0.5;
    // Overhead cinematic key
    if (keyRef.current) keyRef.current.intensity = (frame.values['light.key'] ?? 0) * Math.PI * 18;
    // Headlamp hot spots (reduced substantially to avoid giant white pool)
    if (headlampsRef.current) headlampsRef.current.intensity = (frame.values['light.headlamps'] ?? 0) * Math.PI * 3.0;
    // Subtle rim / environment fill
    if (floorRef.current) floorRef.current.intensity = (frame.values['light.floor'] ?? 0) * Math.PI * 10;
  });

  return (
    <>
      <color attach="background" args={['#020202']} />
      
      {/* High density fog for atmospheric dark haze - pushes background to black softly */}
      <fog attach="fog" args={['#020202', 4, 15]} />

      {/* Cinematic Studio HDRI to give the black paint and carbon fiber realistic, crisp reflections */}
      <DreiEnvironment preset="studio" environmentIntensity={0.6} />

      <ambientLight ref={ambientRef} color="#ffffff" intensity={0} />

      {/* Cinematic hard overhead cool key light - highlights the curves and carbon fiber */}
      <pointLight 
        ref={keyRef} 
        color="#ffffff" 
        position={[0, 4, 1]} 
        distance={20} 
        decay={1.5}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0005} // Tweak to reduce shadow acne on the car body
      >
      </pointLight>

      {/* Rim light - separating the dark car from the dark background */}
      <pointLight 
        ref={floorRef} 
        color="#90b0d0" 
        position={[-3, 1.5, -4]} 
        distance={15} 
        decay={1.5} 
      />

      {/* Front fill light - soft, controlled studio lighting to reveal front aero */}
      <spotLight
        ref={headlampsRef}
        color="#e6f2ff"
        position={[0, 1.5, 4.5]}
        angle={Math.PI / 4}
        penumbra={1.0}
        distance={12}
        decay={2.0}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0001}
      />

      {/* Dark/wet concrete floor */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <MeshReflectorMaterial
          blur={[400, 100]}
          resolution={1024}
          mixBlur={2.5}
          mixStrength={4}
          roughness={0.7}
          depthScale={1.2}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#050505"
          metalness={0.5}
          mirror={0.5}
        />
      </mesh>

      <Effects />
    </>
  );
}
