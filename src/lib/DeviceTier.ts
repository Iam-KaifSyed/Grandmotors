export type Tier = 'low' | 'mid' | 'high';

let tier: Tier | null = null;
let isMobile = false;

export async function detectTier(): Promise<Tier> {
  if (tier) return tier;

  if (typeof window === 'undefined') return 'high'; // SSR fallback

  isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );

  // Dynamic import avoids SSR CJS/ESM issues with detect-gpu
  const detectGpuPkg = await import('detect-gpu');
  const getFn = detectGpuPkg.getGPUTier || (detectGpuPkg as any).default?.getGPUTier;
  
  let gpuTier = 1;
  if (getFn) {
    const gpu = await getFn();
    gpuTier = gpu?.tier ?? 1;
  }

  if (gpuTier <= 1 || isMobile) {
    tier = 'low';
  } else if (gpuTier === 2) {
    tier = 'mid';
  } else {
    tier = 'high';
  }

  return tier;
}

export function getTier(): Tier {
  return tier ?? 'mid';
}

export function getIsMobile(): boolean {
  return isMobile;
}
