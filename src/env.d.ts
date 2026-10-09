/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />
type D1Database = any;
type Env = {
  DB: D1Database;
  ADMIN_API_KEY?: string;
  ADMIN_SECRET?: string;
};
declare namespace App {
  interface Locals {
    runtime: {
      env: Env;
    };
  }
}
