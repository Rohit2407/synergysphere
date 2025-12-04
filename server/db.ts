import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Example: postgres://user:password@localhost:5432/synergysphere");
}

// Create a pg pool
// Create a pg pool
const isProduction = process.env.NODE_ENV === "production" || (process.env.DATABASE_URL || "").includes("render.com");

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // In production (Render) enable TLS but do not require strict certificate checking
  // This avoids errors with managed DB providers that use trusted certs.
  ...(isProduction ? { ssl: { rejectUnauthorized: false } } : {}),
});

// Bind drizzle to the pool
export const db = drizzle(pool, { schema });