export const prerender = false;

import type { APIRoute } from 'astro';
import { getAppEnv, getDatabase } from '../../../../../lib/env';
import { requireAdminAuth } from '../../../../../lib/cmsAuth';
import { reorderServiceCategories } from '../../../../../lib/serviceStore';

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
    const orderedIds = body.orderedIds;

    if (!Array.isArray(orderedIds)) {
      return new Response(
        JSON.stringify({ error: 'Payload must contain an orderedIds array.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const order = await reorderServiceCategories(db, orderedIds, auth.actor);
    return new Response(JSON.stringify({ order }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message || 'Failed to reorder categories' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
