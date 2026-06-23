import { eq } from "drizzle-orm";
import { schema, type DB } from "..";
import type { DBInsertTables, DBTables, DBUpdateTables } from "../types";

export async function getSeizureRecords(
  db: DB,
  {
    offset,
    limit,
  }: {
    offset?: number;
    limit?: number;
  } = {},
): Promise<DBTables["seizureRecords"][]> {
  return await db
    .select()
    .from(schema.seizureRecords)
    .limit(limit ?? 100)
    .offset(offset ?? 0);
}

export async function getSeizureRecordById(
  db: DB,
  id: string,
): Promise<DBTables["seizureRecords"] | undefined> {
  const [record] = await db
    .select()
    .from(schema.seizureRecords)
    .where(eq(schema.seizureRecords.id, id));
  return record;
}

export async function createSeizureRecord(
  db: DB,
  data: DBInsertTables["seizureRecords"],
): Promise<DBTables["seizureRecords"]> {
  const [record] = await db
    .insert(schema.seizureRecords)
    .values(data)
    .returning();
  return record;
}

export async function updateSeizureRecordById(
  db: DB,
  id: string,
  data: DBUpdateTables["seizureRecords"],
): Promise<DBTables["seizureRecords"] | undefined> {
  const [updatedRecord] = await db
    .update(schema.seizureRecords)
    .set(data)
    .where(eq(schema.seizureRecords.id, id))
    .returning();
  return updatedRecord;
}

export async function deleteSeizureRecordById(
  db: DB,
  id: string,
): Promise<DBTables["seizureRecords"] | undefined> {
  const [deletedRecord] = await db
    .delete(schema.seizureRecords)
    .where(eq(schema.seizureRecords.id, id))
    .returning();
  return deletedRecord;
}
