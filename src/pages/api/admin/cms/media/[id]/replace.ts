export const prerender = false;

import type { APIRoute } from 'astro';
import { getAppEnv, getDatabase } from '../../../../../../lib/env';
import { resolveStorageDriver } from '../../../../../../lib/storage/StorageDriver';
import { requireAdminAuth } from '../../../../../../lib/cmsAuth';
import { replaceMediaAsset } from '../../../../../../lib/mediaStore';

export const POST: APIRoute = async (context) => {
  const { id } = context.params;
  if (!id) {
    return new Response(JSON.stringify({ error: 'Asset ID required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const env = getAppEnv(context.locals);
  const auth = await requireAdminAuth(context, env);
  if (!auth.authorized) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const db = getDatabase(context.locals, env);
  if (!db) {
    return new Response(JSON.stringify({ error: 'Database unavailable' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const driver = resolveStorageDriver(env);
  if (!driver) {
    return new Response(
      JSON.stringify({ error: 'Media storage (R2 binding) is unavailable.' }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    const formData = await context.request.formData();
    const file = formData.get('file') as File | null;

    if (!file || typeof file === 'string' || !file.name) {
      return new Response(JSON.stringify({ error: 'No replacement file provided.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const mimeType = file.type || 'application/octet-stream';

    const asset = await replaceMediaAsset(
      db,
      driver,
      id,
      { filename: file.name, bytes, mimeType },
      auth.actor
    );

    return new Response(JSON.stringify({ asset }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    const status = err.status || 500;
    return new Response(
      JSON.stringify({
        error: err?.message || 'Failed to replace image.',
        failedCheck: err.failedCheck,
      }),
      {
        status,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
