/**
 * Server-side admin authorization check for Cloudflare Workers / Astro SSR.
 * Validates request headers against server environment secrets (ADMIN_API_KEY or ADMIN_SECRET).
 */
export function isAuthorizedAdmin(request: Request, env?: { ADMIN_API_KEY?: string; ADMIN_SECRET?: string }): boolean {
  const configuredKey = env?.ADMIN_API_KEY || env?.ADMIN_SECRET;
  if (!configuredKey || typeof configuredKey !== 'string' || configuredKey.trim().length === 0) {
    // Admin access is locked down by default until an admin key is securely provisioned in the environment
    return false;
  }

  // Check Bearer Token in Authorization header
  const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');
  if (authHeader) {
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (match && match[1].trim() === configuredKey.trim()) {
      return true;
    }
  }

  // Check X-Admin-Key header
  const customHeader = request.headers.get('x-admin-key') || request.headers.get('X-Admin-Key');
  if (customHeader && customHeader.trim() === configuredKey.trim()) {
    return true;
  }

  return false;
}
