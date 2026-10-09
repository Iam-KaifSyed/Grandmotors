import type { StorageDriver } from './StorageDriver';

export class R2Driver implements StorageDriver {
  constructor(private bucket: any) {}

  async put(objectKey: string, bytes: Uint8Array, meta: { mimeType: string }): Promise<void> {
    await this.bucket.put(objectKey, bytes, {
      httpMetadata: { contentType: meta.mimeType },
    });
  }

  async get(objectKey: string): Promise<{ bytes: Uint8Array; mimeType: string } | null> {
    const obj = await this.bucket.get(objectKey);
    if (!obj) return null;
    const arrayBuffer = await obj.arrayBuffer();
    const mimeType = obj.httpMetadata?.contentType || 'application/octet-stream';
    return {
      bytes: new Uint8Array(arrayBuffer),
      mimeType,
    };
  }

  async delete(objectKey: string): Promise<void> {
    await this.bucket.delete(objectKey);
  }

  getUrl(objectKey: string): string {
    return `/media/${objectKey}`;
  }
}
