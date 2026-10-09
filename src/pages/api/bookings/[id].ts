export const prerender = false;
import type { APIRoute } from 'astro';
import { isAuthorizedAdmin } from '../../../lib/serverAuth';
import { getAppEnv, getDatabase } from '../../../lib/env';

const ALLOWED_STATUSES = ['Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'] as const;
const ID_FORMAT_REGEX = /^(?:GM-)?[0-9A-Z]{4,12}$/i;

export const GET: APIRoute = async ({ params, request, locals }) => {
  try {
    const env = getAppEnv(locals);
    const db = getDatabase(locals, env);
    if (!db) {
      return new Response(JSON.stringify({ error: 'Database binding DB is not available in runtime environment' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { id } = params;
    if (!id || !ID_FORMAT_REGEX.test(id.trim())) {
      return new Response(JSON.stringify({ error: 'Invalid or missing Booking ID format.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const rawId = id.trim().toUpperCase();
    const withPrefix = rawId.startsWith('GM-') ? rawId : `GM-${rawId}`;
    const withoutPrefix = rawId.replace(/^GM-?/i, '');

    const { results } = await db.prepare('SELECT * FROM bookings WHERE id = ? OR id = ? OR id = ?')
      .bind(rawId, withPrefix, withoutPrefix)
      .all();

    if (!results || results.length === 0) {
      return new Response(JSON.stringify({ error: `Booking not found for ID "${rawId}".` }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const row = results[0];
    const isAdmin = isAuthorizedAdmin(request, env);

    const doorstepLatitude =
      row.doorstepLatitude !== null && row.doorstepLatitude !== undefined && row.doorstepLatitude !== ''
        ? Number(row.doorstepLatitude)
        : null;
    const doorstepLongitude =
      row.doorstepLongitude !== null && row.doorstepLongitude !== undefined && row.doorstepLongitude !== ''
        ? Number(row.doorstepLongitude)
        : null;

    let doorstepMapUrl = row.doorstepMapUrl || '';
    if (!doorstepMapUrl && doorstepLatitude !== null && doorstepLongitude !== null) {
      doorstepMapUrl = `https://www.google.com/maps?q=${doorstepLatitude},${doorstepLongitude}`;
    }

    // Public tracking response: omit sensitive PII (phone number, email, internal messages)
    const mapped = {
      id: row.id,
      bookingId: row.id,
      fullName: row.customerName,
      customerName: row.customerName,
      // Only include PII if administrator
      phoneNumber: isAdmin ? row.phoneNumber : undefined,
      phone: isAdmin ? row.phoneNumber : undefined,
      email: isAdmin ? (row.email || '') : undefined,
      vehicleMake: row.vehicleMake,
      vehicleModel: row.vehicleModel,
      vehicle: `${row.vehicleMake} ${row.vehicleModel}`.trim(),
      registrationNumber: row.registrationNumber,
      serviceCategory: row.serviceCategory,
      specificService: row.specificService || '',
      preferredDate: row.preferredDate,
      requestedDate: row.preferredDate,
      preferredTime: row.preferredTime,
      requestedTime: row.preferredTime,
      status: row.status,
      serviceLocation: row.serviceLocation || 'Workshop Visit',
      doorstepHouseFlat: row.doorstepHouseFlat || '',
      doorstepStreetLocality: row.doorstepStreetLocality || '',
      doorstepCity: row.doorstepCity || '',
      doorstepPincode: row.doorstepPincode || '',
      doorstepLatitude,
      doorstepLongitude,
      doorstepMapUrl,
      additionalMessage: isAdmin ? (row.additionalMessage || '') : undefined,
      createdAt: row.createdAt
    };

    return new Response(JSON.stringify(mapped), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Failed to get booking by ID:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const PATCH: APIRoute = async ({ params, request, locals }) => {
  try {
    const env = getAppEnv(locals);

    // Priority 2: Admin authorization required to change booking status
    if (!isAuthorizedAdmin(request, env)) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Admin authentication required to modify booking status.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const db = getDatabase(locals, env);
    if (!db) {
      return new Response(JSON.stringify({ error: 'Database binding DB is not available in runtime environment' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { id } = params;
    if (!id || !ID_FORMAT_REGEX.test(id.trim())) {
      return new Response(JSON.stringify({ error: 'Invalid or missing Booking ID format.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON request body.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!body?.status || !ALLOWED_STATUSES.includes(body.status)) {
      return new Response(JSON.stringify({
        error: `Invalid status. Must be one of: ${ALLOWED_STATUSES.join(', ')}`
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const rawId = id.trim().toUpperCase();
    const withPrefix = rawId.startsWith('GM-') ? rawId : `GM-${rawId}`;
    const withoutPrefix = rawId.replace(/^GM-?/i, '');

    const updateRes = await db.prepare('UPDATE bookings SET status = ? WHERE id = ? OR id = ? OR id = ?')
      .bind(body.status, rawId, withPrefix, withoutPrefix)
      .run();

    return new Response(JSON.stringify({ success: true, status: body.status, updated: updateRes }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Failed to update booking status:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
