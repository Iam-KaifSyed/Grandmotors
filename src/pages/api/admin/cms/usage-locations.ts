export const prerender = false;

import type { APIRoute } from 'astro';
import { getAppEnv } from '../../../../lib/env';
import { requireAdminAuth } from '../../../../lib/cmsAuth';
import { USAGE_LOCATIONS } from '../../../../lib/usageLocations';

export const GET: APIRoute = async (context) => {
  const env = getAppEnv(context.locals);
  const auth = await requireAdminAuth(context, env);
  if (!auth.authorized) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ locations: USAGE_LOCATIONS }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
