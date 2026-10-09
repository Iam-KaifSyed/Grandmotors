import { describe, it, expect, beforeEach } from 'vitest';
import { POST as adminLogin } from '../pages/api/admin/login';
import { POST as adminLogout } from '../pages/api/admin/logout';
import { GET as adminListBookings } from '../pages/api/admin/bookings';
import { GET as adminGetBooking, PATCH as adminPatchBooking } from '../pages/api/admin/bookings/[id]';

const ADMIN_KEY = 'test_admin_secret_key';

// --- Mocks ---------------------------------------------------------------

class MockSession {
  store = new Map<string, any>();
  destroyed = false;
  regenerated = false;
  async get(key: string) { return this.store.get(key); }
  set(key: string, value: any) { this.store.set(key, value); }
  destroy() { this.store.clear(); this.destroyed = true; }
  regenerate() { this.regenerated = true; }
}

class MockD1 {
  records = new Map<string, any>();
  prepare(query: string) {
    const self = this;
    let bound: any[] = [];
    const stmt = {
      bind(...p: any[]) { bound = p; return stmt; },
      async all() {
        const q = query.trim().toUpperCase();
        if (q.startsWith('SELECT * FROM BOOKINGS ORDER BY')) {
          const list = Array.from(self.records.values()).sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          return { results: list };
        }
        if (q.includes('WHERE ID = ? OR ID = ? OR ID = ?') || q.includes('WHERE ID = ?')) {
          const wanted = bound.map((p) => String(p).toUpperCase());
          const matches = Array.from(self.records.values()).filter((r) =>
            wanted.includes(String(r.id).toUpperCase())
          );
          return { results: matches };
        }
        return { results: [] };
      },
      async run() {
        const q = query.trim().toUpperCase();
        if (q.startsWith('UPDATE BOOKINGS SET STATUS = ?')) {
          const [status, ...ids] = bound;
          const wanted = ids.map((p) => String(p).toUpperCase());
          for (const [key, rec] of self.records.entries()) {
            if (wanted.includes(key.toUpperCase())) { rec.status = status; return { success: true }; }
          }
        }
        return { success: true };
      },
    };
    return stmt;
  }
}

