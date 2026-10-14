export const prerender = false;
import type { APIRoute } from 'astro';
import { isValidAdminSession, isAuthorizedAdmin } from '../../../../../lib/serverAuth';
import { getAppEnv, getDatabase } from '../../../../../lib/env';
import { recordAuditEvent } from '../../../../../lib/auditLog';

const ID_FORMAT_REGEX = /^(?:GM-)?[0-9A-Z]{4,12}$/i;

async function isAdminRequest(
  request: Request,
  env: any,
  session: any
): Promise<boolean> {
  if (isAuthorizedAdmin(request, env)) return true;
  try {
    const admin = await session?.get('admin');
    const adminSince = await session?.get('adminSince');
    return isValidAdminSession({ admin, adminSince });
  } catch {
    return false;
  }
}

function idVariants(id: string) {
  const rawId = id.trim().toUpperCase();
  const withPrefix = rawId.startsWith('GM-') ? rawId : `GM-${rawId}`;
  const withoutPrefix = rawId.replace(/^GM-?/i, '');
  return { rawId, withPrefix, withoutPrefix };
}

/** POST /api/admin/bookings/:id/archive — archives a booking (authenticated admins only). */
export const POST: APIRoute = async ({ params, request, locals, session }) => {
  const env = getAppEnv(locals);

  if (!(await isAdminRequest(request, env, session))) {
    return new Response(JSON.stringify({ error: 'Unauthorized: admin session required.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const db = getDatabase(locals, env);
  if (!db) {
    return new Response(JSON.stringify({ error: 'Database binding DB is not available.' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { id } = params;
  if (!id || !ID_FORMAT_REGEX.test(id.trim())) {
    return new Response(JSON.stringify({ error: 'Invalid or missing Booking ID format.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { rawId, withPrefix, withoutPrefix } = idVariants(id);

    // Confirm booking exists
    const existing = await db
      .prepare('SELECT * FROM bookings WHERE id = ? OR id = ? OR id = ?')
      .bind(rawId, withPrefix, withoutPrefix)
      .all();
    if (!existing.results || existing.results.length === 0) {
      return new Response(JSON.stringify({ error: `Booking not found for ID "${rawId}".` }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const currentBooking = existing.results[0];
    const now = new Date().toISOString();

    const performArchive = async () => {
      return await db
        .prepare('UPDATE bookings SET isArchived = 1, archivedAt = ? WHERE id = ? OR id = ? OR id = ?')
        .bind(now, rawId, withPrefix, withoutPrefix)
        .run();
    };

    try {
      await performArchive();
    } catch (err: any) {
      const msg = String(err?.message || '');
      if (msg.includes('no column named isArchived') || msg.includes('no column named archivedAt')) {
        try {
          await db.prepare('ALTER TABLE bookings ADD COLUMN isArchived INTEGER DEFAULT 0').run();
        } catch {}
        try {
          await db.prepare('ALTER TABLE bookings ADD COLUMN archivedAt DATETIME').run();
        } catch {}
        await performArchive();
      } else {
        throw err;
      }
    }

    await recordAuditEvent(db, {
      entityType: 'booking',
      entityId: rawId,
      action: 'archive',
      actorAdmin: 'admin',
      summary: {
        id: rawId,
        isArchived: true,
        archivedAt: now,
        customerName: currentBooking.customerName,
        vehicle: `${currentBooking.vehicleMake || ''} ${currentBooking.vehicleModel || ''}`.trim(),
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        id: rawId,
        isArchived: true,
        archivedAt: now,
        message: `Booking ${rawId} successfully archived.`,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Failed to archive booking:', error?.message || error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
