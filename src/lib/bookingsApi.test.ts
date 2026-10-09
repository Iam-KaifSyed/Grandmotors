import { describe, it, expect, beforeEach } from 'vitest';
import { GET as listBookings, POST as createBooking } from '../pages/api/bookings/index';
import { GET as getBookingByIdRoute, PATCH as updateBookingStatus } from '../pages/api/bookings/[id]';

// Mock D1 Database implementation for unit testing
class MockD1Database {
  records: Map<string, any> = new Map();

  prepare(query: string) {
    const self = this;
    let boundParams: any[] = [];

    const statement = {
      bind(...params: any[]) {
        boundParams = params;
        return statement;
      },
      async all() {
        const q = query.trim().toUpperCase();

        if (q.startsWith('SELECT * FROM BOOKINGS ORDER BY')) {
          const list = Array.from(self.records.values()).sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          return { results: list };
        }

        if (q.includes('WHERE PHONENUMBER = ? AND REGISTRATIONNUMBER = ?')) {
          const [phone, reg, date, category] = boundParams;
          const match = Array.from(self.records.values()).find(
            (r) =>
              r.phoneNumber === phone &&
              r.registrationNumber === reg &&
              r.preferredDate === date &&
              r.serviceCategory === category &&
              r.status !== 'Cancelled'
          );
          return { results: match ? [match] : [] };
        }

        if (q.includes('WHERE ID = ? OR ID = ? OR ID = ?') || q.includes('WHERE ID = ?')) {
          const matches = Array.from(self.records.values()).filter((r) =>
            boundParams.map((p) => String(p).toUpperCase()).includes(r.id.toUpperCase())
          );
          return { results: matches };
        }

        return { results: [] };
      },
      async run() {
        const q = query.trim().toUpperCase();
        if (q.startsWith('INSERT INTO BOOKINGS')) {
          const [
            id, customerName, phoneNumber, email, vehicleMake, vehicleModel,
            registrationNumber, serviceCategory, specificService, preferredDate,
            preferredTime, status, additionalMessage, serviceLocation,
            doorstepHouseFlat, doorstepStreetLocality, doorstepCity,
            doorstepPincode, doorstepLatitude, doorstepLongitude, doorstepMapUrl,
            createdAt
          ] = boundParams;

          const record = {
            id, customerName, phoneNumber, email, vehicleMake, vehicleModel,
            registrationNumber, serviceCategory, specificService, preferredDate,
            preferredTime, status, additionalMessage,
            serviceLocation: serviceLocation || 'Workshop Visit',
            doorstepHouseFlat: doorstepHouseFlat || '',
            doorstepStreetLocality: doorstepStreetLocality || '',
            doorstepCity: doorstepCity || '',
            doorstepPincode: doorstepPincode || '',
            doorstepLatitude: doorstepLatitude ?? null,
            doorstepLongitude: doorstepLongitude ?? null,
            doorstepMapUrl: doorstepMapUrl || '',
            createdAt
          };
          self.records.set(id, record);
          return { success: true };
        }

        if (q.startsWith('UPDATE BOOKINGS SET STATUS = ?')) {
          const [status, ...idParams] = boundParams;
          for (const [idKey, record] of self.records.entries()) {
            if (idParams.map((p) => String(p).toUpperCase()).includes(idKey.toUpperCase())) {
              record.status = status;
              return { success: true, changes: 1 };
            }
          }
          return { success: true, changes: 0 };
        }

        return { success: true };
      }
    };

    return statement;
  }
}

