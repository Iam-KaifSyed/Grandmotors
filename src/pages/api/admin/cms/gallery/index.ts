export const prerender = false;

import type { APIRoute } from 'astro';
import { getAppEnv, getDatabase } from '../../../../../lib/env';
import { requireAdminAuth } from '../../../../../lib/cmsAuth';
import { listAllGalleryItems, createGalleryItem, listGalleryCategories, type GalleryItemRecord } from '../../../../../lib/galleryStore';

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
    const category = context.url.searchParams.get('category') || undefined;

    const items = await listAllGalleryItems(db, q);
    const categories = await listGalleryCategories(db);

    const filtered = category
      ? items.filter((i: GalleryItemRecord) => i.categoryId === category)
      : items;

    return new Response(JSON.stringify({ items: filtered, categories }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || 'Failed to list gallery items' }), {
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

  try {
    const body = await context.request.json().catch(() => ({}));
    const item = await createGalleryItem(
      db,
      {
        mediaAssetId: body.mediaAssetId,
        title: body.title,
        description: body.description,
        categoryId: body.categoryId || null,
        published: body.published,
      },
      auth.actor
    );

    return new Response(JSON.stringify({ item }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    const status = err.status || 500;
    return new Response(
      JSON.stringify({
        error: err?.message || 'Failed to create gallery item',
        field: err.field,
      }),
      {
        status,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
