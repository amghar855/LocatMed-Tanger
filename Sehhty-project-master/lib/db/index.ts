import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import path from "path";

const dbPath = path.join(process.cwd(), "data", "locatomed.db");

const sqlite = new Database(dbPath);

sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

// Fail fast if migrations have never been run (better-sqlite3 creates an empty
// file on first open, so we'd otherwise get cryptic "no such table" errors).
const tables = sqlite
  .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
  .get();
if (!tables) {
  throw new Error(
    `Database at ${dbPath} has no 'users' table. Run: npm run db:migrate && npm run db:seed`
  );
}

export const db = drizzle(sqlite, { schema });
