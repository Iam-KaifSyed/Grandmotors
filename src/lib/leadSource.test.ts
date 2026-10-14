import { describe, it, expect, beforeEach } from 'vitest';
import {
  determineLeadSource,
  isValidLeadSource,
  initLeadSource,
  getSavedLeadSource,
  getLeadSource,
  LEAD_SOURCE_STORAGE_KEY,
  LEAD_SOURCES,
} from './leadSource';
import { mapBookingRowForAdmin } from './bookingMapper';
import { POST as createBooking } from '../pages/api/bookings/index';
import { GET as adminListBookings } from '../pages/api/admin/bookings';
import { createTestD1Database } from './testDbHelper';
import { calculateRepeatCustomers } from './customerMatching';

// Storage mock for browser environment testing
const storageState: { session: Record<string, string>; local: Record<string, string> } = {
  session: {},
  local: {},
};

const mockSessionStorage = {
  getItem: (k: string) => storageState.session[k] ?? null,
  setItem: (k: string, v: string) => { storageState.session[k] = String(v); },
  removeItem: (k: string) => { delete storageState.session[k]; },
  clear: () => { storageState.session = {}; },
};

const mockLocalStorage = {
  getItem: (k: string) => storageState.local[k] ?? null,
  setItem: (k: string, v: string) => { storageState.local[k] = String(v); },
  removeItem: (k: string) => { delete storageState.local[k]; },
  clear: () => { storageState.local = {}; },
};

