import { resolveAssetUrl } from './mediaStore';
import { recordAuditEvent } from './auditLog';

export interface GalleryItemRecord {
  id: string;
  mediaAssetId: string;
  title: string;
  description?: string | null;
  categoryId?: string | null;
  displayOrder: number;
  published: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string | null;
  // Enriched fields
  imageUrl?: string;
  imageAlt?: string;
  categoryName?: string | null;
}

export interface GalleryItemView {
  id: string;
  title: string;
  description?: string | null;
  categoryId?: string | null;
  categoryName?: string | null;
  displayOrder: number;
  imageUrl: string;
  imageAlt: string;
}

/**
 * Automatically ensure gallery_items table exists if migrations have not run yet.
 */
export async function ensureGalleryTable(db: any): Promise<void> {
  if (!db) return;
  try {
    if (typeof db.exec === 'function') {
      await db.exec(`
        CREATE TABLE IF NOT EXISTS gallery_items (
          id TEXT PRIMARY KEY,
          mediaAssetId TEXT NOT NULL,
          title TEXT NOT NULL DEFAULT '',
          description TEXT,
          categoryId TEXT,
          displayOrder INTEGER NOT NULL DEFAULT 0,
          published INTEGER NOT NULL DEFAULT 0,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          createdBy TEXT,
          updatedBy TEXT
        );
      `);
    } else if (typeof db.prepare === 'function') {
      await db.prepare(`
        CREATE TABLE IF NOT EXISTS gallery_items (
          id TEXT PRIMARY KEY,
          mediaAssetId TEXT NOT NULL,
          title TEXT NOT NULL DEFAULT '',
          description TEXT,
          categoryId TEXT,
          displayOrder INTEGER NOT NULL DEFAULT 0,
          published INTEGER NOT NULL DEFAULT 0,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          createdBy TEXT,
          updatedBy TEXT
        )
      `).run();
    }
  } catch {
    // ignore
  }
}

/**
 * List all gallery items for admin view (includes unpublished).
 */
export async function listAllGalleryItems(db: any, searchQuery?: string): Promise<GalleryItemRecord[]> {
  if (!db) return [];

  try {
    let sql = `SELECT g.*,
                a.source as mediaSource,
                a.publicUrl as mediaPublicUrl,
                a.objectKey as mediaObjectKey,
                a.width as mediaWidth,
                a.height as mediaHeight,
                a.mimeType as mediaMimeType,
                c.name as categoryName
         FROM gallery_items g
         LEFT JOIN media_assets a ON a.id = g.mediaAssetId
         LEFT JOIN service_categories c ON c.id = g.categoryId`;
    const params: any[] = [];

    if (searchQuery && searchQuery.trim()) {
      sql += ` WHERE (g.title LIKE ? OR g.description LIKE ?)`;
      const pattern = `%${searchQuery.trim()}%`;
      params.push(pattern, pattern);
    }

    sql += ` ORDER BY g.displayOrder ASC, g.createdAt ASC`;

    const stmt = db.prepare(sql);
    const raw = params.length > 0 ? await stmt.bind(...params).all() : await stmt.all();

    return (raw?.results || []).map((row: any) => {
      let imageUrl = '/images/placeholder.jpg';
      if (row.mediaAssetId && row.mediaSource) {
        imageUrl = resolveAssetUrl({
          source: row.mediaSource,
          publicUrl: row.mediaPublicUrl,
          objectKey: row.mediaObjectKey,
        });
      }

      return {
        id: row.id,
        mediaAssetId: row.mediaAssetId,
        title: row.title,
        description: row.description,
        categoryId: row.categoryId,
        displayOrder: Number(row.displayOrder),
        published: Boolean(row.published),
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        createdBy: row.createdBy,
        imageUrl,
        imageAlt: row.title || 'Gallery image',
        categoryName: row.categoryName || null,
      };
    });
  } catch (err: any) {
    console.warn('listAllGalleryItems fallback:', err?.message);
    try {
      await ensureGalleryTable(db);
    } catch {}
    return [];
  }
}

/**
 * List published gallery items for public view, optionally filtered by category.
 */
