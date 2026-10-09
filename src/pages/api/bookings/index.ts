export const prerender = false;
import type { APIRoute } from 'astro';
import { normalizeBooking } from '../../../lib/bookingStore';
import { isAuthorizedAdmin } from '../../../lib/serverAuth';
import { getAppEnv, getDatabase } from '../../../lib/env';

const PHONE_REGEX = /^\+?[\d\s-]{8,18}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const env = getAppEnv(locals);

    // Priority 2: Admin-only access for listing all customer records
    if (!isAuthorizedAdmin(request, env)) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Admin authentication required to list customer bookings.' }),
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

    const { results } = await db.prepare('SELECT * FROM bookings ORDER BY createdAt DESC').all();
    
    // Parse the results for admin
    const mapped = (results || []).map((row: any) => {
      return {
        id: row.id,
        bookingId: row.id,
        customerName: row.customerName,
        fullName: row.customerName,
        phoneNumber: row.phoneNumber,
        phone: row.phoneNumber,
        email: row.email || '',
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
        additionalMessage: row.additionalMessage || '',
        createdAt: row.createdAt
      };
    });

    return new Response(JSON.stringify(mapped), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Failed to list bookings:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const env = getAppEnv(locals);
    const db = getDatabase(locals, env);
    if (!db) {
      return new Response(JSON.stringify({ error: 'Database service is temporarily unavailable. Please retry shortly.' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON request payload.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!body || typeof body !== 'object') {
      return new Response(JSON.stringify({ error: 'Request body must be a valid JSON object.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const fullName = String(body.fullName || body.customerName || '').trim();
    const phoneNumber = String(body.phoneNumber || body.phone || '').trim();
    const email = String(body.email || '').trim();
    const vehicleMake = String(body.vehicleMake || '').trim();
    const vehicleModel = String(body.vehicleModel || '').trim();
    const registrationNumber = String(body.registrationNumber || '').trim().toUpperCase();
    const serviceCategory = String(body.serviceCategory || '').trim();
    const specificService = String(body.specificService || '').trim();
    const preferredDate = String(body.preferredDate || body.requestedDate || '').trim();
    const preferredTime = String(body.preferredTime || body.requestedTime || '').trim();
    const additionalMessage = String(body.additionalMessage || '').trim();

    // Field-level validations
    if (fullName.length < 2 || fullName.length > 100) {
      return new Response(JSON.stringify({ error: 'Full name is required (2-100 characters).' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!PHONE_REGEX.test(phoneNumber)) {
      return new Response(JSON.stringify({ error: 'A valid phone number is required (8-18 digits).' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (email && (email.length > 150 || !EMAIL_REGEX.test(email))) {
      return new Response(JSON.stringify({ error: 'Please enter a valid email address.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (vehicleMake.length < 1 || vehicleMake.length > 50) {
      return new Response(JSON.stringify({ error: 'Vehicle make is required (1-50 characters).' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (vehicleModel.length < 1 || vehicleModel.length > 50) {
      return new Response(JSON.stringify({ error: 'Vehicle model is required (1-50 characters).' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (registrationNumber.length < 2 || registrationNumber.length > 25) {
      return new Response(JSON.stringify({ error: 'Registration number is required (2-25 characters).' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (serviceCategory.length < 1 || serviceCategory.length > 50) {
      return new Response(JSON.stringify({ error: 'Please select a valid service category.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!DATE_REGEX.test(preferredDate)) {
      return new Response(JSON.stringify({ error: 'Preferred date must be in YYYY-MM-DD format.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (preferredTime.length < 1 || preferredTime.length > 50) {
      return new Response(JSON.stringify({ error: 'Preferred appointment time is required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (additionalMessage.length > 1000) {
      return new Response(JSON.stringify({ error: 'Additional message must not exceed 1000 characters.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Duplicate submission check: check if identical active request exists in DB
    const duplicateCheck = await db.prepare(`
      SELECT id, createdAt FROM bookings 
      WHERE phoneNumber = ? AND registrationNumber = ? AND preferredDate = ? AND serviceCategory = ? AND status != 'Cancelled'
      LIMIT 1
    `).bind(phoneNumber, registrationNumber, preferredDate, serviceCategory).all();

    if (duplicateCheck.results && duplicateCheck.results.length > 0) {
      const existing = duplicateCheck.results[0];
      return new Response(JSON.stringify({
        error: `A booking for this vehicle and date already exists (${existing.id}). Please check your tracking status.`,
        id: existing.id
      }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generate unique ID
    let uniqueId = `GM-${Math.floor(100000 + Math.random() * 900000)}`;
    for (let attempt = 0; attempt < 3; attempt++) {
      const existingId = await db.prepare('SELECT id FROM bookings WHERE id = ?').bind(uniqueId).all();
      if (!existingId.results || existingId.results.length === 0) {
        break;
      }
      uniqueId = `GM-${Math.floor(100000 + Math.random() * 900000)}`;
    }

    const normalized = normalizeBooking({
      ...body,
      id: uniqueId,
      fullName,
      phoneNumber,
      email,
      vehicleMake,
      vehicleModel,
      registrationNumber,
      serviceCategory,
      specificService,
      preferredDate,
      preferredTime,
      additionalMessage,
      status: 'Pending',
      createdAt: new Date().toISOString()
    });

    await db.prepare(`
      INSERT INTO bookings (
        id, customerName, phoneNumber, email, vehicleMake, vehicleModel, 
        registrationNumber, serviceCategory, specificService, preferredDate, 
        preferredTime, status, additionalMessage, createdAt
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
    `).bind(
      normalized.id, normalized.customerName, normalized.phoneNumber, normalized.email,
      normalized.vehicleMake, normalized.vehicleModel, normalized.registrationNumber,
      normalized.serviceCategory, normalized.specificService, normalized.preferredDate,
      normalized.preferredTime, normalized.status, normalized.additionalMessage,
      normalized.createdAt
    ).run();

    return new Response(JSON.stringify({ success: true, id: normalized.id, booking: normalized }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Failed to create booking:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
