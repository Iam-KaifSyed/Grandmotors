import { describe, it, expect, beforeEach } from 'vitest';
import { createTestD1Database } from './testDbHelper';
import { MockStorageDriver } from './testStorageDriver';
import { createMediaUpload } from './mediaStore';
import { GET as getGallery, POST as postGallery } from '../pages/api/admin/cms/gallery/index';
import { PUT as putGallery, DELETE as deleteGallery } from '../pages/api/admin/cms/gallery/[id]';
import { POST as reorderGallery } from '../pages/api/admin/cms/gallery/reorder';

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
  session?: MockSession;
  db?: any;
  params?: Record<string, string>;
}) {
  const session = opts.session ?? authedSession();
  const db = opts.db;
  const method = opts.method || (opts.body !== undefined ? 'POST' : 'GET');
  const request = new Request(opts.url || 'http://localhost/api/admin/cms/gallery', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: opts.body !== undefined && method !== 'GET' ? JSON.stringify(opts.body) : undefined,
  });

  const env: any = { DB: db };

  return {
    request,
    session,
    url: new URL(opts.url || 'http://localhost/api/admin/cms/gallery'),
    locals: { runtime: { env } },
    params: opts.params || {},
  } as any;
}

describe('Gallery Admin API Endpoints', () => {
  let db: any;
  let driver: MockStorageDriver;
  let sampleAssetId: string;

  const validPngBytes = new Uint8Array([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44,
    0x52, 0x00, 0x00, 0x00, 0x64, 0x00, 0x00, 0x00, 0x64, 0x08, 0x06,
  ]);

  beforeEach(async () => {
    db = createTestD1Database();
    driver = new MockStorageDriver();

    const asset = await createMediaUpload(
      db,
      driver,
      {
        filename: 'ferrari-brake-service.png',
        mimeType: 'image/png',
        bytes: validPngBytes,
      },
      'admin'
    );
    sampleAssetId = asset.id;
  });

  it('enforces authentication across all gallery API endpoints', async () => {
    const unauthed = new MockSession();

    // GET
    const getRes = await (getGallery as any)(makeApiCtx({ db, session: unauthed }));
    expect(getRes.status).toBe(401);

    // POST
    const postRes = await (postGallery as any)(
      makeApiCtx({ db, session: unauthed, body: { mediaAssetId: sampleAssetId, title: 'Test' } })
    );
    expect(postRes.status).toBe(401);

    // PUT
    const putRes = await (putGallery as any)(
      makeApiCtx({ db, session: unauthed, params: { id: 'gal-1' }, body: { title: 'Updated' } })
    );
    expect(putRes.status).toBe(401);

    // DELETE
    const delRes = await (deleteGallery as any)(
      makeApiCtx({ db, session: unauthed, params: { id: 'gal-1' } })
    );
    expect(delRes.status).toBe(401);

    // REORDER
    const reorderRes = await (reorderGallery as any)(
      makeApiCtx({ db, session: unauthed, body: { orderedIds: ['gal-1'] } })
    );
    expect(reorderRes.status).toBe(401);
  });

  it('performs full gallery item lifecycle: create, list, update, reorder, delete', async () => {
    // 1. Create item 1
    const createCtx1 = makeApiCtx({
      db,
      body: {
        mediaAssetId: sampleAssetId,
        title: 'Ferrari 488 Pista Ceramic Brakes',
        description: 'Track-ready brake bleed and rotor inspection',
        categoryId: 'brakes',
        published: true,
      },
    });
    const createRes1 = await (postGallery as any)(createCtx1);
    expect(createRes1.status).toBe(201);
    const item1 = (await createRes1.json()).item;
    expect(item1.id).toBeDefined();
    expect(item1.title).toBe('Ferrari 488 Pista Ceramic Brakes');

    // 2. Create item 2
    const createCtx2 = makeApiCtx({
      db,
      body: {
        mediaAssetId: sampleAssetId,
        title: 'Lamborghini Huracan V10 Spark Plug Change',
        description: 'OEM NGK plugs torque verified',
        categoryId: 'engine-diagnostics',
        published: false,
      },
    });
    const createRes2 = await (postGallery as any)(createCtx2);
    expect(createRes2.status).toBe(201);
    const item2 = (await createRes2.json()).item;

    // 3. List gallery items
    const listCtx = makeApiCtx({ db });
    const listRes = await (getGallery as any)(listCtx);
    expect(listRes.status).toBe(200);
    const listData = await listRes.json();
    expect(listData.items.length).toBe(2);
    expect(listData.categories.length).toBeGreaterThan(0);

    // Filter by category in GET query
    const filterCtx = makeApiCtx({
      db,
      url: 'http://localhost/api/admin/cms/gallery?category=brakes',
    });
    const filterRes = await (getGallery as any)(filterCtx);
    const filterData = await filterRes.json();
    expect(filterData.items.length).toBe(1);
    expect(filterData.items[0].title).toBe('Ferrari 488 Pista Ceramic Brakes');

    // 4. Update item 2 to published
    const updateCtx = makeApiCtx({
      db,
      method: 'PUT',
      params: { id: item2.id },
      body: {
        title: 'Lamborghini Huracan V10 Major Service',
        description: 'Complete inspection and spark plug service',
        categoryId: 'engine-diagnostics',
        published: true,
      },
    });
    const updateRes = await (putGallery as any)(updateCtx);
    expect(updateRes.status).toBe(200);
    const updated = (await updateRes.json()).item;
    expect(updated.title).toBe('Lamborghini Huracan V10 Major Service');
    expect(updated.published).toBe(true);

    // 5. Reorder
    const reorderCtx = makeApiCtx({
      db,
      body: { orderedIds: [item2.id, item1.id] },
    });
    const reorderRes = await (reorderGallery as any)(reorderCtx);
    expect(reorderRes.status).toBe(200);

    // 6. Delete item 1
    const delCtx = makeApiCtx({
      db,
      method: 'DELETE',
      params: { id: item1.id },
    });
    const delRes = await (deleteGallery as any)(delCtx);
    expect(delRes.status).toBe(200);
    const delData = await delRes.json();
    expect(delData.deleted).toBe(true);

    // Verify item 1 is gone but item 2 remains
    const finalListRes = await (getGallery as any)(makeApiCtx({ db }));
    const finalList = await finalListRes.json();
    expect(finalList.items.length).toBe(1);
    expect(finalList.items[0].id).toBe(item2.id);
  });
});