describe('Lead Source Identification (determineLeadSource)', () => {
  describe('Google detection', () => {
    it('identifies Google from gclid query parameter', () => {
      expect(determineLeadSource('https://grandmotors.in/?gclid=xyz123')).toBe('Google');
    });

    it('identifies Google from utm_source=google', () => {
      expect(determineLeadSource('https://grandmotors.in/?utm_source=google')).toBe('Google');
      expect(determineLeadSource('https://grandmotors.in/?utm_source=GOOGLE')).toBe('Google');
    });

    it('identifies Google from adwords utm tag', () => {
      expect(determineLeadSource('https://grandmotors.in/?utm_source=adwords')).toBe('Google');
    });

    it('identifies Google from google.com referrer', () => {
      expect(determineLeadSource('https://grandmotors.in/', 'https://www.google.com/')).toBe('Google');
    });

    it('identifies Google from regional google.co.in referrer', () => {
      expect(determineLeadSource('https://grandmotors.in/', 'https://www.google.co.in/search?q=car+mechanic')).toBe('Google');
    });

    it('identifies Google from Android search app referrer', () => {
      expect(determineLeadSource('https://grandmotors.in/', 'android-app://com.google.android.googlequicksearchbox')).toBe('Google');
    });
  });

  describe('Facebook detection', () => {
    it('identifies Facebook from fbclid query parameter', () => {
      expect(determineLeadSource('https://grandmotors.in/?fbclid=IwAR0xyz')).toBe('Facebook');
    });

    it('identifies Facebook from utm_source=facebook or fb', () => {
      expect(determineLeadSource('https://grandmotors.in/?utm_source=facebook')).toBe('Facebook');
      expect(determineLeadSource('https://grandmotors.in/?utm_source=fb')).toBe('Facebook');
    });

    it('identifies Facebook from facebook.com referrer', () => {
      expect(determineLeadSource('https://grandmotors.in/', 'https://l.facebook.com/')).toBe('Facebook');
      expect(determineLeadSource('https://grandmotors.in/', 'https://m.facebook.com/')).toBe('Facebook');
    });

    it('identifies Facebook from fb.me shortlink referrer', () => {
      expect(determineLeadSource('https://grandmotors.in/', 'https://fb.me/grandmotors')).toBe('Facebook');
    });

    it('identifies Facebook from Android Katana app referrer', () => {
      expect(determineLeadSource('https://grandmotors.in/', 'android-app://com.facebook.katana')).toBe('Facebook');
    });
  });

  describe('Instagram detection', () => {
    it('identifies Instagram from utm_source=instagram or ig', () => {
      expect(determineLeadSource('https://grandmotors.in/?utm_source=instagram')).toBe('Instagram');
      expect(determineLeadSource('https://grandmotors.in/?utm_source=ig')).toBe('Instagram');
    });

    it('identifies Instagram from instagram.com referrer', () => {
      expect(determineLeadSource('https://grandmotors.in/', 'https://l.instagram.com/')).toBe('Instagram');
      expect(determineLeadSource('https://grandmotors.in/', 'https://www.instagram.com/')).toBe('Instagram');
    });

    it('identifies Instagram from Android app referrer', () => {
      expect(determineLeadSource('https://grandmotors.in/', 'android-app://com.instagram.android')).toBe('Instagram');
    });
  });

  describe('WhatsApp detection', () => {
    it('identifies WhatsApp from utm_source=whatsapp or wa', () => {
      expect(determineLeadSource('https://grandmotors.in/?utm_source=whatsapp')).toBe('WhatsApp');
      expect(determineLeadSource('https://grandmotors.in/?utm_source=wa')).toBe('WhatsApp');
    });

    it('identifies WhatsApp from whatsapp.com or web.whatsapp.com referrer', () => {
      expect(determineLeadSource('https://grandmotors.in/', 'https://web.whatsapp.com/')).toBe('WhatsApp');
      expect(determineLeadSource('https://grandmotors.in/', 'https://api.whatsapp.com/send')).toBe('WhatsApp');
    });

    it('identifies WhatsApp from wa.me shortlink referrer', () => {
      expect(determineLeadSource('https://grandmotors.in/', 'https://wa.me/918623948898')).toBe('WhatsApp');
    });

    it('identifies WhatsApp from Android app referrer', () => {
      expect(determineLeadSource('https://grandmotors.in/', 'android-app://com.whatsapp')).toBe('WhatsApp');
    });
  });

  describe('Referral detection', () => {
    it('identifies Referral from an external blog or review site', () => {
      expect(determineLeadSource('https://grandmotors.in/', 'https://team-bhp.com/forum/hyderabad')).toBe('Referral');
      expect(determineLeadSource('https://grandmotors.in/', 'https://justdial.com/Hyderabad/Grand-Motors')).toBe('Referral');
    });

    it('identifies Referral from utm_medium=referral', () => {
      expect(determineLeadSource('https://grandmotors.in/?utm_medium=referral&utm_source=partner')).toBe('Referral');
    });

    it('identifies Referral from custom external utm_source', () => {
      expect(determineLeadSource('https://grandmotors.in/?utm_source=influencer_review')).toBe('Referral');
    });
  });

  describe('Direct / Unknown detection', () => {
    it('returns Direct/Unknown when no query params and no referrer', () => {
      expect(determineLeadSource('https://grandmotors.in/', '')).toBe('Direct/Unknown');
      expect(determineLeadSource('https://grandmotors.in/book-service')).toBe('Direct/Unknown');
      expect(determineLeadSource()).toBe('Direct/Unknown');
    });

    it('returns Direct/Unknown for internal site navigation (same host)', () => {
      expect(
        determineLeadSource(
          'https://grandmotors.in/book-service',
          'https://grandmotors.in/services',
          'grandmotors.in'
        )
      ).toBe('Direct/Unknown');
      expect(
        determineLeadSource(
          'http://localhost:4321/book-service',
          'http://localhost:4321/',
          'localhost'
        )
      ).toBe('Direct/Unknown');
    });

    it('returns Direct/Unknown for unidentifiable referrer strings rather than guessing', () => {
      expect(determineLeadSource('https://grandmotors.in/', 'invalid-url-string')).toBe('Direct/Unknown');
    });
  });

  it('validates allowed lead sources correctly with isValidLeadSource', () => {
    for (const src of LEAD_SOURCES) {
      expect(isValidLeadSource(src)).toBe(true);
    }
    expect(isValidLeadSource('Twitter')).toBe(false);
    expect(isValidLeadSource('')).toBe(false);
    expect(isValidLeadSource(null)).toBe(false);
    expect(isValidLeadSource(undefined)).toBe(false);
  });
});

