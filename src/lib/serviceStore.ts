import { resolveAssetUrl } from './mediaStore';
import { recordAuditEvent } from './auditLog';
import { SERVICES } from '../components/site/servicesData';

export interface ServiceRecord {
  id: string;
  categoryId?: string | null;
  title: string;
  summary?: string | null;
  items: string[];
  mediaAssetId?: string | null;
  imagePath?: string | null;
  displayOrder: number;
  visibleInCatalogue: boolean;
  selectableInBooking: boolean;
  active: boolean;
  createdAt?: string;
  createdBy?: string | null;
  updatedAt?: string;
  updatedBy?: string | null;
  imageUrl?: string;
  imageAlt?: string;
}

export interface ServiceView {
  id: string;
  title: string;
  summary: string;
  items: string[];
  imageUrl: string;
  imageAlt: string;
  visibleInCatalogue: boolean;
  selectableInBooking: boolean;
  active: boolean;
  displayOrder: number;
}

export interface ServiceCategoryRecord {
  id: string;
  name: string;
  displayOrder: number;
  active: boolean;
}

/**
 * List all services for admin view.
 */
export async function listAllServices(db: any): Promise<ServiceRecord[]> {
  if (!db) return [];

  const raw = await db
    .prepare(
      `SELECT s.*,
              a.source as mediaSource,
              a.publicUrl as mediaPublicUrl,
              a.objectKey as mediaObjectKey
       FROM services s
       LEFT JOIN media_assets a ON a.id = s.mediaAssetId
       ORDER BY s.displayOrder ASC, s.createdAt ASC`
    )
    .all();

  return (raw?.results || []).map((row: any) => {
    let items: string[] = [];
    try {
      items = JSON.parse(row.itemsJson || '[]');
    } catch {
      items = [];
    }

    let imageUrl = row.imagePath || '/images/placeholder.jpg';
    if (row.mediaAssetId && row.mediaSource) {
      imageUrl = resolveAssetUrl({
        source: row.mediaSource,
        publicUrl: row.mediaPublicUrl,
        objectKey: row.mediaObjectKey,
      });
    }

    return {
      id: row.id,
      categoryId: row.categoryId,
      title: row.title,
      summary: row.summary,
      items,
      mediaAssetId: row.mediaAssetId,
      imagePath: row.imagePath,
      displayOrder: Number(row.displayOrder),
      visibleInCatalogue: Boolean(row.visibleInCatalogue),
      selectableInBooking: Boolean(row.selectableInBooking),
      active: Boolean(row.active),
      createdAt: row.createdAt,
      createdBy: row.createdBy,
      updatedAt: row.updatedAt,
      updatedBy: row.updatedBy,
      imageUrl,
      imageAlt: `${row.title} service image`,
    };
  });
}

/**
 * List all service categories.
 */
export async function listAllCategories(db: any): Promise<ServiceCategoryRecord[]> {
  if (!db) return [];
  const raw = await db
    .prepare('SELECT * FROM service_categories ORDER BY displayOrder ASC')
    .all();
  return (raw?.results || []).map((r: any) => ({
    id: r.id,
    name: r.name,
    displayOrder: Number(r.displayOrder),
    active: Boolean(r.active),
  }));
}

/**
 * Public catalogue list: active=1 AND visibleInCatalogue=1, ordered by displayOrder ASC.
 */
export async function getPublicCatalogue(db: any): Promise<ServiceView[]> {
  if (!db) return [];

  const raw = await db
    .prepare(
      `SELECT s.*,
              a.source as mediaSource,
              a.publicUrl as mediaPublicUrl,
              a.objectKey as mediaObjectKey
       FROM services s
       LEFT JOIN media_assets a ON a.id = s.mediaAssetId
       WHERE s.active = 1 AND s.visibleInCatalogue = 1
       ORDER BY s.displayOrder ASC`
    )
    .all();

  return (raw?.results || []).map((row: any) => {
    let items: string[] = [];
    try {
      items = JSON.parse(row.itemsJson || '[]');
    } catch {
      items = [];
    }

    let imageUrl = row.imagePath || '/images/placeholder.jpg';
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
      summary: row.summary || '',
      items,
      imageUrl,
      imageAlt: `${row.title} service image`,
      visibleInCatalogue: true,
      selectableInBooking: Boolean(row.selectableInBooking),
      active: true,
      displayOrder: Number(row.displayOrder),
    };
  });
}

