/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />
type D1Database = any;
type Env = {
  DB: D1Database;
  ADMIN_API_KEY?: string;
  ADMIN_SECRET?: string;
};

declare module 'cloudflare:workers' {
  export const env: Env & Record<string, any>;
}

declare namespace App {
  interface Locals {
    runtime?: {
      env?: Env;
    };
    cfContext?: any;
  }
  interface SessionData {
    /** Set to true once an admin has authenticated via /api/admin/login. */
    admin: boolean;
    /** Epoch ms when the admin session was established (used for expiry checks). */
    adminSince: number;
  }
}
