import { describe, it, expect, beforeEach } from 'vitest';
import { POST as adminLogin } from '../pages/api/admin/login';
import { POST as adminLogout } from '../pages/api/admin/logout';
import { GET as adminListBookings } from '../pages/api/admin/bookings';
import {
  GET as adminGetBooking,
  PATCH as adminPatchBooking,
  DELETE as adminDeleteBooking,
} from '../pages/api/admin/bookings/[id]';
import { POST as adminArchiveBooking } from '../pages/api/admin/bookings/[id]/archive';
import { POST as adminRestoreBooking } from '../pages/api/admin/bookings/[id]/restore';
import { GET as getPublicBooking } from '../pages/api/bookings/[id]';
import { calculateRepeatCustomers } from './customerMatching';

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
  auditLogs: any[] = [];
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
        if (q.startsWith('INSERT INTO AUDIT_LOG')) {
          const [id, entityType, entityId, action, actorAdmin, summaryJson] = bound;
          let summary = summaryJson;
          try {
            summary = summaryJson ? JSON.parse(summaryJson) : summaryJson;
          } catch {}
          self.auditLogs.push({ id, entityType, entityId, action, actorAdmin, summary });
          return { success: true };
        }
        if (q.startsWith('UPDATE BOOKINGS SET STATUS = ?')) {
          const [status, ...ids] = bound;
          const wanted = ids.map((p) => String(p).toUpperCase());
          for (const [key, rec] of self.records.entries()) {
            if (wanted.includes(key.toUpperCase())) { rec.status = status; return { success: true }; }
          }
        }
        if (q.startsWith('UPDATE BOOKINGS SET ISARCHIVED = ?')) {
          const [isArchived, archivedAt, ...ids] = bound;
          const wanted = ids.map((p) => String(p).toUpperCase());
          for (const [key, rec] of self.records.entries()) {
            if (wanted.includes(key.toUpperCase())) {
              rec.isArchived = isArchived;
              rec.archivedAt = archivedAt;
              return { success: true };
            }
          }
        }
        if (q.startsWith('UPDATE BOOKINGS SET ISARCHIVED = 1')) {
          const [archivedAt, ...ids] = bound;
          const wanted = ids.map((p) => String(p).toUpperCase());
          for (const [key, rec] of self.records.entries()) {
            if (wanted.includes(key.toUpperCase())) {
              rec.isArchived = 1;
              rec.archivedAt = archivedAt;
              return { success: true };
            }
          }
        }
        if (q.startsWith('UPDATE BOOKINGS SET ISARCHIVED = 0')) {
          const [...ids] = bound;
          const wanted = ids.map((p) => String(p).toUpperCase());
          for (const [key, rec] of self.records.entries()) {
            if (wanted.includes(key.toUpperCase())) {
              rec.isArchived = 0;
              rec.archivedAt = null;
              return { success: true };
            }
          }
        }
        if (q.startsWith('DELETE FROM BOOKINGS WHERE')) {
          const wanted = bound.map((p) => String(p).toUpperCase());
          for (const [key] of self.records.entries()) {
            if (wanted.includes(key.toUpperCase())) {
              self.records.delete(key);
              return { success: true };
            }
          }
        }
        return { success: true };
      },
    };
    return stmt;
  }
}

