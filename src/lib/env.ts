import { getLocalD1Database } from './localDb';

export interface AppEnv {
  DB?: any;
  ADMIN_API_KEY?: string;
  ADMIN_SECRET?: string;
  [key: string]: any;
}

// Safely obtain Cloudflare Workers env if running inside workerd runtime
let cfEnv: any = undefined;
try {
  const cf = await import('cloudflare:workers');
  cfEnv = cf?.env;
} catch {
  cfEnv = undefined;
}

/**
 * Safely extracts custom/test env from locals without triggering
 * Astro v6's throwing getter on locals.runtime.env.
 */
function extractEnvFromLocals(locals?: any): AppEnv | undefined {
  if (!locals || typeof locals !== 'object') return undefined;

  // Direct env object (e.g. locals.env)
  if (locals.env && typeof locals.env === 'object') {
    return locals.env;
  }

  // If locals has a runtime property (used in test mocks or custom locals)
  if (locals.runtime && typeof locals.runtime === 'object') {
    try {
      const desc = Object.getOwnPropertyDescriptor(locals.runtime, 'env');
      // If it has a getter, it's Astro v6 throwing getter; don't invoke it
      if (desc && typeof desc.get === 'function') {
        return undefined;
      }
      return locals.runtime.env;
    } catch {
      return undefined;
    }
  }

  return undefined;
}

/**
 * Safely resolves the runtime environment across Cloudflare Workers,
 * local Astro development (Node/Vite), and test environments.
 */
export function getAppEnv(localsOrEnv?: any, explicitEnv?: AppEnv): AppEnv {
  const fromLocals = extractEnvFromLocals(localsOrEnv);
  const passedEnv = fromLocals || (localsOrEnv && !localsOrEnv.runtime && !localsOrEnv.cfContext ? localsOrEnv : undefined);

  const procEnv = typeof process !== 'undefined' && process.env ? process.env : {};
  const metaEnv = typeof import.meta !== 'undefined' && (import.meta as any).env ? (import.meta as any).env : {};

  const merged: AppEnv = {
    ...procEnv,
    ...metaEnv,
    ...(cfEnv || {}),
    ...(passedEnv && typeof passedEnv === 'object' ? passedEnv : {}),
    ...(explicitEnv && typeof explicitEnv === 'object' ? explicitEnv : {}),
  };

  // Priority for explicit DB (e.g. test mocks)
  if (passedEnv?.DB) {
    merged.DB = passedEnv.DB;
  } else if (explicitEnv?.DB) {
    merged.DB = explicitEnv.DB;
  } else if (!merged.DB) {
    const localDb = getLocalD1Database();
    if (localDb) {
      merged.DB = localDb;
    }
  }

  return merged;
}

/**
 * Resolves the D1 Database binding from the environment, with support for
 * both Cloudflare Workers runtime and local development environments.
 */
export function getDatabase(localsOrEnv?: any, explicitEnv?: AppEnv): any {
  const env = getAppEnv(localsOrEnv, explicitEnv);
  return env?.DB;
}
