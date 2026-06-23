import { eq } from "drizzle-orm";
import { schema, type DB } from "..";
import type { DBInsertTables, DBTables, DBUpdateTables } from "../types";

export async function getCareHomes(
  db: DB,
  {
    offset,
    limit,
  }: {
    offset?: number;
    limit?: number;
  } = {},
): Promise<DBTables["careHome"][]> {
  return await db
    .select()
    .from(schema.careHome)
    .limit(limit ?? 100)
    .offset(offset ?? 0);
}

export async function getCareHomeById(
  db: DB,
  id: string,
): Promise<DBTables["careHome"] | undefined> {
  const [careHome] = await db
    .select()
    .from(schema.careHome)
    .where(eq(schema.careHome.id, id));
  return careHome;
}

export async function createCareHome(
  db: DB,
  data: DBInsertTables["careHome"],
): Promise<DBTables["careHome"]> {
  const [careHome] = await db.insert(schema.careHome).values(data).returning();
  return careHome;
}

export async function updateCareHomeById(
  db: DB,
  id: string,
  data: DBUpdateTables["careHome"],
): Promise<DBTables["careHome"] | undefined> {
  const [updatedCareHome] = await db
    .update(schema.careHome)
    .set(data)
    .where(eq(schema.careHome.id, id))
    .returning();
  return updatedCareHome;
}

export async function deleteCareHomeById(
  db: DB,
  id: string,
): Promise<DBTables["careHome"] | undefined> {
  const [deletedCareHome] = await db
    .delete(schema.careHome)
    .where(eq(schema.careHome.id, id))
    .returning();
  return deletedCareHome;
}
