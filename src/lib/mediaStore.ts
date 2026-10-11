import type { StorageDriver } from './storage/StorageDriver';
import { isValidUsageLocation } from './usageLocations';
import { recordAuditEvent } from './auditLog';

export interface MediaAssetRecord {
  id: string;
  filename: string;
  source: 'upload' | 'builtin' | 'external';
  publicUrl?: string | null;
  objectKey?: string | null;
  mimeType: string;
  width?: number | null;
  height?: number | null;
  byteSize?: number | null;
  previousObjectKey?: string | null;
  createdAt: string;
  createdBy?: string | null;
  url?: string;
  usageLocations?: string[];
}

export interface ValidationResult {
  valid: boolean;
  failedCheck?: 'mime' | 'extension' | 'size' | 'content';
  error?: string;
  width?: number;
  height?: number;
  mimeType?: string;
}

const ALLOWED_MIMES: Record<string, string[]> = {
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'image/webp': ['webp'],
  'image/gif': ['gif'],
};

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB limit

/**
 * Validates image upload against MIME, extension, size, and magic byte headers.
 */
export function validateImageUpload(
  filename: string,
  mimeType: string,
  bytes: Uint8Array
): ValidationResult {
  const normalizedMime = mimeType?.toLowerCase().trim();
  const ext = filename.split('.').pop()?.toLowerCase() || '';

  // Explicit SVG check with clear message
  if (normalizedMime === 'image/svg+xml' || ext === 'svg') {
    return {
      valid: false,
      failedCheck: 'mime',
      error: 'Vector SVG formats are not supported for safety and raster optimization. Please use JPEG, PNG, WebP, or GIF.',
    };
  }

  // 1. MIME check
  if (!normalizedMime || !ALLOWED_MIMES[normalizedMime]) {
    return {
      valid: false,
      failedCheck: 'mime',
      error: 'Invalid MIME type. Supported formats: JPEG, PNG, WebP, GIF.',
    };
  }

  // 2. Extension check
  const allowedExts = ALLOWED_MIMES[normalizedMime];
  if (!allowedExts || !allowedExts.includes(ext)) {
    return {
      valid: false,
      failedCheck: 'extension',
      error: `File extension '.${ext}' does not match MIME type '${normalizedMime}'.`,
    };
  }

  // 3. Size check
  if (!bytes || bytes.length === 0 || bytes.length > MAX_IMAGE_SIZE_BYTES) {
    return {
      valid: false,
      failedCheck: 'size',
      error: `File size must be between 1 byte and ${MAX_IMAGE_SIZE_BYTES / (1024 * 1024)}MB.`,
    };
  }

  // 4. Magic bytes content check
  const contentValid = verifyMagicBytes(normalizedMime, bytes);
  if (!contentValid.valid) {
    return {
      valid: false,
      failedCheck: 'content',
      error: 'Corrupt or invalid image content for declared format.',
    };
  }

  return {
    valid: true,
    mimeType: normalizedMime,
    width: contentValid.width,
    height: contentValid.height,
  };
}

function verifyMagicBytes(
  mime: string,
  bytes: Uint8Array
): { valid: boolean; width?: number; height?: number } {
  if (bytes.length < 6) return { valid: false };

  if (mime === 'image/jpeg') {
    // JPEG starts with FF D8 FF
    if (bytes.length >= 12 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
      return { valid: true, ...parseJpegDimensions(bytes) };
    }
    return { valid: false };
  }

  if (mime === 'image/png') {
    // PNG starts with 89 50 4E 47 0D 0A 1A 0A
    if (
      bytes.length >= 8 &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a
    ) {
      return { valid: true, ...parsePngDimensions(bytes) };
    }
    return { valid: false };
  }

  if (mime === 'image/webp') {
    // WebP: RIFF at 0..3, WEBP at 8..11
    if (bytes.length < 12) return { valid: false };
    const isRiff =
      bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46;
    const isWebp =
      bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
    if (isRiff && isWebp) {
      return { valid: true, ...parseWebpDimensions(bytes) };
    }
    return { valid: false };
  }

  if (mime === 'image/gif') {
    // GIF87a or GIF89a
    if (
      bytes[0] === 0x47 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x38 &&
      (bytes[4] === 0x37 || bytes[4] === 0x39) &&
      bytes[5] === 0x61
    ) {
      return { valid: true, ...parseGifDimensions(bytes) };
    }
    return { valid: false };
  }

  return { valid: false };
}

