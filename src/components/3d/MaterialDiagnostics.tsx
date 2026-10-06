import { useEffect, useState } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

export function MaterialDiagnostics() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handleEvent = (e: CustomEvent) => setShow(e.detail);
    window.addEventListener('toggle-mat-diagnostics', handleEvent as EventListener);
    return () => window.removeEventListener('toggle-mat-diagnostics', handleEvent as EventListener);
  }, []);

  if (!show || typeof window === 'undefined') return null;

  return <MatDiagInner />;
}

function MatDiagInner() {
  const { scene } = useGLTF('/models/amg-one.glb');
  const logs: any[] = [];
  scene.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      const mat = mesh.material as THREE.Material;
      logs.push({
        mesh: mesh.name,
        material: mat.name,
        opacity: mat.opacity,
        transparent: mat.transparent,
        transmission: (mat as any).transmission !== undefined ? (mat as any).transmission : 0,
        type: mat.type,
      });
    }
  });

  return (
    <div className="fixed top-20 right-10 bg-black/80 text-white font-mono text-xs p-4 rounded max-h-[70vh] overflow-y-auto pointer-events-auto z-50">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr>
            <th className="pr-2 pb-2 border-b border-gray-600">Mesh</th>
            <th className="pr-2 pb-2 border-b border-gray-600">Material</th>
            <th className="pr-2 pb-2 border-b border-gray-600">Transparent</th>
            <th className="pr-2 pb-2 border-b border-gray-600">Opacity</th>
            <th className="pr-2 pb-2 border-b border-gray-600">Transm.</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((L, i) => (
            <tr key={`${L.mesh}-${i}`}>
              <td className="pr-4 py-1 border-b border-gray-800">{L.mesh}</td>
              <td className="pr-4 py-1 border-b border-gray-800 text-gray-400">{L.material}</td>
              <td className={`pr-4 py-1 border-b border-gray-800 ${L.transparent ? 'text-green-400' : 'text-red-400'}`}>{L.transparent ? 'YES' : 'NO'}</td>
              <td className="pr-4 py-1 border-b border-gray-800">{L.opacity.toFixed(2)}</td>
              <td className="py-1 border-b border-gray-800">{L.transmission.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