describe('Lead Source Preservation Across Navigation', () => {
  beforeEach(() => {
    storageState.session = {};
    storageState.local = {};

    (globalThis as any).window = {
      location: {
        href: 'https://grandmotors.in/?utm_source=instagram',
        hostname: 'grandmotors.in',
        search: '?utm_source=instagram',
      } as any,
    } as any;
    (globalThis as any).document = {
      referrer: 'https://l.instagram.com/',
    } as any;
    (globalThis as any).sessionStorage = mockSessionStorage;
    (globalThis as any).localStorage = mockLocalStorage;
  });

  it('initializes and saves lead source on customer first website visit', () => {
    expect(getSavedLeadSource()).toBeNull();
    const src = initLeadSource();
    expect(src).toBe('Instagram');
    expect(getSavedLeadSource()).toBe('Instagram');
    expect(mockSessionStorage.getItem(LEAD_SOURCE_STORAGE_KEY)).toBe('Instagram');
    expect(mockLocalStorage.getItem(LEAD_SOURCE_STORAGE_KEY)).toBe('Instagram');
  });

  it('preserves the initial source during customer navigation between pages', () => {
    // 1. First visit landing on homepage from Google
    // @ts-ignore
    globalThis.window.location.href = 'https://grandmotors.in/?utm_source=google';
    // @ts-ignore
    globalThis.window.location.search = '?utm_source=google';
    // @ts-ignore
    globalThis.document.referrer = 'https://www.google.com/';

    const initialSource = initLeadSource();
    expect(initialSource).toBe('Google');

    // 2. Customer navigates to /services (internal navigation)
    // @ts-ignore
    globalThis.window.location.href = 'https://grandmotors.in/services';
    // @ts-ignore
    globalThis.window.location.search = '';
    // @ts-ignore
    globalThis.document.referrer = 'https://grandmotors.in/';

    const onServicesPage = initLeadSource();
    expect(onServicesPage).toBe('Google'); // Preserved!

    // 3. Customer navigates to /book-service
    // @ts-ignore
    globalThis.window.location.href = 'https://grandmotors.in/book-service';
    // @ts-ignore
    globalThis.document.referrer = 'https://grandmotors.in/services';

    const onBookingPage = getLeadSource();
    expect(onBookingPage).toBe('Google'); // Still preserved!
  });

  it('preserves Direct/Unknown when customer direct lands with no source', () => {
    // Direct visit without referrer or query params
    // @ts-ignore
    globalThis.window.location.href = 'https://grandmotors.in/';
    // @ts-ignore
    globalThis.window.location.search = '';
    // @ts-ignore
    globalThis.document.referrer = '';

    const directSrc = initLeadSource();
    expect(directSrc).toBe('Direct/Unknown');

    // Internal navigation to /book-service
    // @ts-ignore
    globalThis.window.location.href = 'https://grandmotors.in/book-service';
    // @ts-ignore
    globalThis.document.referrer = 'https://grandmotors.in/';

    expect(getLeadSource()).toBe('Direct/Unknown');
  });
});

