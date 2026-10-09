import { existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

let localDbInstance: any = null;

/**
 * Creates or retrieves a local SQLite database that mimics the Cloudflare D1 interface
 * for local development and testing when running outside workerd.
 */
export function getLocalD1Database(): any {
  if (localDbInstance) return localDbInstance;

  try {
    // Dynamic require for node:sqlite to keep browser/edge builds safe
    const nodeSqlite = (globalThis as any).process ? require('node:sqlite') : null;
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

    // Initialize bookings table if it does not exist
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS bookings (
        id TEXT PRIMARY KEY,
        customerName TEXT NOT NULL,
        phoneNumber TEXT NOT NULL,
        email TEXT,
        vehicleMake TEXT NOT NULL,
        vehicleModel TEXT NOT NULL,
        registrationNumber TEXT NOT NULL,
        serviceCategory TEXT NOT NULL,
        specificService TEXT,
        preferredDate TEXT NOT NULL,
        preferredTime TEXT NOT NULL,
        status TEXT DEFAULT 'Pending',
        additionalMessage TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    localDbInstance = {
      prepare(query: string) {
        let params: any[] = [];
        const stmtObj = {
          bind(...args: any[]) {
            params = args;
            return stmtObj;
          },
          async all() {
            const stmt = sqlite.prepare(query);
            const rows = stmt.all(...params);
            return { results: rows };
          },
          async first(colName?: string) {
            const stmt = sqlite.prepare(query);
            const row: any = stmt.get(...params);
            if (!row) return null;
            if (colName) return row[colName];
            return row;
          },
          async run() {
            const stmt = sqlite.prepare(query);
            const info = stmt.run(...params);
            return {
              success: true,
              meta: {
                changes: Number(info.changes),
                last_row_id: Number(info.lastInsertRowid),
              },
            };
          },
        };
        return stmtObj;
      },
    };

    return localDbInstance;
  } catch (err) {
    console.warn('Could not initialize local SQLite D1 fallback:', err);
    return null;
  }
}
