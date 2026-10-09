export const prerender = false;
import type { APIRoute } from 'astro';
import { normalizeBooking } from '../../../lib/bookingStore';

export const GET: APIRoute = async ({ locals }) => {
  try {
    const db = locals.runtime.env.DB;
    const { results } = await db.prepare('SELECT * FROM bookings ORDER BY createdAt DESC').all();
    
    // Parse the results
    const mapped = results.map((row: any) => {
      return {
        id: row.id,
        bookingId: row.id,
        customerName: row.customerName,
        fullName: row.customerName,
        phoneNumber: row.phoneNumber,
        phone: row.phoneNumber,
        email: row.email,
        vehicleMake: row.vehicleMake,
        vehicleModel: row.vehicleModel,
        vehicle: `${row.vehicleMake} ${row.vehicleModel}`.trim(),
        registrationNumber: row.registrationNumber,
        serviceCategory: row.serviceCategory,
        specificService: row.specificService,
        preferredDate: row.preferredDate,
        requestedDate: row.preferredDate,
        preferredTime: row.preferredTime,
        requestedTime: row.preferredTime,
        status: row.status,
        additionalMessage: row.additionalMessage,
        createdAt: row.createdAt
      };
    });

    return new Response(JSON.stringify(mapped), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Failed to list bookings:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const db = locals.runtime.env.DB;
    const body = await request.json();
    
    const id = body.id || `GM-${Math.floor(100000 + Math.random() * 900000)}`;
    const normalized = normalizeBooking({...body, id});

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

    return new Response(JSON.stringify({ success: true, id: normalized.id }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Failed to create booking:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
