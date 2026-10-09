export const prerender = false;

import type { APIRoute } from 'astro';
import { getAppEnv } from '../../lib/env';
import { resolveStorageDriver } from '../../lib/storage/StorageDriver';

const KEY_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|jpeg|png|webp)$/i;

export const GET: APIRoute = async (context) => {
  const { key } = context.params;

  if (!key || !KEY_REGEX.test(key)) {
    return new Response('Not Found', { status: 404 });
  }

  const env = getAppEnv(context.locals);
  const driver = resolveStorageDriver(env);

  if (!driver) {
    return new Response('Storage Unavailable', { status: 503 });
  }

  try {
    const item = await driver.get(key);
    if (!item || !item.bytes) {
      return new Response('Not Found', { status: 404 });
    }

    return new Response(item.bytes as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': item.mimeType || 'application/octet-stream',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (err) {
    console.error('Error serving media binary:', err);
    return new Response('Internal Server Error', { status: 500 });
  }
};
