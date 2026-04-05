import { neon, neonConfig } from "@neondatabase/serverless";
import { ENV } from "../constants/env.js";

neonConfig.fetchConnectionCache = true;

const get_connection_string = (): string => {
  if (!ENV.DB_URL || ENV.DB_URL === "not-set") {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  return ENV.DB_URL;
};

export const getDb = () => neon(get_connection_string());

export const runRaw = async (sql: string): Promise<void> => {
  const db = getDb();
  const statements = sql
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);

  for (const stmt of statements) {
    db.unsafe(stmt);
  }
};
