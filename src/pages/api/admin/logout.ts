export const prerender = false;
import type { APIRoute } from 'astro';

/**
 * POST /api/admin/logout
 * Destroys the current admin session (and its session cookie).
 */
export const POST: APIRoute = async ({ session }) => {
  try {
    session?.destroy();
  } catch {
    /* ignore — treat as already logged out */
  }
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
