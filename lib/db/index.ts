import Database from 'better-sqlite3';
import { drizzle, BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import path from 'path';
import fs from 'fs';
import * as schema from './schema';
import { backfillTasks } from './migrate';

const DB_PATH = path.join(process.cwd(), 'data', 'meetings.db');

let db: BetterSQLite3Database<typeof schema> | null = null;
let rawDb: Database.Database | null = null;

export type DrizzleDb = BetterSQLite3Database<typeof schema>;

export function getDb(): DrizzleDb {
  if (!db) {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    rawDb = new Database(DB_PATH);
    rawDb.pragma('journal_mode = WAL');
    rawDb.pragma('foreign_keys = ON');

    db = drizzle(rawDb, { schema });
    migrate(db, { migrationsFolder: path.join(process.cwd(), 'drizzle') });
    backfillTasks(rawDb);
  }
  return db;
}

export function getRawDb(): Database.Database {
  if (!rawDb) {
    getDb(); // Initialize if not yet done
  }
  return rawDb!;
}