/**
 * Booking options list: active=1 AND selectableInBooking=1, ordered by displayOrder ASC.
 */
export async function getBookingOptions(db: any): Promise<ServiceView[]> {
  if (!db) return [];

  const raw = await db
    .prepare(
      `SELECT s.*,
              a.source as mediaSource,
              a.publicUrl as mediaPublicUrl,
              a.objectKey as mediaObjectKey
       FROM services s
       LEFT JOIN media_assets a ON a.id = s.mediaAssetId
       WHERE s.active = 1 AND s.selectableInBooking = 1
       ORDER BY s.displayOrder ASC`
    )
    .all();

  return (raw?.results || []).map((row: any) => {
    let items: string[] = [];
    try {
      items = JSON.parse(row.itemsJson || '[]');
    } catch {
      items = [];
    }

    let imageUrl = row.imagePath || '/images/placeholder.jpg';
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
      summary: row.summary || '',
      items,
      imageUrl,
      imageAlt: `${row.title} service image`,
      visibleInCatalogue: Boolean(row.visibleInCatalogue),
      selectableInBooking: true,
      active: true,
      displayOrder: Number(row.displayOrder),
    };
  });
}

/**
 * Safe fallback for public catalogue.
 */
export async function getPublicCatalogueOrDefault(db: any): Promise<ServiceView[]> {
  try {
    const list = await getPublicCatalogue(db);
    if (list && list.length > 0) return list;
  } catch (err) {
    console.warn('Fallback: Error loading public catalogue from DB:', err);
  }

  // Fallback to hardcoded seed snapshot
  return SERVICES.map((s, idx) => ({
    id: s.id,
    title: s.title,
    summary: s.summary,
    items: s.items,
    imageUrl: s.image,
    imageAlt: s.imageAlt,
    visibleInCatalogue: true,
    selectableInBooking: true,
    active: true,
    displayOrder: idx + 1,
  }));
}

/**
 * Safe fallback for booking options.
 */
export async function getBookingOptionsOrDefault(db: any): Promise<ServiceView[]> {
  try {
    const list = await getBookingOptions(db);
    if (list && list.length > 0) return list;
  } catch (err) {
    console.warn('Fallback: Error loading booking options from DB:', err);
  }

  return SERVICES.map((s, idx) => ({
    id: s.id,
    title: s.title,
    summary: s.summary,
    items: s.items,
    imageUrl: s.image,
    imageAlt: s.imageAlt,
    visibleInCatalogue: true,
    selectableInBooking: true,
    active: true,
    displayOrder: idx + 1,
  }));
}

/**
 * Create a new service.
 */
export async function createService(
  db: any,
  data: {
    title: string;
    summary?: string;
    items?: string[];
    categoryId?: string | null;
    mediaAssetId?: string | null;
    imagePath?: string | null;
    visibleInCatalogue?: boolean;
    selectableInBooking?: boolean;
    active?: boolean;
  },
  actorAdmin = 'admin'
): Promise<ServiceRecord> {
  const title = (data.title || '').trim();
  if (!title) {
    const err: any = new Error('Service title is required.');
    err.status = 422;
    err.field = 'name';
    throw err;
  }

  const id =
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || `service-${Date.now()}`;

  // Find max displayOrder
  const maxRow = await db
    .prepare('SELECT MAX(displayOrder) as maxOrder FROM services')
    .first();
  const nextOrder = (maxRow?.maxOrder ?? 0) + 1;

  const itemsJson = JSON.stringify(data.items || []);
  const visible = data.visibleInCatalogue !== undefined ? (data.visibleInCatalogue ? 1 : 0) : 1;
  const selectable = data.selectableInBooking !== undefined ? (data.selectableInBooking ? 1 : 0) : 1;
  const active = data.active !== undefined ? (data.active ? 1 : 0) : 1;

  await db
    .prepare(
      `INSERT INTO services (
        id, categoryId, title, summary, itemsJson, mediaAssetId, imagePath,
        displayOrder, visibleInCatalogue, selectableInBooking, active,
        createdAt, createdBy, updatedAt, updatedBy
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?, datetime('now'), ?)`
    )
    .bind(
      id,
      data.categoryId || null,
      title,
      data.summary || '',
      itemsJson,
      data.mediaAssetId || null,
      data.imagePath || null,
      nextOrder,
      visible,
      selectable,
      active,
      actorAdmin,
      actorAdmin
    )
    .run();

  await recordAuditEvent(db, {
    entityType: 'service',
    entityId: id,
    action: 'create',
    actorAdmin,
    summary: { title, displayOrder: nextOrder },
  });

  return {
    id,
    categoryId: data.categoryId || null,
    title,
    summary: data.summary || '',
    items: data.items || [],
    mediaAssetId: data.mediaAssetId || null,
    imagePath: data.imagePath || null,
    displayOrder: nextOrder,
    visibleInCatalogue: Boolean(visible),
    selectableInBooking: Boolean(selectable),
    active: Boolean(active),
    createdAt: new Date().toISOString(),
    createdBy: actorAdmin,
    updatedAt: new Date().toISOString(),
    updatedBy: actorAdmin,
  };
}