function makeCtx(opts: {
  url?: string;
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
  const request = new Request(opts.url || 'http://localhost/api/admin', {
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

// --- Archive, Restore, and Delete Lifecycle Tests --------------------------

describe('Admin Bookings Archive, Restore, and Safe Deletion Lifecycle', () => {
  let db: MockD1;

  beforeEach(() => {
    db = new MockD1();
    db.records.set('GM-700700', {
      id: 'GM-700700',
      customerName: 'Aarav Patel',
      phoneNumber: '+91 98490 12345',
      email: 'aarav@example.com',
      vehicleMake: 'BMW',
      vehicleModel: 'M5',
      registrationNumber: 'TS 09 ZZ 1000',
      serviceCategory: 'brakes',
      specificService: 'Pad replacement',
      preferredDate: '2026-10-20',
      preferredTime: 'Morning',
      status: 'Pending',
      source: 'Google Search',
      additionalMessage: 'Customer request',
      isArchived: 0,
      archivedAt: null,
      createdAt: '2026-10-05T00:00:00Z',
    });
    db.records.set('GM-700701', {
      id: 'GM-700701',
      customerName: 'Aarav Patel',
      phoneNumber: '+91 98490 12345', // Same customer phone: repeat customer
      email: 'aarav@example.com',
      vehicleMake: 'BMW',
      vehicleModel: 'M5',
      registrationNumber: 'TS 09 ZZ 1000',
      serviceCategory: 'oil',
      specificService: 'Full service',
      preferredDate: '2026-09-10',
      preferredTime: 'Evening',
      status: 'Completed',
      source: 'Direct Visit',
      additionalMessage: 'Prior booking',
      isArchived: 1,
      archivedAt: '2026-09-15T12:00:00Z',
      createdAt: '2026-09-01T00:00:00Z',
    });
  });

  describe('Admin listing filter by archive status', () => {
    it('returns all bookings with isArchived flags by default', async () => {
      const ctx = makeCtx({ db, session: authedSession(), url: 'http://localhost/api/admin/bookings' });
      const resp = await (adminListBookings as any)(ctx);
      expect(resp.status).toBe(200);
      const data = await resp.json();
      expect(data.bookings.length).toBe(2);
      expect(data.bookings.some((b: any) => b.id === 'GM-700700' && b.isArchived === false)).toBe(true);
      expect(data.bookings.some((b: any) => b.id === 'GM-700701' && b.isArchived === true)).toBe(true);
    });

    it('filters only active bookings when ?archived=false', async () => {
      const ctx = makeCtx({ db, session: authedSession(), url: 'http://localhost/api/admin/bookings?archived=false' });
      const resp = await (adminListBookings as any)(ctx);
      expect(resp.status).toBe(200);
      const data = await resp.json();
      expect(data.bookings.length).toBe(1);
      expect(data.bookings[0].id).toBe('GM-700700');
      expect(data.bookings[0].isArchived).toBe(false);
    });

    it('filters only archived bookings when ?archived=true', async () => {
      const ctx = makeCtx({ db, session: authedSession(), url: 'http://localhost/api/admin/bookings?archived=true' });
      const resp = await (adminListBookings as any)(ctx);
      expect(resp.status).toBe(200);
      const data = await resp.json();
      expect(data.bookings.length).toBe(1);
      expect(data.bookings[0].id).toBe('GM-700701');
      expect(data.bookings[0].isArchived).toBe(true);
    });
  });

  describe('Archive and Restore via PATCH /api/admin/bookings/:id', () => {
    it('archives a booking via { isArchived: true } and writes audit log', async () => {
      const ctx = makeCtx({
        db,
        session: authedSession(),
        method: 'PATCH',
        body: { isArchived: true },
        params: { id: 'GM-700700' },
      });
      const resp = await (adminPatchBooking as any)(ctx);
      expect(resp.status).toBe(200);
      const data = await resp.json();
      expect(data.success).toBe(true);
      expect(data.isArchived).toBe(true);
      expect(data.archivedAt).toBeTruthy();

      const record = db.records.get('GM-700700');
      expect(record.isArchived).toBe(1);
      expect(record.archivedAt).toBeTruthy();
      // Status and customer info remain intact
      expect(record.status).toBe('Pending');
      expect(record.customerName).toBe('Aarav Patel');

      // Verify audit log
      const audit = db.auditLogs.find((l) => l.entityId === 'GM-700700' && l.action === 'archive');
      expect(audit).toBeDefined();
      expect(audit.entityType).toBe('booking');
      expect(audit.actorAdmin).toBe('admin');
    });

    it('archives a booking via { action: "archive" } and writes audit log', async () => {
      const ctx = makeCtx({
        db,
        session: authedSession(),
        method: 'PATCH',
        body: { action: 'archive' },
        params: { id: 'GM-700700' },
      });
      const resp = await (adminPatchBooking as any)(ctx);
      expect(resp.status).toBe(200);
      const data = await resp.json();
      expect(data.success).toBe(true);
      expect(data.isArchived).toBe(true);

      const record = db.records.get('GM-700700');
      expect(record.isArchived).toBe(1);
    });

    it('restores an archived booking via { isArchived: false } and writes audit log', async () => {
      const ctx = makeCtx({
        db,
        session: authedSession(),
        method: 'PATCH',
        body: { isArchived: false },
        params: { id: 'GM-700701' },
      });
      const resp = await (adminPatchBooking as any)(ctx);
      expect(resp.status).toBe(200);
      const data = await resp.json();
      expect(data.success).toBe(true);
      expect(data.isArchived).toBe(false);
      expect(data.archivedAt).toBeNull();

      const record = db.records.get('GM-700701');
      expect(record.isArchived).toBe(0);
      expect(record.archivedAt).toBeNull();
      // Status remains original completed status
      expect(record.status).toBe('Completed');

      // Verify audit log
      const audit = db.auditLogs.find((l) => l.entityId === 'GM-700701' && l.action === 'restore');
      expect(audit).toBeDefined();
      expect(audit.action).toBe('restore');
    });

    it('restores an archived booking via { action: "restore" } and writes audit log', async () => {
      const ctx = makeCtx({
        db,
        session: authedSession(),
        method: 'PATCH',
        body: { action: 'restore' },
        params: { id: 'GM-700701' },
      });
      const resp = await (adminPatchBooking as any)(ctx);
      expect(resp.status).toBe(200);
      const data = await resp.json();
      expect(data.success).toBe(true);
      expect(data.isArchived).toBe(false);

      const record = db.records.get('GM-700701');
      expect(record.isArchived).toBe(0);
    });
  });

  describe('Dedicated POST /archive and POST /restore endpoints', () => {
    it('archives via POST /api/admin/bookings/:id/archive and writes audit log', async () => {
      const ctx = makeCtx({
        db,
        session: authedSession(),
        method: 'POST',
        params: { id: 'GM-700700' },
      });
      const resp = await (adminArchiveBooking as any)(ctx);
      expect(resp.status).toBe(200);
      const data = await resp.json();
      expect(data.success).toBe(true);
      expect(data.isArchived).toBe(true);
      expect(data.archivedAt).toBeTruthy();

      const record = db.records.get('GM-700700');
      expect(record.isArchived).toBe(1);

      const audit = db.auditLogs.find((l) => l.entityId === 'GM-700700' && l.action === 'archive');
      expect(audit).toBeDefined();
    });

    it('restores via POST /api/admin/bookings/:id/restore and writes audit log', async () => {
      const ctx = makeCtx({
        db,
        session: authedSession(),
        method: 'POST',
        params: { id: 'GM-700701' },
      });
      const resp = await (adminRestoreBooking as any)(ctx);
      expect(resp.status).toBe(200);
      const data = await resp.json();
      expect(data.success).toBe(true);
      expect(data.isArchived).toBe(false);
      expect(data.archivedAt).toBeNull();

      const record = db.records.get('GM-700701');
      expect(record.isArchived).toBe(0);

      const audit = db.auditLogs.find((l) => l.entityId === 'GM-700701' && l.action === 'restore');
      expect(audit).toBeDefined();
    });

    it('returns 404 when archiving non-existent booking', async () => {
      const ctx = makeCtx({
        db,
        session: authedSession(),
        method: 'POST',
        params: { id: 'GM-999999' },
      });
      const resp = await (adminArchiveBooking as any)(ctx);
      expect(resp.status).toBe(404);
    });

    it('returns 404 when restoring non-existent booking', async () => {
      const ctx = makeCtx({
        db,
        session: authedSession(),
        method: 'POST',
        params: { id: 'GM-999999' },
      });
      const resp = await (adminRestoreBooking as any)(ctx);
      expect(resp.status).toBe(404);
    });
  });

  describe('Authorization guards (401)', () => {
    it('denies unauthenticated archive on PATCH (401)', async () => {
      const ctx = makeCtx({
        db,
        session: new MockSession(),
        method: 'PATCH',
        body: { isArchived: true },
        params: { id: 'GM-700700' },
      });
      const resp = await (adminPatchBooking as any)(ctx);
      expect(resp.status).toBe(401);
      expect(db.records.get('GM-700700')?.isArchived).toBe(0);
    });

    it('denies unauthenticated restore on PATCH (401)', async () => {
      const ctx = makeCtx({
        db,
        session: new MockSession(),
        method: 'PATCH',
        body: { isArchived: false },
        params: { id: 'GM-700701' },
      });
      const resp = await (adminPatchBooking as any)(ctx);
      expect(resp.status).toBe(401);
      expect(db.records.get('GM-700701')?.isArchived).toBe(1);
    });

    it('denies unauthenticated POST /archive (401)', async () => {
      const ctx = makeCtx({
        db,
        session: new MockSession(),
        method: 'POST',
        params: { id: 'GM-700700' },
      });
      const resp = await (adminArchiveBooking as any)(ctx);
      expect(resp.status).toBe(401);
      expect(db.records.get('GM-700700')?.isArchived).toBe(0);
    });

    it('denies unauthenticated POST /restore (401)', async () => {
      const ctx = makeCtx({
        db,
        session: new MockSession(),
        method: 'POST',
        params: { id: 'GM-700701' },
      });
      const resp = await (adminRestoreBooking as any)(ctx);
      expect(resp.status).toBe(401);
      expect(db.records.get('GM-700701')?.isArchived).toBe(1);
    });

    it('denies unauthenticated DELETE /api/admin/bookings/:id (401)', async () => {
      const ctx = makeCtx({
        db,
        session: new MockSession(),
        method: 'DELETE',
        params: { id: 'GM-700700' },
      });
      const resp = await (adminDeleteBooking as any)(ctx);
      expect(resp.status).toBe(401);
      expect(db.records.has('GM-700700')).toBe(true);
    });
  });

  describe('Permanent Deletion via DELETE /api/admin/bookings/:id', () => {
    it('returns 400 for malformed booking id', async () => {
      const ctx = makeCtx({
        db,
        session: authedSession(),
        method: 'DELETE',
        params: { id: 'invalid-id-@#' },
      });
      const resp = await (adminDeleteBooking as any)(ctx);
      expect(resp.status).toBe(400);
    });

    it('returns 404 for non-existent booking id', async () => {
      const ctx = makeCtx({
        db,
        session: authedSession(),
        method: 'DELETE',
        params: { id: 'GM-999999' },
      });
      const resp = await (adminDeleteBooking as any)(ctx);
      expect(resp.status).toBe(404);
    });

    it('permanently deletes an existing booking with admin auth and records audit log', async () => {
      const ctx = makeCtx({
        db,
        session: authedSession(),
        method: 'DELETE',
        params: { id: 'GM-700700' },
      });
      const resp = await (adminDeleteBooking as any)(ctx);
      expect(resp.status).toBe(200);
      const data = await resp.json();
      expect(data.success).toBe(true);
      expect(data.id).toBe('GM-700700');

      // Ensure record was deleted from database
      expect(db.records.has('GM-700700')).toBe(false);

      // Verify audit trail captured deleted record details
      const audit = db.auditLogs.find((l) => l.entityId === 'GM-700700' && l.action === 'delete');
      expect(audit).toBeDefined();
      expect(audit.entityType).toBe('booking');
      expect(audit.actorAdmin).toBe('admin');
      expect(audit.summary.customerName).toBe('Aarav Patel');
      expect(audit.summary.registrationNumber).toBe('TS 09 ZZ 1000');
    });

    it('works with Authorization header Bearer token', async () => {
      const ctx = makeCtx({
        db,
        session: new MockSession(),
        headers: { Authorization: `Bearer ${ADMIN_KEY}` },
        method: 'DELETE',
        params: { id: 'GM-700701' },
      });
      const resp = await (adminDeleteBooking as any)(ctx);
      expect(resp.status).toBe(200);
      expect(db.records.has('GM-700701')).toBe(false);
    });
  });

  describe('Customer Tracking & Status Integrity', () => {
    it('ensures archived bookings remain accessible to customer tracking without changing status', async () => {
      // GM-700701 is archived with status 'Completed'
      const ctx = makeCtx({
        db,
        session: new MockSession(), // public customer request, unauthenticated
        params: { id: 'GM-700701' },
      });
      const resp = await (getPublicBooking as any)(ctx);
      expect(resp.status).toBe(200);
      const data = await resp.json();

      expect(data.id).toBe('GM-700701');
      expect(data.status).toBe('Completed');
      expect(data.customerName).toBe('Aarav Patel');
      expect(data.vehicleMake).toBe('BMW');
      // Public customer tracking omits sensitive PII
      expect(data.phoneNumber).toBeUndefined();
    });

    it('ensures customer tracking also resolves without GM- prefix', async () => {
      const ctx = makeCtx({
        db,
        session: new MockSession(),
        params: { id: '700701' },
      });
      const resp = await (getPublicBooking as any)(ctx);
      expect(resp.status).toBe(200);
      const data = await resp.json();
      expect(data.id).toBe('GM-700701');
    });
  });

  describe('Multiple / Repeat Customer Preservation', () => {
    it('preserves repeat customer linkages and history across active and archived bookings without merging', () => {
      const allBookings = [
        {
          id: 'GM-700700',
          phoneNumber: '+91 98490 12345',
          email: 'aarav@example.com',
          isArchived: false,
        },
        {
          id: 'GM-700701',
          phoneNumber: '98490 12345', // Same phone number, different format
          email: 'aarav.work@example.com',
          isArchived: true,
        },
      ];

      // Calculate repeat customers on full list
      const repeatMap = calculateRepeatCustomers(allBookings);

      const activeBooking = repeatMap.get('GM-700700');
      expect(activeBooking).toBeDefined();
      expect(activeBooking?.isRepeatCustomer).toBe(true);
      expect(activeBooking?.totalBookingCount).toBe(2);
      expect(activeBooking?.otherBookingIds).toEqual(['GM-700701']);

      const archivedBooking = repeatMap.get('GM-700701');
      expect(archivedBooking).toBeDefined();
      expect(archivedBooking?.isRepeatCustomer).toBe(true);
      expect(archivedBooking?.totalBookingCount).toBe(2);
      expect(archivedBooking?.otherBookingIds).toEqual(['GM-700700']);

      // Both records remain distinct (no auto-deletion, no auto-merge)
      expect(allBookings.length).toBe(2);
    });
  });
});