export async function getPublishedGalleryItems(db: any, categoryId?: string | null): Promise<GalleryItemView[]> {
  if (!db) return [];

  try {
    let query = `
      SELECT g.*,
              a.source as mediaSource,
              a.publicUrl as mediaPublicUrl,
              a.objectKey as mediaObjectKey,
              a.width as mediaWidth,
              a.height as mediaHeight,
              c.name as categoryName
       FROM gallery_items g
       LEFT JOIN media_assets a ON a.id = g.mediaAssetId
       LEFT JOIN service_categories c ON c.id = g.categoryId
       WHERE g.published = 1
    `;
    const params: any[] = [];

    if (categoryId) {
      query += ` AND g.categoryId = ?`;
      params.push(categoryId);
    }

    query += ` ORDER BY g.displayOrder ASC`;

    const raw = await db.prepare(query).bind(...params).all();

    return (raw?.results || []).map((row: any) => {
      let imageUrl = '/images/placeholder.jpg';
      if (row.mediaAssetId && row.mediaSource) {
        imageUrl = resolveAssetUrl({
          source: row.mediaSource,
          publicUrl: row.mediaPublicUrl,
          objectKey: row.mediaObjectKey,
        });
      }

      return {
        id: row.id,
        title: row.title,
        description: row.description,
        categoryId: row.categoryId,
        categoryName: row.categoryName || null,
        displayOrder: Number(row.displayOrder),
        imageUrl,
        imageAlt: row.title || 'Gallery image',
      };
    });
  } catch (err: any) {
    console.warn('getPublishedGalleryItems fallback:', err?.message);
    try {
      await ensureGalleryTable(db);
    } catch {}
    return [];
  }
}

/**
 * Get all categories for filter dropdown.
 */
export async function listGalleryCategories(db: any): Promise<Array<{ id: string; name: string }>> {
  if (!db) return [];
  try {
    const raw = await db
      .prepare('SELECT id, name FROM service_categories WHERE active = 1 ORDER BY displayOrder ASC')
      .all();
    const categories = (raw?.results || []).map((r: any) => ({ id: r.id, name: r.name }));
    if (categories.length > 0) return categories;
  } catch {}

  // Fallback to active services if service_categories is not populated yet
  try {
    const svcRaw = await db
      .prepare('SELECT DISTINCT id, title FROM services WHERE active = 1 ORDER BY displayOrder ASC')
      .all();
    return (svcRaw?.results || []).map((r: any) => ({ id: r.id, name: r.title }));
  } catch {
    return [];
  }
}

/**
 * Create a new gallery item.
 */
