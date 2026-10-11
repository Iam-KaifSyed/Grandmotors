import { describe, it, expect, beforeEach } from 'vitest';
import { createTestD1Database } from './testDbHelper';
import { MockStorageDriver } from './testStorageDriver';
import {
  validateImageUpload,
  createMediaUpload,
  replaceMediaAsset,
  deleteMediaAsset,
  unlinkMediaAsset,
  assignMediaToUsageLocation,
  listMediaAssets,
  getMediaUrlForUsageLocation,
} from './mediaStore';

describe('mediaStore & Image Validation', () => {
  let db: any;
  let driver: MockStorageDriver;

  const validPngBytes = new Uint8Array([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44,
    0x52, 0x00, 0x00, 0x00, 0x64, 0x00, 0x00, 0x00, 0x64, 0x08, 0x06,
  ]);

  const validJpgBytes = new Uint8Array([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
  ]);

  beforeEach(() => {
    db = createTestD1Database();
    driver = new MockStorageDriver();
  });

  it('validates image uploads correctly', () => {
    // Valid PNG
    const pngResult = validateImageUpload('car.png', 'image/png', validPngBytes);
    expect(pngResult.valid).toBe(true);
    expect(pngResult.width).toBe(100);
    expect(pngResult.height).toBe(100);

    // Valid GIF (GIF89a, width 100, height 50)
    const validGifBytes = new Uint8Array([
      0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x64, 0x00, 0x32, 0x00, 0xf0, 0x00, 0x00,
    ]);
    const gifResult = validateImageUpload('animation.gif', 'image/gif', validGifBytes);
    expect(gifResult.valid).toBe(true);
    expect(gifResult.width).toBe(100);
    expect(gifResult.height).toBe(50);

    // SVG explicitly rejected with security explanation
    const svgBytes = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"><rect/></svg>');
    const svgResult = validateImageUpload('icon.svg', 'image/svg+xml', svgBytes);
    expect(svgResult.valid).toBe(false);
    expect(svgResult.failedCheck).toBe('mime');
    expect(svgResult.error).toContain('Vector SVG formats are not supported');

    // Invalid MIME
    const badMime = validateImageUpload('car.pdf', 'application/pdf', validPngBytes);
    expect(badMime.valid).toBe(false);
    expect(badMime.failedCheck).toBe('mime');

    // Extension mismatch
    const badExt = validateImageUpload('car.jpg', 'image/png', validPngBytes);
    expect(badExt.valid).toBe(false);
    expect(badExt.failedCheck).toBe('extension');

    // Content corruption
    const corruptBytes = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    const badContent = validateImageUpload('car.png', 'image/png', corruptBytes);
    expect(badContent.valid).toBe(false);
    expect(badContent.failedCheck).toBe('content');
  });

  it('creates an upload and stores metadata and binary atomically', async () => {
    const asset = await createMediaUpload(
      db,
      driver,
      { filename: 'test.png', bytes: validPngBytes, mimeType: 'image/png' },
      'test-admin'
    );

    expect(asset.id).toBeDefined();
    expect(asset.objectKey).toBeDefined();
    expect(driver.files.has(asset.objectKey!)).toBe(true);

    const list = await listMediaAssets(db);
    expect(list.some((a) => a.id === asset.id)).toBe(true);
  });

  it('replaces an asset while retaining ID and references', async () => {
    const asset = await createMediaUpload(
      db,
      driver,
      { filename: 'initial.png', bytes: validPngBytes, mimeType: 'image/png' },
      'test-admin'
    );

    await assignMediaToUsageLocation(db, 'services-hero', asset.id, 'test-admin');

    const replaced = await replaceMediaAsset(
      db,
      driver,
      asset.id,
      { filename: 'updated.jpg', bytes: validJpgBytes, mimeType: 'image/jpeg' },
      'test-admin'
    );

    expect(replaced.id).toBe(asset.id);
    expect(replaced.previousObjectKey).toBe(asset.objectKey);
    expect(replaced.filename).toBe('updated.jpg');

    // Usage location still resolves to replaced image
    const heroUrl = await getMediaUrlForUsageLocation(db, 'services-hero');
    expect(heroUrl).toBe(driver.getUrl(replaced.objectKey!));
  });

  it('rejects deletion without exact filename match', async () => {
    const asset = await createMediaUpload(
      db,
      driver,
      { filename: 'secure-delete.png', bytes: validPngBytes, mimeType: 'image/png' },
      'test-admin'
    );

    await expect(
      deleteMediaAsset(db, driver, asset.id, 'wrong-name.png', 'test-admin')
    ).rejects.toThrow('Confirmation mismatch');
  });

  it('prevents deletion of in-use media assets (409 conflict)', async () => {
    const asset = await createMediaUpload(
      db,
      driver,
      { filename: 'in-use.png', bytes: validPngBytes, mimeType: 'image/png' },
      'test-admin'
    );

    await assignMediaToUsageLocation(db, 'services-cta', asset.id, 'test-admin');

    try {
      await deleteMediaAsset(db, driver, asset.id, 'in-use.png', 'test-admin');
      expect.unreachable('Should have thrown 409 conflict');
    } catch (err: any) {
      expect(err.status).toBe(409);
      expect(err.usageLocations).toContain('services-cta');
    }
  });

  it('deletes unreferenced media asset and binary when confirmation matches', async () => {
    const asset = await createMediaUpload(
      db,
      driver,
      { filename: 'delete-me.png', bytes: validPngBytes, mimeType: 'image/png' },
      'test-admin'
    );

    const res = await deleteMediaAsset(db, driver, asset.id, 'delete-me.png', 'test-admin');
    expect(res.deleted).toBe(true);
    expect(driver.files.has(asset.objectKey!)).toBe(false);
  });

  it('deletes unreferenced media asset immediately without confirmFilename', async () => {
    const asset = await createMediaUpload(
      db,
      driver,
      { filename: 'simple-delete.png', bytes: validPngBytes, mimeType: 'image/png' },
      'test-admin'
    );

    const res = await deleteMediaAsset(db, driver, asset.id);
    expect(res.deleted).toBe(true);
    expect(driver.files.has(asset.objectKey!)).toBe(false);
  });

  it('unlinks media asset from usage locations and services then allows deletion', async () => {
    const asset = await createMediaUpload(
      db,
      driver,
      { filename: 'multi-ref.png', bytes: validPngBytes, mimeType: 'image/png' },
      'test-admin'
    );

    // Link to a section and a service
    await assignMediaToUsageLocation(db, 'services-hero', asset.id, 'test-admin');
    await db
      .prepare('INSERT INTO services (id, title, itemsJson, mediaAssetId, displayOrder) VALUES (?, ?, ?, ?, ?)')
      .bind('svc-test', 'Test Service', '[]', asset.id, 99)
      .run();

    // Verify deletion is blocked initially
    try {
      await deleteMediaAsset(db, driver, asset.id);
      expect.unreachable('Should have thrown 409 conflict');
    } catch (err: any) {
      expect(err.status).toBe(409);
      expect(err.usageLocations).toContain('services-hero');
      expect(err.usageLocations).toContain('Service: Test Service');
    }

    // Unlink specific section
    const res1 = await unlinkMediaAsset(db, asset.id, 'services-hero', 'test-admin');
    expect(res1.unlinked).toBe(true);
    expect(res1.remainingUsageLocations).toEqual(['Service: Test Service']);

    // Unlink service
    const res2 = await unlinkMediaAsset(db, asset.id, 'Service: Test Service', 'test-admin');
    expect(res2.unlinked).toBe(true);
    expect(res2.remainingUsageLocations).toEqual([]);

    // Now deletion succeeds immediately
    const delRes = await deleteMediaAsset(db, driver, asset.id);
    expect(delRes.deleted).toBe(true);
    expect(driver.files.has(asset.objectKey!)).toBe(false);
  });

  it('unlinks all references at once with unlinkMediaAsset(id, "all")', async () => {
    const asset = await createMediaUpload(
      db,
      driver,
      { filename: 'unlink-all.png', bytes: validPngBytes, mimeType: 'image/png' },
      'test-admin'
    );

    await assignMediaToUsageLocation(db, 'services-cta', asset.id, 'test-admin');
    await db
      .prepare('INSERT INTO services (id, title, itemsJson, mediaAssetId, displayOrder) VALUES (?, ?, ?, ?, ?)')
      .bind('svc-test-2', 'Another Service', '[]', asset.id, 100)
      .run();

    const unlinkRes = await unlinkMediaAsset(db, asset.id, 'all', 'test-admin');
    expect(unlinkRes.unlinked).toBe(true);
    expect(unlinkRes.remainingUsageLocations).toEqual([]);

    const delRes = await deleteMediaAsset(db, driver, asset.id);
    expect(delRes.deleted).toBe(true);
  });
});
