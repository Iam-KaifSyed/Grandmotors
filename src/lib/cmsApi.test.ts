import { describe, it, expect, beforeEach } from 'vitest';
import { createTestD1Database } from './testDbHelper';
import { MockStorageDriver } from './testStorageDriver';
import { GET as getMedia, POST as postMedia } from '../pages/api/admin/cms/media/index';
import { DELETE as deleteMedia } from '../pages/api/admin/cms/media/[id]';
import { POST as assignMedia } from '../pages/api/admin/cms/media/assign';
import { GET as getServices, POST as postService } from '../pages/api/admin/cms/services/index';
import { PATCH as patchService } from '../pages/api/admin/cms/services/[id]';
import { POST as reorderServicesApi } from '../pages/api/admin/cms/services/reorder';
import { GET as getCategories } from '../pages/api/admin/cms/service-categories/index';
import { GET as getBookingConfig, PUT as putBookingConfig } from '../pages/api/admin/cms/booking-form-config';
import { GET as serveMedia } from '../pages/media/[key]';

class MockSession {
  store = new Map<string, any>();
  async get(key: string) {
    return this.store.get(key);
  }
  set(key: string, value: any) {
    this.store.set(key, value);
  }
  destroy() {
    this.store.clear();
  }
}

function authedSession() {
  const s = new MockSession();
  s.set('admin', true);
  s.set('adminSince', Date.now());
  return s;
}

function makeApiCtx(opts: {
  method?: string;
  url?: string;
  body?: any;
  formData?: FormData;
  session?: MockSession;
  db?: any;
  driver?: any;
  params?: Record<string, string>;
}) {
  const session = opts.session ?? authedSession();
  const db = opts.db;
  const driver = opts.driver;

  const method = opts.method || (opts.formData || opts.body !== undefined ? 'POST' : 'GET');
  let request: Request;
  if (opts.formData) {
    request = new Request(opts.url || 'http://localhost/api/admin/cms', {
      method,
      body: opts.formData,
    });
  } else {
    request = new Request(opts.url || 'http://localhost/api/admin/cms', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: opts.body !== undefined && method !== 'GET' && method !== 'HEAD' ? JSON.stringify(opts.body) : undefined,
    });
  }

  const env: any = { DB: db, MEDIA: driver ? {
    put: (k: string, v: any, opt: any) => driver.put(k, v, { mimeType: opt?.httpMetadata?.contentType }),
    get: async (k: string) => {
      const it = await driver.get(k);
      if (!it) return null;
      return {
        arrayBuffer: async () => it.bytes.buffer,
        httpMetadata: { contentType: it.mimeType },
      };
    },
    delete: (k: string) => driver.delete(k),
  } : undefined };

  return {
    request,
    session,
    url: new URL(opts.url || 'http://localhost/api/admin/cms'),
    locals: { runtime: { env } },
    params: opts.params || {},
  } as any;
}

