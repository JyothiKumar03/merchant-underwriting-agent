import { neon, neonConfig } from "@neondatabase/serverless";

// Neon recommends using HTTP fetch transport for serverless environments
neonConfig.fetchConnectionCache = true;

function getConnectionString(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  return url;
}

/**
 * Returns a tagged-template SQL executor connected to Neon.
 * Each call creates a new HTTP connection (stateless, safe for serverless).
 */
export function getDb() {
  return neon(getConnectionString());
}

/**
 * Runs a raw SQL string against Neon.
 * Use only for DDL / migrations, not for parameterised queries.
 * Splits on semicolons and executes each statement sequentially.
 */
export async function runRaw(sql: string): Promise<void> {
  const db = getDb();
  const statements = sql
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);

  for (const stmt of statements) {
    await db.unsafe(stmt);
  }
}