describe('Bookings API Endpoints (/api/bookings)', () => {
  let mockDb: MockD1Database;
  const ADMIN_KEY = 'test_admin_secret_key';

  const createLocals = () => ({
    runtime: {
      env: {
        DB: mockDb,
        ADMIN_API_KEY: ADMIN_KEY,
      }
    }
  });

  const createRequest = (method: string, body?: any, headers: Record<string, string> = {}) => {
    return new Request('http://localhost/api/bookings', {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  };

  beforeEach(() => {
    mockDb = new MockD1Database();
  });

  // Priority 2: Admin Auth & Security
  describe('Security & Admin Authentication', () => {
    it('denies unauthenticated access to GET /api/bookings (list all records)', async () => {
      const req = createRequest('GET');
      const locals = createLocals();
      const resp = await (listBookings as any)({ request: req, locals });

      expect(resp.status).toBe(401);
      const data = await resp.json();
      expect(data.error).toContain('Unauthorized');
    });

    it('allows authorized admin to GET /api/bookings with Bearer token', async () => {
      const req = createRequest('GET', undefined, { Authorization: `Bearer ${ADMIN_KEY}` });
      const locals = createLocals();
      const resp = await (listBookings as any)({ request: req, locals });

      expect(resp.status).toBe(200);
      const data = await resp.json();
      expect(Array.isArray(data)).toBe(true);
    });

    it('denies unauthorized status changes on PATCH /api/bookings/[id]', async () => {
      const req = createRequest('PATCH', { status: 'Confirmed' });
      const locals = createLocals();
      const resp = await (updateBookingStatus as any)({ params: { id: 'GM-123456' }, request: req, locals });

      expect(resp.status).toBe(401);
    });

    it('sanitizes customer PII for unauthenticated public tracking on GET /api/bookings/[id]', async () => {
      // Seed a booking
      mockDb.records.set('GM-555555', {
        id: 'GM-555555',
        customerName: 'Secret Customer',
        phoneNumber: '+91 99999 11111',
        email: 'secret@example.com',
        vehicleMake: 'BMW',
        vehicleModel: 'M3',
        registrationNumber: 'TS 09 AB 1234',
        serviceCategory: 'brakes',
        specificService: 'Rotor replace',
        preferredDate: '2026-10-20',
        preferredTime: 'Morning',
        status: 'Confirmed',
        additionalMessage: 'Private gate passcode 1234',
        createdAt: '2026-10-01T00:00:00Z'
      });

      // Public tracking query
      const publicReq = createRequest('GET');
      const publicResp = await (getBookingByIdRoute as any)({
        params: { id: 'GM-555555' },
        request: publicReq,
        locals: createLocals()
      });

      expect(publicResp.status).toBe(200);
      const publicData = await publicResp.json();
      expect(publicData.id).toBe('GM-555555');
      expect(publicData.vehicleMake).toBe('BMW');
      expect(publicData.phoneNumber).toBeUndefined();
      expect(publicData.email).toBeUndefined();
      expect(publicData.additionalMessage).toBeUndefined();

      // Admin query
      const adminReq = createRequest('GET', undefined, { 'x-admin-key': ADMIN_KEY });
      const adminResp = await (getBookingByIdRoute as any)({
        params: { id: 'GM-555555' },
        request: adminReq,
        locals: createLocals()
      });

      expect(adminResp.status).toBe(200);
      const adminData = await adminResp.json();
      expect(adminData.phoneNumber).toBe('+91 99999 11111');
      expect(adminData.email).toBe('secret@example.com');
      expect(adminData.additionalMessage).toBe('Private gate passcode 1234');
    });
  });

  // Priority 3: Server-side validation & duplicate submission
  describe('Validation & Submission (POST /api/bookings)', () => {
    const validBooking = {
      fullName: 'Vikram Mehta',
      phoneNumber: '+91 98765 43210',
      email: 'vikram@example.com',
      vehicleMake: 'Porsche',
      vehicleModel: '911 Carrera',
      registrationNumber: 'TS 09 AB 9999',
      serviceCategory: 'general-service',
      specificService: 'Periodic inspection',
      preferredDate: '2026-10-22',
      preferredTime: 'Morning (9:00 AM - 12:00 PM)',
      additionalMessage: 'Check tire wear',
    };

    it('accepts and inserts valid booking', async () => {
      const req = createRequest('POST', validBooking);
      const resp = await (createBooking as any)({ request: req, locals: createLocals() });

      expect(resp.status).toBe(201);
      const data = await resp.json();
      expect(data.success).toBe(true);
      expect(data.id).toMatch(/^GM-\d{6}$/);
      expect(mockDb.records.has(data.id)).toBe(true);
    });

    it('rejects submission with missing required fields', async () => {
      const invalid = { ...validBooking, fullName: '' };
      const req = createRequest('POST', invalid);
      const resp = await (createBooking as any)({ request: req, locals: createLocals() });

      expect(resp.status).toBe(400);
      const data = await resp.json();
      expect(data.error).toContain('Full name is required');
    });

    it('rejects invalid phone number', async () => {
      const invalid = { ...validBooking, phoneNumber: 'abc123' };
      const req = createRequest('POST', invalid);
      const resp = await (createBooking as any)({ request: req, locals: createLocals() });

      expect(resp.status).toBe(400);
      const data = await resp.json();
      expect(data.error).toContain('valid phone number');
    });

    it('rejects invalid date format', async () => {
      const invalid = { ...validBooking, preferredDate: '22-10-2026' };
      const req = createRequest('POST', invalid);
      const resp = await (createBooking as any)({ request: req, locals: createLocals() });

      expect(resp.status).toBe(400);
      const data = await resp.json();
      expect(data.error).toContain('YYYY-MM-DD');
    });

    it('allows multiple service booking submissions for the same customer, vehicle and date', async () => {
      // First submission
      const req1 = createRequest('POST', validBooking);
      const resp1 = await (createBooking as any)({ request: req1, locals: createLocals() });
      expect(resp1.status).toBe(201);
      const data1 = await resp1.json();
      expect(data1.success).toBe(true);
      expect(data1.id).toMatch(/^GM-\d{6}$/);

      // Second submission for the same customer, vehicle, date, and service
      const req2 = createRequest('POST', validBooking);
      const resp2 = await (createBooking as any)({ request: req2, locals: createLocals() });
      expect(resp2.status).toBe(201);
      const data2 = await resp2.json();
      expect(data2.success).toBe(true);
      expect(data2.id).toMatch(/^GM-\d{6}$/);

      // Verify each creates a separate, unique booking without overwriting
      expect(data1.id).not.toBe(data2.id);
      expect(mockDb.records.has(data1.id)).toBe(true);
      expect(mockDb.records.has(data2.id)).toBe(true);
      expect(mockDb.records.size).toBe(2);
    });

    describe('Doorstep Service Validation', () => {
      const validDoorstepBooking = {
        ...validBooking,
        fullName: 'Sameer Khan',
        registrationNumber: 'TS 09 XY 8888',
        serviceLocation: 'Doorstep Service',
        doorstepHouseFlat: 'Villa 42, Palm Meadows',
        doorstepStreetLocality: 'Jubilee Hills Road No. 36',
        doorstepCity: 'Hyderabad',
        doorstepPincode: '500033',
        doorstepLatitude: 17.4319,
        doorstepLongitude: 78.4073,
      };

      it('accepts valid Doorstep Service booking with address and coordinates', async () => {
        const req = createRequest('POST', validDoorstepBooking);
        const resp = await (createBooking as any)({ request: req, locals: createLocals() });

        expect(resp.status).toBe(201);
        const data = await resp.json();
        expect(data.success).toBe(true);

        const saved = mockDb.records.get(data.id);
        expect(saved).toBeDefined();
        expect(saved.serviceLocation).toBe('Doorstep Service');
        expect(saved.doorstepHouseFlat).toBe('Villa 42, Palm Meadows');
        expect(saved.doorstepStreetLocality).toBe('Jubilee Hills Road No. 36');
        expect(saved.doorstepCity).toBe('Hyderabad');
        expect(saved.doorstepPincode).toBe('500033');
        expect(saved.doorstepLatitude).toBe(17.4319);
        expect(saved.doorstepLongitude).toBe(78.4073);
        expect(saved.doorstepMapUrl).toContain('google.com/maps');
      });

      it('rejects Doorstep Service when house/flat is missing', async () => {
        const invalid = { ...validDoorstepBooking, doorstepHouseFlat: '' };
        const req = createRequest('POST', invalid);
        const resp = await (createBooking as any)({ request: req, locals: createLocals() });

        expect(resp.status).toBe(400);
        const data = await resp.json();
        expect(data.error).toContain('House / Flat');
      });

      it('rejects Doorstep Service when street/locality is missing', async () => {
        const invalid = { ...validDoorstepBooking, doorstepStreetLocality: '   ' };
        const req = createRequest('POST', invalid);
        const resp = await (createBooking as any)({ request: req, locals: createLocals() });

        expect(resp.status).toBe(400);
        const data = await resp.json();
        expect(data.error).toContain('Street / Locality');
      });

      it('rejects Doorstep Service when city is missing', async () => {
        const invalid = { ...validDoorstepBooking, doorstepCity: '' };
        const req = createRequest('POST', invalid);
        const resp = await (createBooking as any)({ request: req, locals: createLocals() });

        expect(resp.status).toBe(400);
        const data = await resp.json();
        expect(data.error).toContain('City');
      });

      it('rejects Doorstep Service when PIN code is invalid', async () => {
        const invalidPincodes = ['50003', '050033', '500033A', 'ABCDEF', ''];

        for (const pin of invalidPincodes) {
          const invalid = { ...validDoorstepBooking, doorstepPincode: pin };
          const req = createRequest('POST', invalid);
          const resp = await (createBooking as any)({ request: req, locals: createLocals() });

          expect(resp.status).toBe(400);
          const data = await resp.json();
          expect(data.error).toContain('PIN code');
        }
      });

      it('accepts Workshop Visit without doorstep address fields', async () => {
        const workshopBooking = {
          ...validBooking,
          fullName: 'Workshop Customer',
          registrationNumber: 'TS 09 ZZ 1111',
          serviceLocation: 'Workshop Visit',
          doorstepHouseFlat: '',
          doorstepStreetLocality: '',
          doorstepCity: '',
          doorstepPincode: '',
        };
        const req = createRequest('POST', workshopBooking);
        const resp = await (createBooking as any)({ request: req, locals: createLocals() });

        expect(resp.status).toBe(201);
        const data = await resp.json();
        expect(data.success).toBe(true);

        const saved = mockDb.records.get(data.id);
        expect(saved.serviceLocation).toBe('Workshop Visit');
      });
    });
  });

  // Priority 4 & 6: Tracking ID Normalization & Status Validation
  describe('Tracking Lookup & Status Validation', () => {
    beforeEach(() => {
      mockDb.records.set('GM-888888', {
        id: 'GM-888888',
        customerName: 'Kavita Rao',
        phoneNumber: '+91 98765 00000',
        vehicleMake: 'Audi',
        vehicleModel: 'RS6',
        registrationNumber: 'TS 09 RS 6000',
        serviceCategory: 'engine-diagnostics',
        preferredDate: '2026-10-25',
        preferredTime: 'Morning',
        status: 'Pending',
        createdAt: '2026-10-02T00:00:00Z'
      });
    });

    it('looks up booking with GM- prefix (GM-888888)', async () => {
      const req = createRequest('GET');
      const resp = await (getBookingByIdRoute as any)({
        params: { id: 'GM-888888' },
        request: req,
        locals: createLocals()
      });
      expect(resp.status).toBe(200);
      const data = await resp.json();
      expect(data.id).toBe('GM-888888');
    });

    it('looks up booking with numeric-only ID (888888)', async () => {
      const req = createRequest('GET');
      const resp = await (getBookingByIdRoute as any)({
        params: { id: '888888' },
        request: req,
        locals: createLocals()
      });
      expect(resp.status).toBe(200);
      const data = await resp.json();
      expect(data.id).toBe('GM-888888');
    });

    it('returns 404 for unknown booking ID', async () => {
      const req = createRequest('GET');
      const resp = await (getBookingByIdRoute as any)({
        params: { id: 'GM-999000' },
        request: req,
        locals: createLocals()
      });
      expect(resp.status).toBe(404);
    });

    it('returns 400 for malformed booking ID', async () => {
      const req = createRequest('GET');
      const resp = await (getBookingByIdRoute as any)({
        params: { id: 'bad!id?' },
        request: req,
        locals: createLocals()
      });
      expect(resp.status).toBe(400);
    });

    it('accepts every allowed status update on PATCH by admin', async () => {
      const allowedStatuses = ['Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'];

      for (const status of allowedStatuses) {
        const req = createRequest('PATCH', { status }, { Authorization: `Bearer ${ADMIN_KEY}` });
        const resp = await (updateBookingStatus as any)({
          params: { id: 'GM-888888' },
          request: req,
          locals: createLocals()
        });

        expect(resp.status).toBe(200);
        const data = await resp.json();
        expect(data.success).toBe(true);
        expect(mockDb.records.get('GM-888888')?.status).toBe(status);
      }
    });

    it('rejects invalid status values on PATCH', async () => {
      const req = createRequest('PATCH', { status: 'InvalidStatus' }, { Authorization: `Bearer ${ADMIN_KEY}` });
      const resp = await (updateBookingStatus as any)({
        params: { id: 'GM-888888' },
        request: req,
        locals: createLocals()
      });

      expect(resp.status).toBe(400);
      const data = await resp.json();
      expect(data.error).toContain('Invalid status');
    });
  });
});