describe('CMS Admin API Handlers', () => {
  let db: any;
  let driver: MockStorageDriver;

  const validPngBytes = new Uint8Array([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44,
    0x52, 0x00, 0x00, 0x00, 0x64, 0x00, 0x00, 0x00, 0x64, 0x08, 0x06,
  ]);

  beforeEach(() => {
    db = createTestD1Database();
    driver = new MockStorageDriver();
  });

  it('rejects unauthenticated requests across CMS endpoints (401)', async () => {
    const unauthed = new MockSession();
    const ctx = makeApiCtx({ db, driver, session: unauthed });

    expect((await (getMedia as any)(ctx)).status).toBe(401);
    expect((await (getServices as any)(ctx)).status).toBe(401);
    expect((await (getCategories as any)(ctx)).status).toBe(401);
    expect((await (getBookingConfig as any)(ctx)).status).toBe(401);
  });

  it('handles media upload, list, replace, assign, delete workflow', async () => {
    // 1. Upload
    const fd = new FormData();
    const file = new File([validPngBytes], 'car-gallery.png', { type: 'image/png' });
    fd.append('file', file);

    const uploadCtx = makeApiCtx({ db, driver, formData: fd });
    const uploadRes = await (postMedia as any)(uploadCtx);
    expect(uploadRes.status).toBe(201);
    const uploadData = await uploadRes.json();
    const assetId = uploadData.asset.id;

    // 2. List
    const listCtx = makeApiCtx({ db, driver });
    const listRes = await (getMedia as any)(listCtx);
    expect(listRes.status).toBe(200);
    const listData = await listRes.json();
    expect(listData.assets.some((a: any) => a.id === assetId)).toBe(true);

    // 3. Assign
    const assignCtx = makeApiCtx({
      db,
      driver,
      body: { usageLocation: 'services-hero', mediaAssetId: assetId },
    });
    const assignRes = await (assignMedia as any)(assignCtx);
    expect(assignRes.status).toBe(200);

    // 4. Delete while in use is rejected (409)
    const deleteBlockedCtx = makeApiCtx({
      db,
      driver,
      body: { confirmFilename: 'car-gallery.png' },
      params: { id: assetId },
    });
    const deleteBlockedRes = await (deleteMedia as any)(deleteBlockedCtx);
    expect(deleteBlockedRes.status).toBe(409);

    // 5. Reassign away from hero
    const otherAssetId = listData.assets.find((a: any) => a.id !== assetId)?.id;
    if (otherAssetId) {
      await (assignMedia as any)(
        makeApiCtx({
          db,
          driver,
          body: { usageLocation: 'services-hero', mediaAssetId: otherAssetId },
        })
      );

      // 6. Delete succeeds
      const deleteCtx = makeApiCtx({
        db,
        driver,
        body: { confirmFilename: 'car-gallery.png' },
        params: { id: assetId },
      });
      const deleteRes = await (deleteMedia as any)(deleteCtx);
      expect(deleteRes.status).toBe(200);
    }
  });

  it('handles service creation, update, and reordering via API', async () => {
    // Create
    const createCtx = makeApiCtx({
      db,
      body: { title: 'Transmission Overhaul', summary: 'Gearbox repair' },
    });
    const createRes = await (postService as any)(createCtx);
    expect(createRes.status).toBe(201);
    const created = (await createRes.json()).service;

    // Patch
    const patchCtx = makeApiCtx({
      db,
      body: { active: false },
      params: { id: created.id },
    });
    const patchRes = await (patchService as any)(patchCtx);
    expect(patchRes.status).toBe(200);
    expect((await patchRes.json()).service.active).toBe(false);

    // Reorder
    const reorderCtx = makeApiCtx({
      db,
      body: { orderedIds: [created.id, 'brakes'] },
    });
    const reorderRes = await (reorderServicesApi as any)(reorderCtx);
    expect(reorderRes.status).toBe(200);
  });

  it('handles booking form config GET and PUT with essential protection', async () => {
    const getCtx = makeApiCtx({ db });
    const getRes = await (getBookingConfig as any)(getCtx);
    expect(getRes.status).toBe(200);

    // PUT valid change
    const putCtx = makeApiCtx({
      db,
      body: { heading: 'Custom Header Title' },
    });
    const putRes = await (putBookingConfig as any)(putCtx);
    expect(putRes.status).toBe(200);
    expect((await putRes.json()).config.heading).toBe('Custom Header Title');

    // PUT invalid essential field disable
    const putInvalidCtx = makeApiCtx({
      db,
      body: { optionalFieldVisibility: { customerName: false } },
    });
    const putInvalidRes = await (putBookingConfig as any)(putInvalidCtx);
    expect(putInvalidRes.status).toBe(422);
  });

  it('serves media binaries through /media/[key]', async () => {
    const objectKey = '11111111-2222-3333-4444-555555555555.png';
    await driver.put(objectKey, validPngBytes, { mimeType: 'image/png' });

    const serveCtx = makeApiCtx({
      driver,
      params: { key: objectKey },
    });

    const resp = await (serveMedia as any)(serveCtx);
    expect(resp.status).toBe(200);
    expect(resp.headers.get('Content-Type')).toBe('image/png');
    expect(resp.headers.get('Cache-Control')).toContain('immutable');

    // Invalid key 404
    const badKeyCtx = makeApiCtx({
      driver,
      params: { key: 'invalid..key.php' },
    });
    const badResp = await (serveMedia as any)(badKeyCtx);
    expect(badResp.status).toBe(404);
  });
});