export async function createGalleryItem(
  db: any,
  data: {
    mediaAssetId: string;
    title: string;
    description?: string;
    categoryId?: string | null;
    published?: boolean;
  },
  actorAdmin = 'admin'
): Promise<GalleryItemRecord> {
  await ensureGalleryTable(db);
  const mediaAssetId = data.mediaAssetId?.trim();
  if (!mediaAssetId) {
    const err: any = new Error('Media asset ID is required.');
    err.status = 422;
    err.field = 'mediaAssetId';
    throw err;
  }

  // Verify media asset exists
  const asset = await db
    .prepare('SELECT id, filename FROM media_assets WHERE id = ?')
    .bind(mediaAssetId)
    .first();
  if (!asset) {
    const err: any = new Error('Selected media asset does not exist.');
    err.status = 404;
    err.field = 'mediaAssetId';
    throw err;
  }

  const title = (data.title || '').trim();
  if (!title) {
    const err: any = new Error('Title is required.');
    err.status = 422;
    err.field = 'title';
    throw err;
  }

  const id = `gallery-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  const maxRow = await db
    .prepare('SELECT MAX(displayOrder) as maxOrder FROM gallery_items')
    .first();
  const nextOrder = (maxRow?.maxOrder ?? 0) + 1;

  const published = data.published ? 1 : 0;

  await db
    .prepare(
      `INSERT INTO gallery_items (
        id, mediaAssetId, title, description, categoryId, displayOrder, published,
        createdAt, createdBy, updatedAt, updatedBy
      ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), ?, datetime('now'), ?)`
    )
    .bind(
      id,
      mediaAssetId,
      title,
      data.description || null,
      data.categoryId || null,
      nextOrder,
      published,
      actorAdmin,
      actorAdmin
    )
    .run();

  await recordAuditEvent(db, {
    entityType: 'gallery',
    entityId: id,
    action: 'create',
    actorAdmin,
    summary: { title, mediaAssetId, categoryId: data.categoryId, published },
  });

  return listAllGalleryItems(db).then(items => items.find(i => i.id === id)!);
}

/**
 * Update an existing gallery item.
 */
export async function updateGalleryItem(
  db: any,
  id: string,
  data: Partial<{
    title: string;
    description: string;
    categoryId: string | null;
    displayOrder: number;
    published: boolean;
  }>,
  actorAdmin = 'admin'
): Promise<GalleryItemRecord> {
  const existing = await db
    .prepare('SELECT * FROM gallery_items WHERE id = ?')
    .bind(id)
    .first();

  if (!existing) {
    const err: any = new Error('Gallery item not found.');
    err.status = 404;
    throw err;
  }

  const title = data.title !== undefined ? data.title.trim() : existing.title;
  if (!title) {
    const err: any = new Error('Title cannot be empty.');
    err.status = 422;
    err.field = 'title';
    throw err;
  }

  const description = data.description !== undefined ? data.description : existing.description;
  const categoryId = data.categoryId !== undefined ? data.categoryId : existing.categoryId;
  const displayOrder = data.displayOrder !== undefined ? data.displayOrder : existing.displayOrder;
  const published = data.published !== undefined ? (data.published ? 1 : 0) : existing.published;

  await db
    .prepare(
      `UPDATE gallery_items
       SET title = ?,
           description = ?,
           categoryId = ?,
           displayOrder = ?,
           published = ?,
           updatedAt = datetime('now'),
           updatedBy = ?
       WHERE id = ?`
    )
    .bind(title, description, categoryId, displayOrder, published, actorAdmin, id)
    .run();

  await recordAuditEvent(db, {
    entityType: 'gallery',
    entityId: id,
    action: 'update',
    actorAdmin,
    summary: data,
  });

  return listAllGalleryItems(db).then(items => items.find(i => i.id === id)!);
}

/**
 * Reorder gallery items to contiguous ascending order.
 */
export async function reorderGalleryItems(
  db: any,
  orderedIds: string[],
  actorAdmin = 'admin'
): Promise<Array<{ id: string; displayOrder: number }>> {
  if (!orderedIds || orderedIds.length === 0) return [];

  const stmts = orderedIds.map((id, index) =>
    db
      .prepare('UPDATE gallery_items SET displayOrder = ?, updatedAt = datetime(\'now\') WHERE id = ?')
      .bind(index + 1, id)
  );

  if (typeof db.batch === 'function') {
    await db.batch(stmts);
  } else {
    for (const stmt of stmts) {
      await stmt.run();
    }
  }

  await recordAuditEvent(db, {
    entityType: 'gallery',
    entityId: 'all',
    action: 'reorder',
    actorAdmin,
    summary: { order: orderedIds },
  });

  return orderedIds.map((id, index) => ({ id, displayOrder: index + 1 }));
}

/**
 * Toggle published state of a gallery item.
 */
export async function toggleGalleryPublished(
  db: any,
  id: string,
  published: boolean,
  actorAdmin = 'admin'
): Promise<GalleryItemRecord> {
  await db
    .prepare(
      `UPDATE gallery_items
       SET published = ?, updatedAt = datetime('now'), updatedBy = ?
       WHERE id = ?`
    )
    .bind(published ? 1 : 0, actorAdmin, id)
    .run();

  await recordAuditEvent(db, {
    entityType: 'gallery',
    entityId: id,
    action: published ? 'publish' : 'unpublish',
    actorAdmin,
    summary: { published },
  });

  return listAllGalleryItems(db).then(items => items.find(i => i.id === id)!);
}

/**
 * Delete a gallery item safely.
 * Note: Does NOT delete the underlying media asset (that's handled in Media Library).
 */
export async function deleteGalleryItem(
  db: any,
  id: string,
  actorAdmin = 'admin'
): Promise<{ deleted: boolean }> {
  const existing = await db
    .prepare('SELECT * FROM gallery_items WHERE id = ?')
    .bind(id)
    .first();

  if (!existing) {
    const err: any = new Error('Gallery item not found.');
    err.status = 404;
    throw err;
  }

  await db.prepare('DELETE FROM gallery_items WHERE id = ?').bind(id).run();

  await recordAuditEvent(db, {
    entityType: 'gallery',
    entityId: id,
    action: 'delete',
    actorAdmin,
    summary: { title: existing.title, mediaAssetId: existing.mediaAssetId },
  });

  return { deleted: true };
}