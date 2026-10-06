import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { MeshReflectorMaterial, Environment as DreiEnvironment } from '@react-three/drei';
import { getFrame } from '../../lib/directorState';

export function Environment() {
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const keyRef = useRef<THREE.PointLight>(null);
  const headlampsRef = useRef<THREE.PointLight>(null);

  useFrame(() => {
    const frame = getFrame();
    if (!frame) return;

    if (ambientRef.current) ambientRef.current.intensity = (frame.values['light.ambient'] ?? 0) * Math.PI * 0.5;
    if (keyRef.current) keyRef.current.intensity = (frame.values['light.key'] ?? 0) * Math.PI * 15;
    if (headlampsRef.current) headlampsRef.current.intensity = (frame.values['light.headlamps'] ?? 0) * Math.PI * 30;
  });

  return (
    <>
      <color attach="background" args={['#020202']} />
      
      {/* Fog for atmospheric depth */}
      <fog attach="fog" args={['#020202', 5, 20]} />

      {/* Very subtle studio HDRI for realistic reflections */}
      <DreiEnvironment preset="studio" environmentIntensity={0.1} />

      <ambientLight ref={ambientRef} color="#ffffff" intensity={0} />

      {/* Cinematic overhead key light */}
      <pointLight 
        ref={keyRef} 
        color="#ffffff" 
        position={[2, 6, 2]} 
        distance={25} 
        decay={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0001}
      />

      {/* Headlamps placeholder: emits from front of car */}
      <pointLight ref={headlampsRef} color="#e6f2ff" position={[0, 0.7, 3]} distance={15} decay={1.5} />

      {/* Dark/wet concrete floor */}
      <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <MeshReflectorMaterial
          blur={[400, 100]}
          resolution={1024}
          mixBlur={1}
          mixStrength={15}
          roughness={0.4}
          depthScale={1.2}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#050505"
          metalness={0.2}
          mirror={1}
        />
      </mesh>
    </>
  );
}
