export const prerender = false;
import type { APIRoute } from 'astro';
import { verifyAdminPassword, getConfiguredAdminKey } from '../../../lib/serverAuth';
import { getAppEnv } from '../../../lib/env';

/**
 * POST /api/admin/login
 * Body: { password: string }
 *
 * Verifies the submitted password against the server-side admin secret and, on
 * success, establishes a server-side admin session (stored in Cloudflare KV).
 * The secret is never sent to the browser; only an opaque session cookie is set.
 */
export const POST: APIRoute = async ({ request, locals, session }) => {
  const env = getAppEnv(locals);

  // If no admin key is provisioned, admin login is disabled by default.
  if (!getConfiguredAdminKey(env)) {
    return new Response(
      JSON.stringify({ error: 'Admin access is not configured on this server.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (!session) {
    return new Response(
      JSON.stringify({ error: 'Session storage is unavailable in this runtime.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid request body.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const password = body?.password;

  if (!verifyAdminPassword(password, env)) {
    // Generic message — do not reveal whether a key is set or how it failed.
    return new Response(
      JSON.stringify({ error: 'Invalid credentials.' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Rotate the session id on privilege change to prevent session fixation.
  try {
    session.regenerate();
  } catch {
    /* some runtimes may not support regenerate; proceed */
  }
  session.set('admin', true);
  session.set('adminSince', Date.now());

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
