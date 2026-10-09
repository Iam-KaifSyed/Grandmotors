import type { AppEnv } from '../env';
import { R2Driver } from './R2Driver';

export interface StorageDriver {
  /** Store bytes under an object key. */
  put(objectKey: string, bytes: Uint8Array, meta: { mimeType: string }): Promise<void>;
  /** Fetch bytes + content type for serving, or null when absent. */
  get(objectKey: string): Promise<{ bytes: Uint8Array; mimeType: string } | null>;
  /** Remove bytes. Idempotent: deleting a missing key is a no-op success. */
  delete(objectKey: string): Promise<void>;
  /** Stable public URL for an object key, always the /media route. */
  getUrl(objectKey: string): string;
}

/** Returns the R2Driver when env.MEDIA exists, otherwise null (callers answer 503). */
export function resolveStorageDriver(env: AppEnv): StorageDriver | null {
  if (env?.MEDIA) {
    return new R2Driver(env.MEDIA);
  }
  return null;
}
