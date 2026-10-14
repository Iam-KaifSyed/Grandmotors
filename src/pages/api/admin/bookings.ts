export const prerender = false;
import type { APIRoute } from 'astro';
import { mapBookingRowForAdmin } from '../../../lib/bookingMapper';
import { isValidAdminSession, isAuthorizedAdmin } from '../../../lib/serverAuth';
import { getAppEnv, getDatabase } from '../../../lib/env';

/**
 * GET /api/admin/bookings
 * Returns the full list of bookings (including PII) for authenticated admins.
 *
 * Authentication (defense in depth — middleware also guards this path):
 *  - a valid admin session (browser login), OR
 *  - a valid admin header key (machine/API clients).
 */
export const GET: APIRoute = async ({ request, locals, session }) => {
  const env = getAppEnv(locals);

  // Defense in depth: re-verify auth inside the handler, don't trust routing alone.
  let authed = isAuthorizedAdmin(request, env);
  if (!authed) {
    try {
      const admin = await session?.get('admin');
      const adminSince = await session?.get('adminSince');
      authed = isValidAdminSession({ admin, adminSince });
    } catch {
      authed = false;
    }
  }
  if (!authed) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized: admin session required.' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const db = getDatabase(locals, env);
  if (!db) {
    return new Response(
      JSON.stringify({ error: 'Database binding DB is not available in runtime environment.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { results } = await db.prepare('SELECT * FROM bookings ORDER BY createdAt DESC').all();
    let mapped = (results || []).map(mapBookingRowForAdmin);

    try {
      const url = new URL(request.url);
      const archivedParam = url.searchParams.get('archived');
      if (archivedParam === 'true') {
        mapped = mapped.filter((b: any) => b.isArchived);
      } else if (archivedParam === 'false') {
        mapped = mapped.filter((b: any) => !b.isArchived);
      }
    } catch {
      // Ignore URL parsing errors
    }

    return new Response(JSON.stringify({ bookings: mapped }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Failed to list admin bookings:', error?.message || error);
    return new Response(
      JSON.stringify({ error: 'Failed to load bookings.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
