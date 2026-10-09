import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { createSqliteD1Adapter } from './sqliteD1';

export function createTestD1Database() {
  const sqlite = new DatabaseSync(':memory:');
  const migrationsDir = resolve(process.cwd(), 'migrations');
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const sql = readFileSync(resolve(migrationsDir, file), 'utf-8');
    sqlite.exec(sql);
  }

  return createSqliteD1Adapter(sqlite);
}
