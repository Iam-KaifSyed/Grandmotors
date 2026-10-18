export const prerender = false;

import type { APIRoute } from 'astro';
import { getAppEnv, getDatabase } from '../../../../../lib/env';
import { requireAdminAuth } from '../../../../../lib/cmsAuth';
import { updateGalleryItem, deleteGalleryItem } from '../../../../../lib/galleryStore';

export const PUT: APIRoute = async (context) => {
  const { id } = context.params;
  if (!id) {
    return new Response(JSON.stringify({ error: 'Gallery item ID required' }), {
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
    const item = await updateGalleryItem(
      db,
      id,
      {
        title: body.title,
        description: body.description,
        categoryId: body.categoryId !== undefined ? body.categoryId : undefined,
        displayOrder: body.displayOrder,
        published: body.published,
      },
      auth.actor
    );

    return new Response(JSON.stringify({ item }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    const status = err.status || 500;
    return new Response(
      JSON.stringify({
        error: err?.message || 'Failed to update gallery item',
        field: err.field,
      }),
      {
        status,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

export const DELETE: APIRoute = async (context) => {
  const { id } = context.params;
  if (!id) {
    return new Response(JSON.stringify({ error: 'Gallery item ID required' }), {
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
    const result = await deleteGalleryItem(db, id, auth.actor);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    const status = err.status || 500;
    return new Response(
      JSON.stringify({ error: err?.message || 'Failed to delete gallery item' }),
      {
        status,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
