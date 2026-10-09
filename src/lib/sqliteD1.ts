/**
 * Adapter converting node:sqlite DatabaseSync into a Cloudflare D1-compatible interface.
 * Provides prepare, bind, all, first, run, exec, and batch (in a single transaction).
 */
export function createSqliteD1Adapter(sqlite: any): any {
  return {
    exec(sql: string) {
      sqlite.exec(sql);
    },
    prepare(query: string) {
      let params: any[] = [];
      const stmtObj = {
        bind(...args: any[]) {
          // Normalize undefined to null for sqlite binding
          params = args.map((arg) => (arg === undefined ? null : arg));
          return stmtObj;
        },
        async all() {
          const stmt = sqlite.prepare(query);
          const rows = stmt.all(...params);
          return { results: rows, success: true };
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
    async batch(stmts: any[]) {
      sqlite.exec('BEGIN TRANSACTION');
      try {
        const results = [];
        for (const s of stmts) {
          if (typeof s.run === 'function') {
            results.push(await s.run());
          } else if (typeof s.all === 'function') {
            results.push(await s.all());
          }
        }
        sqlite.exec('COMMIT');
        return results;
      } catch (err) {
        sqlite.exec('ROLLBACK');
        throw err;
      }
    },
  };
}