describe('Database Integration & Admin Source Display', () => {
  it('historical/existing bookings with NULL source show "Unknown"', () => {
    const historicalRow = {
      id: 'GM-000001',
      customerName: 'Old Customer',
      phoneNumber: '+91 99999 11111',
      vehicleMake: 'Audi',
      vehicleModel: 'A4',
      registrationNumber: 'TS 09 AA 1234',
      serviceCategory: 'general-service',
      preferredDate: '2026-09-01',
      preferredTime: 'Morning',
      status: 'Completed',
      source: null, // Historical record has null source
      createdAt: '2026-09-01T10:00:00Z',
    };

    const mapped = mapBookingRowForAdmin(historicalRow);
    expect(mapped.source).toBe('Unknown');
  });

  it('saves identified source in the real SQLite D1 database and retrieves it', async () => {
    const db = createTestD1Database();

    const validPayload = {
      fullName: 'Vikram Seth',
      phoneNumber: '+91 98765 43210',
      email: 'vikram@example.com',
      vehicleMake: 'Mercedes-Benz',
      vehicleModel: 'C-Class',
      fuelType: 'Petrol',
      registrationNumber: 'TS 09 AB 1234',
      serviceCategory: 'brakes',
      preferredDate: '2026-10-25',
      preferredTime: 'Morning (9:00 AM - 12:00 PM)',
      source: 'Facebook',
    };

    const ctx = {
      request: new Request('http://localhost/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validPayload),
      }),
      locals: { runtime: { env: { DB: db } } },
    } as any;

    const res = await (createBooking as any)(ctx);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.booking.source).toBe('Facebook');

    // Verify row in database
    const saved = await db.prepare('SELECT * FROM bookings WHERE id = ?').bind(body.id).all();
    expect(saved.results.length).toBe(1);
    expect(saved.results[0].source).toBe('Facebook');

    // Verify admin mapping displays the source
    const adminMapped = mapBookingRowForAdmin(saved.results[0]);
    expect(adminMapped.source).toBe('Facebook');
  });

  it('saves Direct/Unknown when no source is supplied or identifiable', async () => {
    const db = createTestD1Database();

    const payload = {
      fullName: 'Rahul Roy',
      phoneNumber: '+91 98765 11111',
      vehicleMake: 'BMW',
      vehicleModel: '3 Series',
      fuelType: 'Diesel',
      registrationNumber: 'TS 09 CD 5678',
      serviceCategory: 'general-service',
      preferredDate: '2026-10-26',
      preferredTime: 'Morning (9:00 AM - 12:00 PM)',
      // source is omitted
    };

    const ctx = {
      request: new Request('http://localhost/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }),
      locals: { runtime: { env: { DB: db } } },
    } as any;

    const res = await (createBooking as any)(ctx);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.booking.source).toBe('Direct/Unknown');

    const saved = await db.prepare('SELECT * FROM bookings WHERE id = ?').bind(body.id).all();
    expect(saved.results[0].source).toBe('Direct/Unknown');
  });

  it('admin API listing endpoint returns source field for all bookings', async () => {
    const db = createTestD1Database();

    // Insert 1 historical booking without source (null)
    await db.prepare(`
      INSERT INTO bookings (
        id, customerName, phoneNumber, vehicleMake, vehicleModel,
        registrationNumber, serviceCategory, preferredDate, preferredTime,
        status, source, createdAt
      ) VALUES (
        'GM-HIST01', 'Old Customer', '+91 90000 00001', 'Honda', 'City',
        'TS09ZZ0001', 'brakes', '2026-09-01', 'Morning',
        'Completed', NULL, '2026-09-01T10:00:00Z'
      )
    `).run();

    // Insert 1 new booking with WhatsApp source
    await db.prepare(`
      INSERT INTO bookings (
        id, customerName, phoneNumber, vehicleMake, vehicleModel,
        registrationNumber, serviceCategory, preferredDate, preferredTime,
        status, source, createdAt
      ) VALUES (
        'GM-NEW002', 'WhatsApp Lead', '+91 90000 00002', 'Hyundai', 'Creta',
        'TS09ZZ0002', 'engine-diagnostics', '2026-10-20', 'Afternoon',
        'Pending', 'WhatsApp', '2026-10-20T10:00:00Z'
      )
    `).run();

    // Query admin endpoint
    const ctx = {
      request: new Request('http://localhost/api/admin/bookings', {
        headers: { 'Content-Type': 'application/json', 'x-admin-key': 'test-secret' },
      }),
      session: {
        get: async (k: string) => (k === 'admin' ? true : k === 'adminSince' ? Date.now() : undefined),
      },
      locals: { runtime: { env: { DB: db, ADMIN_API_KEY: 'test-secret' } } },
    } as any;

    const res = await (adminListBookings as any)(ctx);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.bookings.length).toBe(2);

    const hist = data.bookings.find((b: any) => b.id === 'GM-HIST01');
    const wa = data.bookings.find((b: any) => b.id === 'GM-NEW002');

    // Historical booking without source shows "Unknown"
    expect(hist.source).toBe('Unknown');
    // New booking shows "WhatsApp"
    expect(wa.source).toBe('WhatsApp');
  });

  it('preserves distinct lead sources for repeat customer bookings', async () => {
    const db = createTestD1Database();

    // Customer "Aditya Rao" books first from Facebook
    const booking1Payload = {
      fullName: 'Aditya Rao',
      phoneNumber: '+91 98888 77777',
      email: 'aditya.rao@example.com',
      vehicleMake: 'BMW',
      vehicleModel: 'M3',
      fuelType: 'Petrol',
      registrationNumber: 'TS 09 AD 1000',
      serviceCategory: 'brakes',
      preferredDate: '2026-10-18',
      preferredTime: 'Morning (9:00 AM - 12:00 PM)',
      source: 'Facebook',
    };

    const ctx1 = {
      request: new Request('http://localhost/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(booking1Payload),
      }),
      locals: { runtime: { env: { DB: db } } },
    } as any;

    const res1 = await (createBooking as any)(ctx1);
    expect(res1.status).toBe(201);
    const body1 = await res1.json();
    const id1 = body1.id;

    // Same customer books a second time from Google
    const booking2Payload = {
      fullName: 'Aditya Rao',
      phoneNumber: '+91 98888 77777',
      email: 'aditya.rao@example.com',
      vehicleMake: 'BMW',
      vehicleModel: 'M3',
      fuelType: 'Petrol',
      registrationNumber: 'TS 09 AD 1000',
      serviceCategory: 'engine-diagnostics',
      preferredDate: '2026-10-28',
      preferredTime: 'Afternoon (12:00 PM - 3:00 PM)',
      source: 'Google',
    };

    const ctx2 = {
      request: new Request('http://localhost/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(booking2Payload),
      }),
      locals: { runtime: { env: { DB: db } } },
    } as any;

    const res2 = await (createBooking as any)(ctx2);
    expect(res2.status).toBe(201);
    const body2 = await res2.json();
    const id2 = body2.id;

    // Verify both bookings saved their own individual sources in the database
    const rec1 = await db.prepare('SELECT source FROM bookings WHERE id = ?').bind(id1).first('source');
    const rec2 = await db.prepare('SELECT source FROM bookings WHERE id = ?').bind(id2).first('source');
    expect(rec1).toBe('Facebook');
    expect(rec2).toBe('Google');

    // Verify repeat customer calculation links them without altering sources
    const adminRows = (await db.prepare('SELECT * FROM bookings ORDER BY createdAt DESC').all()).results;
    const mappedAdmin = adminRows.map(mapBookingRowForAdmin);

    const repeatMap = calculateRepeatCustomers(mappedAdmin as any);
    const repInfo1 = repeatMap.get(id1);
    const repInfo2 = repeatMap.get(id2);

    expect(repInfo1?.isRepeatCustomer).toBe(true);
    expect(repInfo1?.totalBookingCount).toBe(2);
    expect(repInfo2?.isRepeatCustomer).toBe(true);
    expect(repInfo2?.totalBookingCount).toBe(2);

    // Each mapped booking reflects its accurate source
    const b1Mapped = mappedAdmin.find((b: any) => b.id === id1);
    const b2Mapped = mappedAdmin.find((b: any) => b.id === id2);
    expect(b1Mapped?.source).toBe('Facebook');
    expect(b2Mapped?.source).toBe('Google');
  });
});

