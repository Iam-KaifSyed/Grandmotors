export const prerender = false;

import type { APIRoute } from 'astro';
import { getAppEnv, getDatabase } from '../../../../../../lib/env';
import { requireAdminAuth } from '../../../../../../lib/cmsAuth';
import { unlinkMediaAsset } from '../../../../../../lib/mediaStore';

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

  try {
    const body = await context.request.json().catch(() => ({}));
    const location = body?.location;

    const result = await unlinkMediaAsset(db, id, location, auth.actor);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    const status = err.status || 500;
    return new Response(
      JSON.stringify({
        error: err?.message || 'Failed to unlink asset.',
      }),
      {
        status,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
