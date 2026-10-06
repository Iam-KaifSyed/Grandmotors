import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';

export function Effects() {
  return (
    <EffectComposer>
      {/* Restrained bloom focused mostly on light emissions */}
      <Bloom
        luminanceThreshold={0.9}
        luminanceSmoothing={0.1}
        height={300}
        intensity={0.25}
        mipmapBlur
      />
      {/* Cinematic darkening of edges to draw eye to the vehicle */}
      <Vignette offset={0.5} darkness={0.6} />
    </EffectComposer>
  );
}
