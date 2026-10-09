export const prerender = false;

import type { APIRoute } from 'astro';
import { getAppEnv, getDatabase } from '../../../../../lib/env';
import { requireAdminAuth } from '../../../../../lib/cmsAuth';
import { assignMediaToUsageLocation } from '../../../../../lib/mediaStore';

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

  try {
    const body = await context.request.json().catch(() => ({}));
    const { usageLocation, mediaAssetId } = body;

    if (!usageLocation || !mediaAssetId) {
      return new Response(
        JSON.stringify({ error: 'Missing usageLocation or mediaAssetId in payload.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = await assignMediaToUsageLocation(db, usageLocation, mediaAssetId, auth.actor);
    return new Response(JSON.stringify({ reference: result }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    const status = err.status || 500;
    return new Response(JSON.stringify({ error: err?.message || 'Failed to assign media' }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