/**
 * Update an existing service.
 */
export async function updateService(
  db: any,
  id: string,
  data: Partial<{
    title: string;
    summary: string;
    items: string[];
    categoryId: string | null;
    mediaAssetId: string | null;
    imagePath: string | null;
    displayOrder: number;
    visibleInCatalogue: boolean;
    selectableInBooking: boolean;
    active: boolean;
  }>,
  actorAdmin = 'admin'
): Promise<ServiceRecord> {
  const existing = await db
    .prepare('SELECT * FROM services WHERE id = ?')
    .bind(id)
    .first();

  if (!existing) {
    const err: any = new Error('Service not found.');
    err.status = 404;
    throw err;
  }

  let title = existing.title;
  if (data.title !== undefined) {
    if (!data.title.trim()) {
      const err: any = new Error('Service title cannot be empty.');
      err.status = 422;
      err.field = 'name';
      throw err;
    }
    title = data.title.trim();
  }

  const summary = data.summary !== undefined ? data.summary : existing.summary;
  const itemsJson = data.items !== undefined ? JSON.stringify(data.items) : existing.itemsJson;
  const categoryId = data.categoryId !== undefined ? data.categoryId : existing.categoryId;
  const mediaAssetId = data.mediaAssetId !== undefined ? data.mediaAssetId : existing.mediaAssetId;
  const imagePath = data.imagePath !== undefined ? data.imagePath : existing.imagePath;
  const displayOrder = data.displayOrder !== undefined ? data.displayOrder : existing.displayOrder;
  const visibleInCatalogue =
    data.visibleInCatalogue !== undefined
      ? data.visibleInCatalogue
        ? 1
        : 0
      : existing.visibleInCatalogue;
  const selectableInBooking =
    data.selectableInBooking !== undefined
      ? data.selectableInBooking
        ? 1
        : 0
      : existing.selectableInBooking;
  const active = data.active !== undefined ? (data.active ? 1 : 0) : existing.active;

  await db
    .prepare(
      `UPDATE services
       SET title = ?,
           summary = ?,
           itemsJson = ?,
           categoryId = ?,
           mediaAssetId = ?,
           imagePath = ?,
           displayOrder = ?,
           visibleInCatalogue = ?,
           selectableInBooking = ?,
           active = ?,
           updatedAt = datetime('now'),
           updatedBy = ?
       WHERE id = ?`
    )
    .bind(
      title,
      summary,
      itemsJson,
      categoryId,
      mediaAssetId,
      imagePath,
      displayOrder,
      visibleInCatalogue,
      selectableInBooking,
      active,
      actorAdmin,
      id
    )
    .run();

  await recordAuditEvent(db, {
    entityType: 'service',
    entityId: id,
    action: 'update',
    actorAdmin,
    summary: data,
  });

  let items: string[] = [];
  try {
    items = JSON.parse(itemsJson);
  } catch {
    items = [];
  }

  return {
    id,
    categoryId,
    title,
    summary,
    items,
    mediaAssetId,
    imagePath,
    displayOrder: Number(displayOrder),
    visibleInCatalogue: Boolean(visibleInCatalogue),
    selectableInBooking: Boolean(selectableInBooking),
    active: Boolean(active),
    updatedAt: new Date().toISOString(),
    updatedBy: actorAdmin,
  };
}

