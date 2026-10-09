import { existsSync, mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createSqliteD1Adapter } from './sqliteD1';

let localDbInstance: any = null;

/**
 * Creates or retrieves a local SQLite database that mimics the Cloudflare D1 interface.
 * Strictly opt-in: only activates when process.env.LOCAL_SQLITE_FALLBACK === '1'.
 * Never auto-switches or silently overrides workerd/Miniflare D1.
 */
export function getLocalD1Database(): any {
  if (localDbInstance) return localDbInstance;

  // Enforce opt-in guardrail
  if (typeof process === 'undefined' || process.env.LOCAL_SQLITE_FALLBACK !== '1') {
    return null;
  }

  console.warn('⚠️ LOCAL_SQLITE_FALLBACK=1 is active: Using .wrangler/local-d1.sqlite fallback.');

  try {
    const nodeSqlite = require('node:sqlite');
    if (!nodeSqlite || !nodeSqlite.DatabaseSync) {
      return null;
    }

    const { DatabaseSync } = nodeSqlite;
    const dbDir = resolve(process.cwd(), '.wrangler');
    if (!existsSync(dbDir)) {
      mkdirSync(dbDir, { recursive: true });
    }
    const dbPath = resolve(dbDir, 'local-d1.sqlite');
    const sqlite = new DatabaseSync(dbPath);

    // Track and apply ordered migrations
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS _local_migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        appliedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const migrationsDir = resolve(process.cwd(), 'migrations');
    if (existsSync(migrationsDir)) {
      const files = readdirSync(migrationsDir)
        .filter((f) => f.endsWith('.sql'))
        .sort();

      for (const file of files) {
        const checkStmt = sqlite.prepare('SELECT 1 FROM _local_migrations WHERE name = ?');
        const applied = checkStmt.get(file);
        if (!applied) {
          const sql = readFileSync(resolve(migrationsDir, file), 'utf-8');
          sqlite.exec(sql);
          sqlite.prepare('INSERT INTO _local_migrations (name) VALUES (?)').run(file);
        }
      }
    }

    localDbInstance = createSqliteD1Adapter(sqlite);
    return localDbInstance;
  } catch (err) {
    console.warn('Could not initialize local SQLite D1 fallback:', err);
    return null;
  }
}
