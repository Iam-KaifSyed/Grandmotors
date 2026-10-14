export type Tier = 'low' | 'mid' | 'high';

let tier: Tier | null = null;
let isMobile = false;

export async function detectTier(): Promise<Tier> {
  if (tier) return tier;

  if (typeof window === 'undefined') return 'high'; // SSR fallback

  try {
    isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    );

    if (isMobile) {
      tier = 'low';
      return tier;
    }

    // Dynamic import with timeout fallback (max 1000ms) to ensure Canvas is never blocked
    const detectPromise = (async () => {
      const detectGpuPkg = await import('detect-gpu');
      const getFn = detectGpuPkg.getGPUTier || (detectGpuPkg as any).default?.getGPUTier;
      if (getFn) {
        const gpu = await getFn();
        return gpu?.tier ?? 1;
      }
      return 1;
    })();

    const timeoutPromise = new Promise<number>((resolve) => {
      setTimeout(() => resolve(2), 1000);
    });

    const gpuTier = await Promise.race([detectPromise, timeoutPromise]);

    if (gpuTier <= 1) {
      tier = 'low';
    } else if (gpuTier === 2) {
      tier = 'mid';
    } else {
      tier = 'high';
    }
  } catch {
    tier = isMobile ? 'low' : 'mid';
  }

  return tier;
}

export function getTier(): Tier {
  return tier ?? 'mid';
}

export function getIsMobile(): boolean {
  return isMobile;
}
