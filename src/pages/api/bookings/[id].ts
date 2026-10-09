export const prerender = false;
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ params, locals }) => {
  try {
    const db = locals.runtime.env.DB;
    const { id } = params;
    
    if (!id) {
      return new Response(JSON.stringify({ error: 'Missing ID' }), { status: 400 });
    }

    const { results } = await db.prepare('SELECT * FROM bookings WHERE id = ?').bind(id.toUpperCase()).all();

    if (!results || results.length === 0) {
      return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
    }
    
    const row = results[0];
    const mapped = {
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

    return new Response(JSON.stringify(mapped), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const PATCH: APIRoute = async ({ params, request, locals }) => {
  try {
    const db = locals.runtime.env.DB;
    const { id } = params;
    
    if (!id) {
      return new Response(JSON.stringify({ error: 'Missing ID' }), { status: 400 });
    }

    const body = await request.json();
    if (!body.status) {
       return new Response(JSON.stringify({ error: 'Status is required' }), { status: 400 });
    }

    await db.prepare('UPDATE bookings SET status = ? WHERE id = ?')
      .bind(body.status, id.toUpperCase())
      .run();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