function parseGifDimensions(bytes: Uint8Array): { width?: number; height?: number } {
  if (bytes.length >= 10) {
    const width = bytes[6] | (bytes[7] << 8);
    const height = bytes[8] | (bytes[9] << 8);
    return { width, height };
  }
  return {};
}

function parsePngDimensions(bytes: Uint8Array): { width?: number; height?: number } {
  if (bytes.length >= 24) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const width = view.getUint32(16);
    const height = view.getUint32(20);
    return { width, height };
  }
  return {};
}

function parseJpegDimensions(bytes: Uint8Array): { width?: number; height?: number } {
  let offset = 2;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  while (offset < bytes.length) {
    if (bytes[offset] !== 0xff) break;
    const marker = bytes[offset + 1];
    if (marker === 0xc0 || marker === 0xc2) {
      const height = view.getUint16(offset + 5);
      const width = view.getUint16(offset + 7);
      return { width, height };
    }
    const len = view.getUint16(offset + 2);
    offset += 2 + len;
  }
  return {};
}

function parseWebpDimensions(bytes: Uint8Array): { width?: number; height?: number } {
  // Simple WebP VP8 dimension parse if possible
  if (bytes.length >= 30) {
    const tag = String.fromCharCode(bytes[12], bytes[13], bytes[14], bytes[15]);
    if (tag === 'VP8X' && bytes.length >= 30) {
      const width = 1 + (bytes[24] | (bytes[25] << 8) | (bytes[26] << 16));
      const height = 1 + (bytes[27] | (bytes[28] << 8) | (bytes[29] << 16));
      return { width, height };
    }
  }
  return {};
}

export function resolveAssetUrl(asset: {
  source: string;
  publicUrl?: string | null;
  objectKey?: string | null;
}): string {
  if (asset.source === 'builtin' || asset.source === 'external') {
    return asset.publicUrl || '/images/placeholder.jpg';
  }
  if (asset.objectKey) {
    return `/media/${asset.objectKey}`;
  }
  return asset.publicUrl || '/images/placeholder.jpg';
}

/**
 * List media assets with search query and usage locations.
 */
export async function listMediaAssets(db: any, query?: string): Promise<MediaAssetRecord[]> {
  if (!db) return [];

  const rawAssets = await db
    .prepare('SELECT * FROM media_assets ORDER BY createdAt DESC')
    .all();
  const assets: MediaAssetRecord[] = rawAssets?.results || [];

  const rawRefs = await db
    .prepare('SELECT usageLocation, mediaAssetId FROM media_references')
    .all();
  const refs: Array<{ usageLocation: string; mediaAssetId: string }> = rawRefs?.results || [];

  const refMap: Record<string, string[]> = {};
  for (const r of refs) {
    if (!refMap[r.mediaAssetId]) refMap[r.mediaAssetId] = [];
    refMap[r.mediaAssetId].push(r.usageLocation);
  }

  // Also query services for direct mediaAssetId usage
  const rawServices = await db
    .prepare('SELECT id, title, mediaAssetId FROM services WHERE mediaAssetId IS NOT NULL')
    .all();
  const serviceRefs: Array<{ id: string; title: string; mediaAssetId: string }> =
    rawServices?.results || [];

  for (const s of serviceRefs) {
    if (!refMap[s.mediaAssetId]) refMap[s.mediaAssetId] = [];
    const locName = `Service: ${s.title}`;
    if (!refMap[s.mediaAssetId].includes(locName)) {
      refMap[s.mediaAssetId].push(locName);
    }
  }

  const enriched = assets.map((a) => ({
    ...a,
    url: resolveAssetUrl(a),
    usageLocations: refMap[a.id] || [],
  }));

  if (!query || !query.trim()) {
    return enriched;
  }

  const q = query.trim().toLowerCase();
  return enriched.filter((a) => {
    const filenameMatch = a.filename.toLowerCase().includes(q);
    const locationMatch = (a.usageLocations || []).some((loc) => loc.toLowerCase().includes(q));
    return filenameMatch || locationMatch;
  });
}

/**
 * Create a new uploaded media asset atomically.
 */
