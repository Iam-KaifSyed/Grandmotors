/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />
type D1Database = any;
type Env = {
  DB: D1Database;
};
declare namespace App {
  interface Locals {
    runtime: {
      env: Env;
    };
  }
}
