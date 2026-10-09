export const prerender = false;

import type { APIRoute } from 'astro';
import { getAppEnv, getDatabase } from '../../../../../lib/env';
import { resolveStorageDriver } from '../../../../../lib/storage/StorageDriver';
import { requireAdminAuth } from '../../../../../lib/cmsAuth';
import { listMediaAssets, createMediaUpload } from '../../../../../lib/mediaStore';

export const GET: APIRoute = async (context) => {
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

  try {
    const q = context.url.searchParams.get('q') || undefined;
    const assets = await listMediaAssets(db, q);
    return new Response(JSON.stringify({ assets }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || 'Failed to list media' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const POST: APIRoute = async (context) => {
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
      return new Response(JSON.stringify({ error: 'No file provided in form data.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const mimeType = file.type || 'application/octet-stream';

    const asset = await createMediaUpload(
      db,
      driver,
      { filename: file.name, bytes, mimeType },
      auth.actor
    );

    return new Response(JSON.stringify({ asset }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    const status = err.status || 500;
    return new Response(
      JSON.stringify({
        error: err?.message || 'Failed to upload image.',
        failedCheck: err.failedCheck,
      }),
      {
        status,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
