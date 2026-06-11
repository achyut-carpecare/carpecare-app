import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

async function main() {
  const client = postgres(process.env.DATABASE_URL!);
  return drizzle({ client });
}

export const db = await main();