export async function createMediaUpload(
  db: any,
  driver: StorageDriver,
  file: { filename: string; bytes: Uint8Array; mimeType: string },
  actorAdmin = 'admin'
): Promise<MediaAssetRecord> {
  const validation = validateImageUpload(file.filename, file.mimeType, file.bytes);
  if (!validation.valid) {
    const err: any = new Error(validation.error || 'Invalid image file.');
    err.failedCheck = validation.failedCheck;
    err.status = 422;
    throw err;
  }

  const ext = ALLOWED_MIMES[validation.mimeType!][0];
  const objectKey = `${crypto.randomUUID()}.${ext}`;
  const assetId = `media-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  // 1. Store binary
  await driver.put(objectKey, file.bytes, { mimeType: validation.mimeType! });

  // 2. Insert metadata
  try {
    await db
      .prepare(
        `INSERT INTO media_assets (
          id, filename, source, publicUrl, objectKey, mimeType, width, height, byteSize, createdAt, createdBy
        ) VALUES (?, ?, 'upload', NULL, ?, ?, ?, ?, ?, datetime('now'), ?)`
      )
      .bind(
        assetId,
        file.filename,
        objectKey,
        validation.mimeType,
        validation.width || null,
        validation.height || null,
        file.bytes.length,
        actorAdmin
      )
      .run();

    await recordAuditEvent(db, {
      entityType: 'media',
      entityId: assetId,
      action: 'upload',
      actorAdmin,
      summary: { filename: file.filename, objectKey, byteSize: file.bytes.length },
    });

    return {
      id: assetId,
      filename: file.filename,
      source: 'upload',
      objectKey,
      mimeType: validation.mimeType!,
      width: validation.width || null,
      height: validation.height || null,
      byteSize: file.bytes.length,
      createdAt: new Date().toISOString(),
      createdBy: actorAdmin,
      url: driver.getUrl(objectKey),
      usageLocations: [],
    };
  } catch (err) {
    // Compensating rollback
    await driver.delete(objectKey).catch(() => {});
    throw err;
  }
}

/**
 * Replace an existing media asset with a new binary, preserving asset ID and references.
 */
export async function replaceMediaAsset(
  db: any,
  driver: StorageDriver,
  id: string,
  file: { filename: string; bytes: Uint8Array; mimeType: string },
  actorAdmin = 'admin'
): Promise<MediaAssetRecord> {
  const existing = await db
    .prepare('SELECT * FROM media_assets WHERE id = ?')
    .bind(id)
    .first();

  if (!existing) {
    const err: any = new Error('Media asset not found.');
    err.status = 404;
    throw err;
  }

  const validation = validateImageUpload(file.filename, file.mimeType, file.bytes);
  if (!validation.valid) {
    const err: any = new Error(validation.error || 'Invalid image file.');
    err.failedCheck = validation.failedCheck;
    err.status = 422;
    throw err;
  }

  const ext = ALLOWED_MIMES[validation.mimeType!][0];
  const newObjectKey = `${crypto.randomUUID()}.${ext}`;
  const previousObjectKey = existing.objectKey || null;

  // 1. Store new binary
  await driver.put(newObjectKey, file.bytes, { mimeType: validation.mimeType! });

  // 2. Update metadata
  try {
    await db
      .prepare(
        `UPDATE media_assets
         SET filename = ?,
             source = 'upload',
             publicUrl = NULL,
             objectKey = ?,
             mimeType = ?,
             width = ?,
             height = ?,
             byteSize = ?,
             previousObjectKey = ?
         WHERE id = ?`
      )
      .bind(
        file.filename,
        newObjectKey,
        validation.mimeType,
        validation.width || null,
        validation.height || null,
        file.bytes.length,
        previousObjectKey,
        id
      )
      .run();

    await recordAuditEvent(db, {
      entityType: 'media',
      entityId: id,
      action: 'replace',
      actorAdmin,
      summary: {
        newFilename: file.filename,
        newObjectKey,
        previousObjectKey,
      },
    });

    const updated = await db
      .prepare('SELECT * FROM media_assets WHERE id = ?')
      .bind(id)
      .first();

    return {
      ...updated,
      url: driver.getUrl(newObjectKey),
    };
  } catch (err) {
    // Compensating rollback
    await driver.delete(newObjectKey).catch(() => {});
    throw err;
  }
}

/**
 * Delete a media asset safely.
 */
export async function deleteMediaAsset(
  db: any,
  driver: StorageDriver | null,
  id: string,
  confirmFilename?: string,
  actorAdmin = 'admin'
): Promise<{ deleted: boolean }> {
  const asset = await db
    .prepare('SELECT * FROM media_assets WHERE id = ?')
    .bind(id)
    .first();

  if (!asset) {
    const err: any = new Error('Media asset not found.');
    err.status = 404;
    throw err;
  }

  // Confirmation filename check (if provided, must match)
  if (confirmFilename && confirmFilename.trim() !== asset.filename?.trim()) {
    const err: any = new Error(
      `Confirmation mismatch. Please type '${asset.filename}' to confirm deletion.`
    );
    err.status = 400;
    throw err;
  }

  // Check if in use in media_references
  const rawRefs = await db
    .prepare('SELECT usageLocation FROM media_references WHERE mediaAssetId = ?')
    .bind(id)
    .all();
  const usageLocations = (rawRefs?.results || []).map((r: any) => r.usageLocation);

  // Check if in use in services table
  const rawServices = await db
    .prepare('SELECT title FROM services WHERE mediaAssetId = ?')
    .bind(id)
    .all();
  for (const s of rawServices?.results || []) {
    usageLocations.push(`Service: ${s.title}`);
  }

  if (usageLocations.length > 0) {
    const err: any = new Error(
      'Cannot delete media asset because it is currently in use.'
    );
    err.status = 409;
    err.usageLocations = usageLocations;
    throw err;
  }

  // If upload source, delete binary
  if (asset.source === 'upload' && asset.objectKey && driver) {
    await driver.delete(asset.objectKey).catch(() => {});
  }

  await db.prepare('DELETE FROM media_assets WHERE id = ?').bind(id).run();

  await recordAuditEvent(db, {
    entityType: 'media',
    entityId: id,
    action: 'delete',
    actorAdmin,
    summary: { filename: asset.filename, objectKey: asset.objectKey },
  });

  return { deleted: true };
}

/**
 * Unlink a media asset from usage locations and/or services.
 * If location is provided, unlinks only that specific reference.
 * If location is omitted or 'all', unlinks all references to this asset.
 */
export async function unlinkMediaAsset(
  db: any,
  id: string,
  location?: string,
  actorAdmin = 'admin'
): Promise<{ unlinked: boolean; remainingUsageLocations: string[] }> {
  const asset = await db
    .prepare('SELECT id, filename FROM media_assets WHERE id = ?')
    .bind(id)
    .first();

  if (!asset) {
    const err: any = new Error('Media asset not found.');
    err.status = 404;
    throw err;
  }

  const unlinkedLocations: string[] = [];

  if (!location || location === 'all') {
    // 1. Remove all media_references for this asset
    const rawRefs = await db
      .prepare('SELECT usageLocation FROM media_references WHERE mediaAssetId = ?')
      .bind(id)
      .all();
    for (const r of rawRefs?.results || []) {
      unlinkedLocations.push(r.usageLocation);
    }
    await db.prepare('DELETE FROM media_references WHERE mediaAssetId = ?').bind(id).run();

    // 2. Unlink from all services referencing this asset
    const rawServices = await db
      .prepare('SELECT id, title FROM services WHERE mediaAssetId = ?')
      .bind(id)
      .all();
    for (const s of rawServices?.results || []) {
      unlinkedLocations.push(`Service: ${s.title}`);
    }
    await db
      .prepare(
        "UPDATE services SET mediaAssetId = NULL, updatedAt = datetime('now'), updatedBy = ? WHERE mediaAssetId = ?"
      )
      .bind(actorAdmin, id)
      .run();

    await recordAuditEvent(db, {
      entityType: 'media',
      entityId: id,
      action: 'unlink_all',
      actorAdmin,
      summary: { filename: asset.filename, unlinkedLocations },
    });
  } else {
    // Unlink specific location
    const trimmedLoc = location.trim();
    if (trimmedLoc.startsWith('Service:')) {
      const serviceTitle = trimmedLoc.replace(/^Service:\s*/, '').trim();
      const svc = await db
        .prepare('SELECT id, title FROM services WHERE mediaAssetId = ? AND (title = ? OR id = ?)')
        .bind(id, serviceTitle, trimmedLoc)
        .first();

      if (svc) {
        await db
          .prepare(
            "UPDATE services SET mediaAssetId = NULL, updatedAt = datetime('now'), updatedBy = ? WHERE id = ?"
          )
          .bind(actorAdmin, svc.id)
          .run();
        unlinkedLocations.push(`Service: ${svc.title}`);
      }
    } else {
      // Could be in media_references
      const ref = await db
        .prepare('SELECT usageLocation FROM media_references WHERE mediaAssetId = ? AND usageLocation = ?')
        .bind(id, trimmedLoc)
        .first();

      if (ref) {
        await db
          .prepare('DELETE FROM media_references WHERE mediaAssetId = ? AND usageLocation = ?')
          .bind(id, trimmedLoc)
          .run();
        unlinkedLocations.push(trimmedLoc);
      } else {
        // Also check if matches service ID or title directly
        const svc = await db
          .prepare('SELECT id, title FROM services WHERE mediaAssetId = ? AND (id = ? OR title = ?)')
          .bind(id, trimmedLoc, trimmedLoc)
          .first();

        if (svc) {
          await db
            .prepare(
              "UPDATE services SET mediaAssetId = NULL, updatedAt = datetime('now'), updatedBy = ? WHERE id = ?"
            )
            .bind(actorAdmin, svc.id)
            .run();
          unlinkedLocations.push(`Service: ${svc.title}`);
        }
      }
    }

    await recordAuditEvent(db, {
      entityType: 'media',
      entityId: id,
      action: 'unlink',
      actorAdmin,
      summary: { filename: asset.filename, location: trimmedLoc, unlinkedLocations },
    });
  }

  // Calculate remaining usage locations
  const remainingRefs = await db
    .prepare('SELECT usageLocation FROM media_references WHERE mediaAssetId = ?')
    .bind(id)
    .all();
  const remainingLocations: string[] = (remainingRefs?.results || []).map((r: any) => r.usageLocation);

  const remainingServices = await db
    .prepare('SELECT title FROM services WHERE mediaAssetId = ?')
    .bind(id)
    .all();
  for (const s of remainingServices?.results || []) {
    remainingLocations.push(`Service: ${s.title}`);
  }

  return {
    unlinked: true,
    remainingUsageLocations: remainingLocations,
  };
}

/**
 * Assign an asset to a fixed usage location.
 */
export async function assignMediaToUsageLocation(
  db: any,
  usageLocation: string,
  mediaAssetId: string,
  actorAdmin = 'admin'
): Promise<{ usageLocation: string; mediaAssetId: string }> {
  if (!isValidUsageLocation(usageLocation)) {
    const err: any = new Error(`Unknown usage location: '${usageLocation}'.`);
    err.status = 400;
    throw err;
  }

  const asset = await db
    .prepare('SELECT id FROM media_assets WHERE id = ?')
    .bind(mediaAssetId)
    .first();

  if (!asset) {
    const err: any = new Error('Target media asset does not exist.');
    err.status = 404;
    throw err;
  }

  const refId = `ref-${usageLocation}`;
  await db
    .prepare(
      `INSERT INTO media_references (id, usageLocation, mediaAssetId, updatedAt, updatedBy)
       VALUES (?, ?, ?, datetime('now'), ?)
       ON CONFLICT(usageLocation) DO UPDATE SET
         mediaAssetId = excluded.mediaAssetId,
         updatedAt = datetime('now'),
         updatedBy = excluded.updatedBy`
    )
    .bind(refId, usageLocation, mediaAssetId, actorAdmin)
    .run();

  await recordAuditEvent(db, {
    entityType: 'media_reference',
    entityId: usageLocation,
    action: 'assign',
    actorAdmin,
    summary: { usageLocation, mediaAssetId },
  });

  return { usageLocation, mediaAssetId };
}

/**
 * Safe fallback resolver for a usage location.
 */
export async function getMediaUrlForUsageLocation(
  db: any,
  usageLocation: string,
  fallbackUrl = '/images/placeholder.jpg'
): Promise<string> {
  if (!db) return fallbackUrl;
  try {
    const ref = await db
      .prepare(
        `SELECT a.source, a.publicUrl, a.objectKey
         FROM media_references r
         JOIN media_assets a ON a.id = r.mediaAssetId
         WHERE r.usageLocation = ?`
      )
      .bind(usageLocation)
      .first();

    if (!ref) return fallbackUrl;
    return resolveAssetUrl(ref);
  } catch {
    return fallbackUrl;
  }
}
