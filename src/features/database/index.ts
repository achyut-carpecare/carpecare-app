import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
export * as schema from "./schema";

config({ path: ".env" });

const client = postgres(process.env.DATABASE_URL!);
export const db = drizzle({ client });
export type DB = typeof db;
