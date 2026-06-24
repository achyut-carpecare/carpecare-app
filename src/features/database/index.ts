import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
export * as schema from "./schema";

config({ path: ".env" });

const client = postgres(process.env.DATABASE_URL!, {
  max: 10,
  prepare: false,
  idle_timeout: 20,
  connect_timeout: 10,
});
export const db = drizzle({ client });
export type DB = typeof db;
