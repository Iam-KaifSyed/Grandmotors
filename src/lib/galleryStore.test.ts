import { describe, it, expect, beforeEach } from 'vitest';
import { createTestD1Database } from './testDbHelper';
import { MockStorageDriver } from './testStorageDriver';
import { createMediaUpload, deleteMediaAsset } from './mediaStore';
import {
  listAllGalleryItems,
  getPublishedGalleryItems,
  createGalleryItem,
  updateGalleryItem,
  reorderGalleryItems,
  toggleGalleryPublished,
  deleteGalleryItem,
  listGalleryCategories,
} from './galleryStore';

describe('galleryStore', () => {
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

    // Create a sample media asset in DB
    const asset = await createMediaUpload(
      db,
      driver,
      {
        filename: 'amg-engine-rebuild.png',
        mimeType: 'image/png',
        bytes: validPngBytes,
      },
      'admin-tester'
    );
    sampleAssetId = asset.id;
  });

  it('lists empty gallery items initially', async () => {
    const items = await listAllGalleryItems(db);
    expect(items).toEqual([]);

    const published = await getPublishedGalleryItems(db);
    expect(published).toEqual([]);
  });

  it('validates required fields when creating gallery items', async () => {
    // Missing mediaAssetId
    await expect(
      createGalleryItem(db, {
        mediaAssetId: '',
        title: 'AMG Engine Rebuild',
      })
    ).rejects.toThrow('Media asset ID is required.');

    // Non-existent mediaAssetId
    await expect(
      createGalleryItem(db, {
        mediaAssetId: 'non-existent-id',
        title: 'AMG Engine Rebuild',
      })
    ).rejects.toThrow('Selected media asset does not exist.');

    // Empty title
    await expect(
      createGalleryItem(db, {
        mediaAssetId: sampleAssetId,
        title: '   ',
      })
    ).rejects.toThrow('Title is required.');
  });

  it('creates and retrieves a gallery item with contiguous display ordering', async () => {
    const item1 = await createGalleryItem(
      db,
      {
        mediaAssetId: sampleAssetId,
        title: 'Mercedes-AMG Twin Turbo Overhaul',
        description: 'Complete teardown and precision seal replacement',
        categoryId: 'engine-diagnostics',
        published: true,
      },
      'admin-joe'
    );

    expect(item1.id).toBeDefined();
    expect(item1.title).toBe('Mercedes-AMG Twin Turbo Overhaul');
    expect(item1.displayOrder).toBe(1);
    expect(item1.published).toBe(true);
    expect(item1.imageUrl).toMatch(/^\/media\//);

    // Create second item
    const item2 = await createGalleryItem(
      db,
      {
        mediaAssetId: sampleAssetId,
        title: 'Ceramic Brake Caliper Upgrade',
        description: 'Brembo gold caliper fitting and race brake fluid',
        categoryId: 'brakes',
        published: false,
      },
      'admin-joe'
    );

    expect(item2.displayOrder).toBe(2);
    expect(item2.published).toBe(false);

    // All items for admin
    const all = await listAllGalleryItems(db);
    expect(all.length).toBe(2);
    expect(all[0].title).toBe('Mercedes-AMG Twin Turbo Overhaul');
    expect(all[1].title).toBe('Ceramic Brake Caliper Upgrade');

    // Published items for public (only item1)
    const pub = await getPublishedGalleryItems(db);
    expect(pub.length).toBe(1);
    expect(pub[0].title).toBe('Mercedes-AMG Twin Turbo Overhaul');
  });

  it('filters gallery items by search query in listAllGalleryItems', async () => {
    await createGalleryItem(db, {
      mediaAssetId: sampleAssetId,
      title: 'BMW M5 Transmission Flush',
      description: 'Dual clutch transmission fluid exchange',
      published: true,
    });
    await createGalleryItem(db, {
      mediaAssetId: sampleAssetId,
      title: 'Porsche 911 Detail & Ceramic Coating',
      description: 'Multi-stage paint correction',
      published: true,
    });

    const searchBmw = await listAllGalleryItems(db, 'bmw');
    expect(searchBmw.length).toBe(1);
    expect(searchBmw[0].title).toBe('BMW M5 Transmission Flush');

    const searchPaint = await listAllGalleryItems(db, 'paint correction');
    expect(searchPaint.length).toBe(1);
    expect(searchPaint[0].title).toBe('Porsche 911 Detail & Ceramic Coating');
  });

  it('filters published items by category', async () => {
    await createGalleryItem(db, {
      mediaAssetId: sampleAssetId,
      title: 'Engine Work 1',
      categoryId: 'engine-diagnostics',
      published: true,
    });
    await createGalleryItem(db, {
      mediaAssetId: sampleAssetId,
      title: 'Brake Work 1',
      categoryId: 'brakes',
      published: true,
    });

    const engineItems = await getPublishedGalleryItems(db, 'engine-diagnostics');
    expect(engineItems.length).toBe(1);
    expect(engineItems[0].title).toBe('Engine Work 1');

    const brakeItems = await getPublishedGalleryItems(db, 'brakes');
    expect(brakeItems.length).toBe(1);
    expect(brakeItems[0].title).toBe('Brake Work 1');
  });

  it('updates an existing gallery item', async () => {
    const item = await createGalleryItem(db, {
      mediaAssetId: sampleAssetId,
      title: 'Original Title',
      description: 'Original Desc',
      published: false,
    });

    const updated = await updateGalleryItem(db, item.id, {
      title: 'Updated Title',
      description: 'Updated Desc',
      published: true,
    });

    expect(updated.title).toBe('Updated Title');
    expect(updated.description).toBe('Updated Desc');
    expect(updated.published).toBe(true);

    // Empty title validation
    await expect(
      updateGalleryItem(db, item.id, {
        title: '   ',
      })
    ).rejects.toThrow('Title cannot be empty.');
  });

  it('reorders gallery items accurately', async () => {
    const item1 = await createGalleryItem(db, { mediaAssetId: sampleAssetId, title: 'Item 1' });
    const item2 = await createGalleryItem(db, { mediaAssetId: sampleAssetId, title: 'Item 2' });
    const item3 = await createGalleryItem(db, { mediaAssetId: sampleAssetId, title: 'Item 3' });

    // Reverse order
    await reorderGalleryItems(db, [item3.id, item2.id, item1.id]);

    const reordered = await listAllGalleryItems(db);
    expect(reordered[0].id).toBe(item3.id);
    expect(reordered[0].displayOrder).toBe(1);
    expect(reordered[1].id).toBe(item2.id);
    expect(reordered[1].displayOrder).toBe(2);
    expect(reordered[2].id).toBe(item1.id);
    expect(reordered[2].displayOrder).toBe(3);
  });

  it('toggles published state of a gallery item', async () => {
    const item = await createGalleryItem(db, {
      mediaAssetId: sampleAssetId,
      title: 'Item to publish',
      published: false,
    });
    expect(item.published).toBe(false);

    const published = await toggleGalleryPublished(db, item.id, true);
    expect(published.published).toBe(true);

    const unpublished = await toggleGalleryPublished(db, item.id, false);
    expect(unpublished.published).toBe(false);
  });

  it('safely deletes a gallery item without deleting the underlying media asset', async () => {
    const item = await createGalleryItem(db, {
      mediaAssetId: sampleAssetId,
      title: 'Item to delete',
    });

    const delRes = await deleteGalleryItem(db, item.id);
    expect(delRes.deleted).toBe(true);

    // Gallery item should be gone
    const all = await listAllGalleryItems(db);
    expect(all.find((i) => i.id === item.id)).toBeUndefined();

    // Media asset should STILL exist in Media Library!
    const asset = await db
      .prepare('SELECT id FROM media_assets WHERE id = ?')
      .bind(sampleAssetId)
      .first();
    expect(asset).toBeDefined();
    expect(asset.id).toBe(sampleAssetId);
  });

  it('protects media assets from deletion while in use by a gallery item', async () => {
    await createGalleryItem(db, {
      mediaAssetId: sampleAssetId,
      title: 'Aston Martin DB11 Suspension Tuning',
    });

    // Attempting to delete the underlying media asset should fail with status 409
    await expect(deleteMediaAsset(db, driver, sampleAssetId)).rejects.toThrow(
      'Cannot delete media asset because it is currently in use.'
    );
  });

  it('lists active service categories for gallery filtering', async () => {
    const cats = await listGalleryCategories(db);
    expect(Array.isArray(cats)).toBe(true);
    expect(cats.length).toBeGreaterThan(0);
    expect(cats[0]).toHaveProperty('id');
    expect(cats[0]).toHaveProperty('name');
  });
});
