import type { StorageDriver } from './storage/StorageDriver';

export class MockStorageDriver implements StorageDriver {
  files = new Map<string, { bytes: Uint8Array; mimeType: string }>();

  async put(objectKey: string, bytes: Uint8Array, meta: { mimeType: string }): Promise<void> {
    this.files.set(objectKey, { bytes, mimeType: meta.mimeType });
  }

  async get(objectKey: string): Promise<{ bytes: Uint8Array; mimeType: string } | null> {
    return this.files.get(objectKey) || null;
  }

  async delete(objectKey: string): Promise<void> {
    this.files.delete(objectKey);
  }

  getUrl(objectKey: string): string {
    return `/media/${objectKey}`;
  }
}
