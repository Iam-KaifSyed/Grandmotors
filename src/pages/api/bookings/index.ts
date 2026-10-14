export const prerender = false;
import type { APIRoute } from 'astro';
import { normalizeBooking, FUEL_TYPES } from '../../../lib/bookingStore';
import { isAuthorizedAdmin } from '../../../lib/serverAuth';
import { getAppEnv, getDatabase } from '../../../lib/env';

const PHONE_REGEX = /^\+?[\d\s-]{8,18}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const PINCODE_REGEX = /^[1-9][0-9]{5}$/;

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
        fuelType: row.fuelType || '',
        registrationNumber: row.registrationNumber,
        serviceCategory: row.serviceCategory,
        specificService: row.specificService || '',
        preferredDate: row.preferredDate,
        requestedDate: row.preferredDate,
        preferredTime: row.preferredTime,
        requestedTime: row.preferredTime,
        status: row.status,
        additionalMessage: row.additionalMessage || '',
        serviceLocation: row.serviceLocation || 'Workshop Visit',
        doorstepHouseFlat: row.doorstepHouseFlat || '',
        doorstepStreetLocality: row.doorstepStreetLocality || '',
        doorstepCity: row.doorstepCity || '',
        doorstepPincode: row.doorstepPincode || '',
        doorstepLatitude,
        doorstepLongitude,
        doorstepMapUrl,
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
    const fuelType = String(body.fuelType || '').trim();
    const registrationNumber = String(body.registrationNumber || '').trim().toUpperCase();
    const serviceCategory = String(body.serviceCategory || '').trim();
    const specificService = String(body.specificService || '').trim();
    const preferredDate = String(body.preferredDate || body.requestedDate || '').trim();
    const preferredTime = String(body.preferredTime || body.requestedTime || '').trim();
    const additionalMessage = String(body.additionalMessage || '').trim();

    // Service Location Handling
    const rawLoc = String(body.serviceLocation || 'Workshop Visit').trim();
    const isDoorstep = rawLoc.toLowerCase().includes('doorstep');
    const serviceLocation = isDoorstep ? 'Doorstep Service' : 'Workshop Visit';

    let doorstepHouseFlat = '';
    let doorstepStreetLocality = '';
    let doorstepCity = '';
    let doorstepPincode = '';
    let doorstepLatitude: number | null = null;
    let doorstepLongitude: number | null = null;
    let doorstepMapUrl = '';

    if (isDoorstep) {
      doorstepHouseFlat = String(body.doorstepHouseFlat || '').trim();
      doorstepStreetLocality = String(body.doorstepStreetLocality || '').trim();
      doorstepCity = String(body.doorstepCity || '').trim();
      doorstepPincode = String(body.doorstepPincode || '').trim();

      if (body.doorstepLatitude !== undefined && body.doorstepLatitude !== null && body.doorstepLatitude !== '') {
        const parsedLat = Number(body.doorstepLatitude);
        if (!isNaN(parsedLat) && parsedLat >= -90 && parsedLat <= 90) {
          doorstepLatitude = parsedLat;
        }
      }

      if (body.doorstepLongitude !== undefined && body.doorstepLongitude !== null && body.doorstepLongitude !== '') {
        const parsedLng = Number(body.doorstepLongitude);
        if (!isNaN(parsedLng) && parsedLng >= -180 && parsedLng <= 180) {
          doorstepLongitude = parsedLng;
        }
      }

      if (doorstepLatitude !== null && doorstepLongitude !== null) {
        doorstepMapUrl = `https://www.google.com/maps?q=${doorstepLatitude},${doorstepLongitude}`;
      } else if (body.doorstepMapUrl) {
        doorstepMapUrl = String(body.doorstepMapUrl).trim();
      }
    }

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

    if (!fuelType) {
      return new Response(JSON.stringify({ error: 'Fuel type is required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!FUEL_TYPES.includes(fuelType as any)) {
      return new Response(
        JSON.stringify({ error: `Invalid fuel type. Must be one of: ${FUEL_TYPES.join(', ')}` }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (registrationNumber && (registrationNumber.length < 2 || registrationNumber.length > 25)) {
      return new Response(JSON.stringify({ error: 'Registration number must be 2-25 characters.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (serviceCategory.length < 1 || serviceCategory.length > 50) {
      return new Response(JSON.stringify({ error: 'Please select a valid service.' }), {
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

    // Doorstep specific field validations
    if (isDoorstep) {
      if (!doorstepHouseFlat || doorstepHouseFlat.length < 1 || doorstepHouseFlat.length > 150) {
        return new Response(JSON.stringify({ error: 'House / Flat / Building number is required for doorstep servicing.' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      if (!doorstepStreetLocality || doorstepStreetLocality.length < 2 || doorstepStreetLocality.length > 200) {
        return new Response(JSON.stringify({ error: 'Street / Locality is required for doorstep servicing (2-200 characters).' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      if (!doorstepCity || doorstepCity.length < 2 || doorstepCity.length > 100) {
        return new Response(JSON.stringify({ error: 'City is required for doorstep servicing (2-100 characters).' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      if (!doorstepPincode || !PINCODE_REGEX.test(doorstepPincode)) {
        return new Response(JSON.stringify({ error: 'Please enter a valid 6-digit Indian PIN code (e.g. 500018).' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Generate unique Booking ID (e.g. GM-102938)
    let uniqueId = `GM-${Math.floor(100000 + Math.random() * 900000)}`;
    for (let attempt = 0; attempt < 10; attempt++) {
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
      fuelType,
      registrationNumber,
      serviceCategory,
      specificService,
      preferredDate,
      preferredTime,
      additionalMessage,
      serviceLocation,
      doorstepHouseFlat,
      doorstepStreetLocality,
      doorstepCity,
      doorstepPincode,
      doorstepLatitude,
      doorstepLongitude,
      doorstepMapUrl,
      status: 'Pending',
      createdAt: new Date().toISOString()
    });

    const insertBooking = async () => {
      return await db.prepare(`
        INSERT INTO bookings (
          id, customerName, phoneNumber, email, vehicleMake, vehicleModel, 
          fuelType, registrationNumber, serviceCategory, specificService, preferredDate, 
          preferredTime, status, additionalMessage, serviceLocation,
          doorstepHouseFlat, doorstepStreetLocality, doorstepCity,
          doorstepPincode, doorstepLatitude, doorstepLongitude, doorstepMapUrl,
          createdAt
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )
      `).bind(
        normalized.id, normalized.customerName, normalized.phoneNumber, normalized.email,
        normalized.vehicleMake, normalized.vehicleModel, normalized.fuelType || null, normalized.registrationNumber,
        normalized.serviceCategory, normalized.specificService, normalized.preferredDate,
        normalized.preferredTime, normalized.status, normalized.additionalMessage,
        normalized.serviceLocation,
        normalized.doorstepHouseFlat || null,
        normalized.doorstepStreetLocality || null,
        normalized.doorstepCity || null,
        normalized.doorstepPincode || null,
        normalized.doorstepLatitude ?? null,
        normalized.doorstepLongitude ?? null,
        normalized.doorstepMapUrl || null,
        normalized.createdAt
      ).run();
    };

    try {
      await insertBooking();
    } catch (insertErr: any) {
      const msg = String(insertErr?.message || '');
      // If table lacks fuelType or doorstep columns in an unmigrated local or preview environment, self-heal and retry
      if (
        msg.includes('no column named') ||
        msg.includes('serviceLocation') ||
        msg.includes('doorstep') ||
        msg.includes('fuelType')
      ) {
        const alterStatements = [
          `ALTER TABLE bookings ADD COLUMN fuelType TEXT`,
          `ALTER TABLE bookings ADD COLUMN serviceLocation TEXT DEFAULT 'Workshop Visit'`,
          `ALTER TABLE bookings ADD COLUMN doorstepHouseFlat TEXT`,
          `ALTER TABLE bookings ADD COLUMN doorstepStreetLocality TEXT`,
          `ALTER TABLE bookings ADD COLUMN doorstepCity TEXT`,
          `ALTER TABLE bookings ADD COLUMN doorstepPincode TEXT`,
          `ALTER TABLE bookings ADD COLUMN doorstepLatitude REAL`,
          `ALTER TABLE bookings ADD COLUMN doorstepLongitude REAL`,
          `ALTER TABLE bookings ADD COLUMN doorstepMapUrl TEXT`,
        ];

        for (const sql of alterStatements) {
          try {
            await db.prepare(sql).run();
          } catch {
            // Ignore if column already exists
          }
        }

        // Retry insert after schema self-healing
        await insertBooking();
      } else {
        throw insertErr;
      }
    }

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