describe('Priority Ladder & Conflicting Signals Resolution', () => {
  it('Priority 1: Explicit UTM overrides click IDs and referrers', () => {
    // UTM Facebook vs Google click ID vs Google referrer
    expect(
      determineLeadSource(
        'https://grandmotors.in/?utm_source=facebook&gclid=google_click_token_123',
        'https://www.google.com/'
      )
    ).toBe('Facebook');

    // UTM Instagram vs Facebook click ID vs Facebook referrer
    expect(
      determineLeadSource(
        'https://grandmotors.in/?utm_source=instagram&fbclid=fb_click_token_456',
        'https://l.facebook.com/'
      )
    ).toBe('Instagram');

    // UTM WhatsApp vs Google click ID
    expect(
      determineLeadSource(
        'https://grandmotors.in/?utm_source=whatsapp&gclid=abc789',
        'https://www.google.co.in/'
      )
    ).toBe('WhatsApp');

    // UTM Google vs Facebook referrer
    expect(
      determineLeadSource(
        'https://grandmotors.in/?utm_source=google',
        'https://l.facebook.com/'
      )
    ).toBe('Google');
  });

  it('Priority 2: Reliable advertising click IDs override referrers when UTM is absent', () => {
    // Google click ID (gclid) overrides Facebook referrer
    expect(
      determineLeadSource(
        'https://grandmotors.in/?gclid=CjwKCAjw',
        'https://l.facebook.com/'
      )
    ).toBe('Google');

    // Meta click ID (fbclid) overrides Google referrer
    expect(
      determineLeadSource(
        'https://grandmotors.in/?fbclid=IwAR123',
        'https://www.google.com/'
      )
    ).toBe('Facebook');

    // Instagram click ID (igshid) overrides external referrer
    expect(
      determineLeadSource(
        'https://grandmotors.in/?igshid=xyz_insta',
        'https://team-bhp.com/'
      )
    ).toBe('Instagram');

    // Additional Google click IDs (gbraid, wbraid)
    expect(
      determineLeadSource(
        'https://grandmotors.in/?gbraid=google_app_web_123',
        'https://l.instagram.com/'
      )
    ).toBe('Google');
    expect(
      determineLeadSource(
        'https://grandmotors.in/?wbraid=google_web_app_456',
        'https://team-bhp.com/'
      )
    ).toBe('Google');
  });

  it('Priority 3: Recognized external referrer takes effect when no UTM or click IDs exist', () => {
    expect(determineLeadSource('https://grandmotors.in/', 'https://www.google.com/')).toBe('Google');
    expect(determineLeadSource('https://grandmotors.in/', 'https://l.facebook.com/')).toBe('Facebook');
    expect(determineLeadSource('https://grandmotors.in/', 'https://l.instagram.com/')).toBe('Instagram');
    expect(determineLeadSource('https://grandmotors.in/', 'https://web.whatsapp.com/')).toBe('WhatsApp');
    expect(determineLeadSource('https://grandmotors.in/', 'https://auto-reviews.com/garage-list')).toBe('Referral');
  });

  it('Priority 4: Falls back to Direct/Unknown when evidence is unreliable or internal (never guesses)', () => {
    // Unrelated query parameters
    expect(determineLeadSource('https://grandmotors.in/?car=bmw&color=black')).toBe('Direct/Unknown');

    // Internal navigation without prior source
    expect(
      determineLeadSource(
        'https://grandmotors.in/book-service',
        'https://grandmotors.in/services',
        'grandmotors.in'
      )
    ).toBe('Direct/Unknown');

    // Malformed referrer without dot
    expect(determineLeadSource('https://grandmotors.in/', 'localhost-internal-ref')).toBe('Direct/Unknown');
  });
});