/**
 * Reorder services to contiguous ascending order.
 */
export async function reorderServices(
  db: any,
  orderedIds: string[],
  actorAdmin = 'admin'
): Promise<Array<{ id: string; displayOrder: number }>> {
  if (!orderedIds || orderedIds.length === 0) return [];

  const stmts = orderedIds.map((id, index) =>
    db
      .prepare('UPDATE services SET displayOrder = ?, updatedAt = datetime(\'now\') WHERE id = ?')
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
    entityType: 'service',
    entityId: 'all',
    action: 'reorder',
    actorAdmin,
    summary: { order: orderedIds },
  });

  return orderedIds.map((id, index) => ({ id, displayOrder: index + 1 }));
}

/**
 * Create service category.
 */
export async function createServiceCategory(
  db: any,
  name: string,
  actorAdmin = 'admin'
): Promise<ServiceCategoryRecord> {
  const trimmed = (name || '').trim();
  if (!trimmed) {
    const err: any = new Error('Category name is required.');
    err.status = 422;
    err.field = 'name';
    throw err;
  }

  const id =
    trimmed
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || `cat-${Date.now()}`;

  const maxRow = await db
    .prepare('SELECT MAX(displayOrder) as maxOrder FROM service_categories')
    .first();
  const nextOrder = (maxRow?.maxOrder ?? 0) + 1;

  await db
    .prepare(
      'INSERT INTO service_categories (id, name, displayOrder, active) VALUES (?, ?, ?, 1)'
    )
    .bind(id, trimmed, nextOrder)
    .run();

  await recordAuditEvent(db, {
    entityType: 'service_category',
    entityId: id,
    action: 'create',
    actorAdmin,
    summary: { name: trimmed, displayOrder: nextOrder },
  });

  return {
    id,
    name: trimmed,
    displayOrder: nextOrder,
    active: true,
  };
}

/**
 * Update service category.
 */
export async function updateServiceCategory(
  db: any,
  id: string,
  data: { name?: string; active?: boolean },
  actorAdmin = 'admin'
): Promise<ServiceCategoryRecord> {
  const existing = await db
    .prepare('SELECT * FROM service_categories WHERE id = ?')
    .bind(id)
    .first();

  if (!existing) {
    const err: any = new Error('Category not found.');
    err.status = 404;
    throw err;
  }

  let name = existing.name;
  if (data.name !== undefined) {
    if (!data.name.trim()) {
      const err: any = new Error('Category name cannot be empty.');
      err.status = 422;
      err.field = 'name';
      throw err;
    }
    name = data.name.trim();
  }

  const active = data.active !== undefined ? (data.active ? 1 : 0) : existing.active;

  await db
    .prepare('UPDATE service_categories SET name = ?, active = ? WHERE id = ?')
    .bind(name, active, id)
    .run();

  await recordAuditEvent(db, {
    entityType: 'service_category',
    entityId: id,
    action: 'update',
    actorAdmin,
    summary: data,
  });

  return {
    id,
    name,
    displayOrder: Number(existing.displayOrder),
    active: Boolean(active),
  };
}

/**
 * Reorder service categories.
 */
export async function reorderServiceCategories(
  db: any,
  orderedIds: string[],
  actorAdmin = 'admin'
): Promise<Array<{ id: string; displayOrder: number }>> {
  if (!orderedIds || orderedIds.length === 0) return [];

  const stmts = orderedIds.map((id, index) =>
    db
      .prepare('UPDATE service_categories SET displayOrder = ? WHERE id = ?')
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
    entityType: 'service_category',
    entityId: 'all',
    action: 'reorder',
    actorAdmin,
    summary: { order: orderedIds },
  });

  return orderedIds.map((id, index) => ({ id, displayOrder: index + 1 }));
}