function makeCtx(opts: {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
  session?: MockSession;
  db?: MockD1;
  withKey?: boolean;
  params?: Record<string, string>;
}) {
  const session = opts.session ?? new MockSession();
  const db = opts.db ?? new MockD1();
  const request = new Request('http://localhost/api/admin', {
    method: opts.method ?? 'GET',
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  const env: any = { DB: db };
  if (opts.withKey !== false) env.ADMIN_API_KEY = ADMIN_KEY;
  return {
    request,
    session,
    locals: { runtime: { env } },
    params: opts.params || {},
    _db: db,
  } as any;
}

function authedSession() {
  const s = new MockSession();
  s.set('admin', true);
  s.set('adminSince', Date.now());
  return s;
}

// --- Login / Logout ------------------------------------------------------

describe('Admin login/logout endpoints', () => {
  it('rejects login when no admin key is configured (503)', async () => {
    const ctx = makeCtx({ method: 'POST', body: { password: 'x' }, withKey: false });
    const resp = await (adminLogin as any)(ctx);
    expect(resp.status).toBe(503);
  });

  it('rejects an incorrect password with 401 and does not set session', async () => {
    const ctx = makeCtx({ method: 'POST', body: { password: 'wrong' } });
    const resp = await (adminLogin as any)(ctx);
    expect(resp.status).toBe(401);
    expect(await ctx.session.get('admin')).toBeUndefined();
  });

  it('accepts the correct password, sets session, regenerates id', async () => {
    const ctx = makeCtx({ method: 'POST', body: { password: ADMIN_KEY } });
    const resp = await (adminLogin as any)(ctx);
    expect(resp.status).toBe(200);
    expect(await ctx.session.get('admin')).toBe(true);
    expect(typeof (await ctx.session.get('adminSince'))).toBe('number');
    expect(ctx.session.regenerated).toBe(true);
  });

  it('logout destroys the session', async () => {
    const session = authedSession();
    const ctx = makeCtx({ method: 'POST', session });
    const resp = await (adminLogout as any)(ctx);
    expect(resp.status).toBe(200);
    expect(session.destroyed).toBe(true);
    expect(await session.get('admin')).toBeUndefined();
  });
});

// --- Protected listing / details / status -------------------------------

describe('Admin bookings API (session + header auth)', () => {
  let db: MockD1;

  beforeEach(() => {
    db = new MockD1();
    db.records.set('GM-700700', {
      id: 'GM-700700',
      customerName: 'Test User',
      phoneNumber: '+91 90000 00000',
      email: 'test@example.com',
      vehicleMake: 'BMW',
      vehicleModel: 'M5',
      registrationNumber: 'TS 09 ZZ 1000',
      serviceCategory: 'brakes',
      specificService: 'Pad replacement',
      preferredDate: '2026-10-20',
      preferredTime: 'Morning',
      status: 'Pending',
      additionalMessage: 'Private note',
      createdAt: '2026-10-05T00:00:00Z',
    });
  });

  it('denies unauthenticated listing (401)', async () => {
    const ctx = makeCtx({ db, session: new MockSession() });
    const resp = await (adminListBookings as any)(ctx);
    expect(resp.status).toBe(401);
  });

  it('allows listing with a valid admin session and returns full records (PII)', async () => {
    const ctx = makeCtx({ db, session: authedSession() });
    const resp = await (adminListBookings as any)(ctx);
    expect(resp.status).toBe(200);
    const data = await resp.json();
    expect(Array.isArray(data.bookings)).toBe(true);
    expect(data.bookings[0].phoneNumber).toBe('+91 90000 00000');
    expect(data.bookings[0].email).toBe('test@example.com');
  });

  it('allows listing with a valid admin header key', async () => {
    const ctx = makeCtx({ db, session: new MockSession(), headers: { Authorization: `Bearer ${ADMIN_KEY}` } });
    const resp = await (adminListBookings as any)(ctx);
    expect(resp.status).toBe(200);
  });

  it('denies single-booking fetch without auth (401)', async () => {
    const ctx = makeCtx({ db, session: new MockSession(), params: { id: 'GM-700700' } });
    const resp = await (adminGetBooking as any)(ctx);
    expect(resp.status).toBe(401);
  });

  it('fetches a single booking with admin session', async () => {
    const ctx = makeCtx({ db, session: authedSession(), params: { id: 'GM-700700' } });
    const resp = await (adminGetBooking as any)(ctx);
    expect(resp.status).toBe(200);
    const data = await resp.json();
    expect(data.id).toBe('GM-700700');
    expect(data.additionalMessage).toBe('Private note');
  });

  it('returns 404 for an unknown booking', async () => {
    const ctx = makeCtx({ db, session: authedSession(), params: { id: 'GM-000001' } });
    const resp = await (adminGetBooking as any)(ctx);
    expect(resp.status).toBe(404);
  });

  it('returns 400 for malformed booking id', async () => {
    const ctx = makeCtx({ db, session: authedSession(), params: { id: 'bad id!' } });
    const resp = await (adminGetBooking as any)(ctx);
    expect(resp.status).toBe(400);
  });

  it('denies PATCH without auth (401) and leaves status unchanged', async () => {
    const ctx = makeCtx({ db, session: new MockSession(), method: 'PATCH', body: { status: 'Confirmed' }, params: { id: 'GM-700700' } });
    const resp = await (adminPatchBooking as any)(ctx);
    expect(resp.status).toBe(401);
    expect(db.records.get('GM-700700')?.status).toBe('Pending');
  });

  it('rejects an invalid status value (400)', async () => {
    const ctx = makeCtx({ db, session: authedSession(), method: 'PATCH', body: { status: 'Nope' }, params: { id: 'GM-700700' } });
    const resp = await (adminPatchBooking as any)(ctx);
    expect(resp.status).toBe(400);
  });

  it('updates status for every allowed value with admin session', async () => {
    for (const status of ['Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled']) {
      const ctx = makeCtx({ db, session: authedSession(), method: 'PATCH', body: { status }, params: { id: 'GM-700700' } });
      const resp = await (adminPatchBooking as any)(ctx);
      expect(resp.status).toBe(200);
      expect(db.records.get('GM-700700')?.status).toBe(status);
    }
  });

  it('resolves numeric-only id to the GM- record', async () => {
    const ctx = makeCtx({ db, session: authedSession(), params: { id: '700700' } });
    const resp = await (adminGetBooking as any)(ctx);
    expect(resp.status).toBe(200);
    const data = await resp.json();
    expect(data.id).toBe('GM-700700');
  });
});
