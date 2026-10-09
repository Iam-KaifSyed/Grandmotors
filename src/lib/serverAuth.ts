import { getAppEnv } from './env';

export type AdminEnv = { ADMIN_API_KEY?: string; ADMIN_SECRET?: string; [key: string]: any };

/** Admin session lifetime: 8 hours. After this, the session is treated as expired. */
export const ADMIN_SESSION_MAX_AGE_MS = 8 * 60 * 60 * 1000;

/**
 * Resolves the configured admin secret from the environment.
 * Returns null when no key is provisioned (admin access stays locked down by default).
 */
export function getConfiguredAdminKey(env?: AdminEnv): string | null {
  const resolvedEnv = env !== undefined ? env : getAppEnv();
  const configuredKey = resolvedEnv?.ADMIN_API_KEY || resolvedEnv?.ADMIN_SECRET;
  if (!configuredKey || typeof configuredKey !== 'string' || configuredKey.trim().length === 0) {
    return null;
  }
  return configuredKey.trim();
}

/**
 * Constant-time string comparison to avoid leaking match position via timing.
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  // Compare against a fixed-length derived value so length differences don't short-circuit.
  const len = Math.max(a.length, b.length);
  let mismatch = a.length === b.length ? 0 : 1;
  for (let i = 0; i < len; i++) {
    const ca = a.charCodeAt(i) || 0;
    const cb = b.charCodeAt(i) || 0;
    mismatch |= ca ^ cb;
  }
  return mismatch === 0;
}

/**
 * Server-side admin authorization check for machine/API clients (curl, tooling).
 * Validates request headers against server environment secrets (ADMIN_API_KEY or ADMIN_SECRET).
 * Browser logins use session-based auth instead (see verifyAdminPassword / middleware).
 */
export function isAuthorizedAdmin(request: Request, env?: AdminEnv): boolean {
  const configuredKey = getConfiguredAdminKey(env);
  if (!configuredKey) {
    // Admin access is locked down by default until an admin key is securely provisioned in the environment
    return false;
  }

  // Check Bearer Token in Authorization header
  const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');
  if (authHeader) {
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (match && timingSafeEqual(match[1].trim(), configuredKey)) {
      return true;
    }
  }

  // Check X-Admin-Key header
  const customHeader = request.headers.get('x-admin-key') || request.headers.get('X-Admin-Key');
  if (customHeader && timingSafeEqual(customHeader.trim(), configuredKey)) {
    return true;
  }

  return false;
}

/**
 * Verifies a submitted admin password (from the browser login form) against the
 * configured server secret. The secret never leaves the server; only the result
 * (and subsequently a session flag) is used.
 */
export function verifyAdminPassword(password: unknown, env?: AdminEnv): boolean {
  const configuredKey = getConfiguredAdminKey(env);
  if (!configuredKey) return false;
  if (typeof password !== 'string' || password.length === 0) return false;
  return timingSafeEqual(password, configuredKey);
}

/**
 * Returns true when the given session data represents a valid, non-expired admin session.
 */
export function isValidAdminSession(
  data: { admin?: boolean; adminSince?: number } | null | undefined,
  now: number = Date.now()
): boolean {
  if (!data || data.admin !== true) return false;
  const since = typeof data.adminSince === 'number' ? data.adminSince : 0;
  if (!since) return false;
  return now - since < ADMIN_SESSION_MAX_AGE_MS;
}
