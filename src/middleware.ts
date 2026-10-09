import { defineMiddleware } from 'astro:middleware';
import { isValidAdminSession } from './lib/serverAuth';

/**
 * Server-side gate for the admin area.
 *
 * - Protects every `/admin/*` page (except the login page itself) and every
 *   `/api/admin/*` endpoint (except the login/logout auth endpoints).
 * - Authentication state lives in the server-side session (Cloudflare KV), never
 *   in the browser. The browser only ever holds an opaque session cookie.
 * - Unauthenticated page requests are redirected to /admin/login; unauthenticated
 *   API requests receive 401 JSON. This is enforced here, independent of the UI.
 */
export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  const isAdminPage = pathname === '/admin' || pathname.startsWith('/admin/');
  const isAdminApi = pathname.startsWith('/api/admin/');

  if (!isAdminPage && !isAdminApi) {
    return next();
  }

  // Public endpoints within the admin area: the login page and the auth endpoints.
  const isLoginPage = pathname === '/admin/login';
  const isAuthEndpoint = pathname === '/api/admin/login' || pathname === '/api/admin/logout';
  if (isLoginPage || isAuthEndpoint) {
    return next();
  }

  // Everything else under /admin or /api/admin requires a valid admin session.
  let sessionData: { admin?: boolean; adminSince?: number } | null = null;
  try {
    const admin = await context.session?.get('admin');
    const adminSince = await context.session?.get('adminSince');
    sessionData = { admin, adminSince };
  } catch {
    sessionData = null;
  }

  if (isValidAdminSession(sessionData)) {
    return next();
  }

  // Not authenticated (or session expired).
  if (isAdminApi) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized: admin session required.' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Clear any stale/expired session before bouncing to login.
  try {
    context.session?.destroy();
  } catch {
    /* ignore */
  }
  return context.redirect('/admin/login', 302);
});
