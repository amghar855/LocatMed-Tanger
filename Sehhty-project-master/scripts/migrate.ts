import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import path from "path";

const dbPath = path.join(process.cwd(), "data", "locatomed.db");
const sqlite = new Database(dbPath);

sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

const db = drizzle(sqlite);

migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle/migrations") });

console.log("✓ Migrations applied successfully");
sqlite.close();
