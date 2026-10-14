export const prerender = false;
import type { APIRoute } from 'astro';
import { mapBookingRowForAdmin } from '../../../../lib/bookingMapper';
import { isValidAdminSession, isAuthorizedAdmin } from '../../../../lib/serverAuth';
import { getAppEnv, getDatabase } from '../../../../lib/env';
import { recordAuditEvent } from '../../../../lib/auditLog';

const ALLOWED_STATUSES = ['Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'] as const;
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

/** GET /api/admin/bookings/:id — full record (PII included) for authenticated admins. */
export const GET: APIRoute = async ({ params, request, locals, session }) => {
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
    const { results } = await db
      .prepare('SELECT * FROM bookings WHERE id = ? OR id = ? OR id = ?')
      .bind(rawId, withPrefix, withoutPrefix)
      .all();

    if (!results || results.length === 0) {
      return new Response(JSON.stringify({ error: `Booking not found for ID "${rawId}".` }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(mapBookingRowForAdmin(results[0])), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Failed to get admin booking by ID:', error?.message || error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

/** PATCH /api/admin/bookings/:id — update status or archive/restore (authenticated admins only). */
export const PATCH: APIRoute = async ({ params, request, locals, session }) => {
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

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON request body.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const hasStatusUpdate = body?.status !== undefined;
  const hasArchiveUpdate =
    body?.isArchived !== undefined ||
    body?.action === 'archive' ||
    body?.action === 'restore';

  if (!hasStatusUpdate && !hasArchiveUpdate) {
    return new Response(
      JSON.stringify({
        error: `Invalid request. Please specify a valid status (${ALLOWED_STATUSES.join(', ')}) or archive action.`,
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (hasStatusUpdate && !ALLOWED_STATUSES.includes(body.status)) {
    return new Response(
      JSON.stringify({ error: `Invalid status. Must be one of: ${ALLOWED_STATUSES.join(', ')}` }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { rawId, withPrefix, withoutPrefix } = idVariants(id);

    // Confirm the booking exists first so we can return a proper 404.
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
    const updates: Record<string, any> = {};

    if (hasStatusUpdate) {
      await db
        .prepare('UPDATE bookings SET status = ? WHERE id = ? OR id = ? OR id = ?')
        .bind(body.status, rawId, withPrefix, withoutPrefix)
        .run();
      updates.status = body.status;

      await recordAuditEvent(db, {
        entityType: 'booking',
        entityId: rawId,
        action: 'update_status',
        actorAdmin: 'admin',
        summary: { id: rawId, previousStatus: currentBooking.status, newStatus: body.status },
      });
    }

    if (hasArchiveUpdate) {
      const shouldArchive =
        body.isArchived !== undefined ? Boolean(body.isArchived) : body.action === 'archive';
      const now = new Date().toISOString();
      const archivedVal = shouldArchive ? 1 : 0;
      const archivedAtVal = shouldArchive ? now : null;

      const performArchiveUpdate = async () => {
        return await db
          .prepare('UPDATE bookings SET isArchived = ?, archivedAt = ? WHERE id = ? OR id = ? OR id = ?')
          .bind(archivedVal, archivedAtVal, rawId, withPrefix, withoutPrefix)
          .run();
      };

      try {
        await performArchiveUpdate();
      } catch (archErr: any) {
        const msg = String(archErr?.message || '');
        if (msg.includes('no column named isArchived') || msg.includes('no column named archivedAt')) {
          try {
            await db.prepare('ALTER TABLE bookings ADD COLUMN isArchived INTEGER DEFAULT 0').run();
          } catch {}
          try {
            await db.prepare('ALTER TABLE bookings ADD COLUMN archivedAt DATETIME').run();
          } catch {}
          await performArchiveUpdate();
        } else {
          throw archErr;
        }
      }

      updates.isArchived = shouldArchive;
      updates.archivedAt = archivedAtVal;

      await recordAuditEvent(db, {
        entityType: 'booking',
        entityId: rawId,
        action: shouldArchive ? 'archive' : 'restore',
        actorAdmin: 'admin',
        summary: {
          id: rawId,
          isArchived: shouldArchive,
          archivedAt: archivedAtVal,
          customerName: currentBooking.customerName,
          vehicle: `${currentBooking.vehicleMake || ''} ${currentBooking.vehicleModel || ''}`.trim(),
        },
      });
    }

    return new Response(JSON.stringify({ success: true, id: rawId, ...updates }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Failed to update admin booking status:', error?.message || error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

/** DELETE /api/admin/bookings/:id — permanently delete a booking (authenticated admins only). */
export const DELETE: APIRoute = async ({ params, request, locals, session }) => {
  const env = getAppEnv(locals);

  if (!(await isAdminRequest(request, env, session))) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized: admin session required to delete bookings.' }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
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

    // Confirm the booking exists first so we can return a proper 404.
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

    const bookingRow = existing.results[0];

    // Audit log prior to permanent deletion to maintain audit trail
    await recordAuditEvent(db, {
      entityType: 'booking',
      entityId: rawId,
      action: 'delete',
      actorAdmin: 'admin',
      summary: {
        id: bookingRow.id,
        customerName: bookingRow.customerName,
        phoneNumber: bookingRow.phoneNumber,
        registrationNumber: bookingRow.registrationNumber,
        serviceCategory: bookingRow.serviceCategory,
        status: bookingRow.status,
        createdAt: bookingRow.createdAt,
      },
    });

    await db
      .prepare('DELETE FROM bookings WHERE id = ? OR id = ? OR id = ?')
      .bind(rawId, withPrefix, withoutPrefix)
      .run();

    return new Response(
      JSON.stringify({
        success: true,
        id: rawId,
        message: `Booking ${rawId} has been permanently deleted.`,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Failed to permanently delete booking:', error?.message || error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
