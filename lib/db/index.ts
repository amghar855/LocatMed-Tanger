import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

const dbConfig = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

// Only log missing config in production to help debugging
if (process.env.NODE_ENV === "production") {
  if (!dbConfig.host || !dbConfig.user || !dbConfig.database) {
    console.error("Missing database configuration environment variables!");
  }
}

const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
});

export const db = drizzle(pool, { schema, mode: "default" });
