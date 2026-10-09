import { isValidAdminSession, isAuthorizedAdmin } from './serverAuth';
import type { AppEnv } from './env';

export interface AdminAuthResult {
  authorized: boolean;
  actor: string;
}

export async function requireAdminAuth(context: any, env?: AppEnv): Promise<AdminAuthResult> {
  // 1. Check session
  try {
    const admin = await context.session?.get('admin');
    const adminSince = await context.session?.get('adminSince');
    if (isValidAdminSession({ admin, adminSince })) {
      return { authorized: true, actor: 'admin-session' };
    }
  } catch {
    // Session check error or not available
  }

  // 2. Check API authorization headers (for automated tools / scripts)
  if (context.request && env && isAuthorizedAdmin(context.request, env)) {
    return { authorized: true, actor: 'admin-api-key' };
  }

  return { authorized: false, actor: 'anonymous' };
}
