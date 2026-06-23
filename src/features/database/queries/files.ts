import { eq } from "drizzle-orm";
import { schema, type DB } from "..";
import type { DBInsertTables, DBTables, DBUpdateTables } from "../types";

export async function getFiles(
  db: DB,
  {
    offset,
    limit,
  }: {
    offset?: number;
    limit?: number;
  } = {},
): Promise<DBTables["files"][]> {
  return await db
    .select()
    .from(schema.files)
    .limit(limit ?? 100)
    .offset(offset ?? 0);
}

export async function getFileById(
  db: DB,
  id: string,
): Promise<DBTables["files"] | undefined> {
  const [file] = await db
    .select()
    .from(schema.files)
    .where(eq(schema.files.id, id));
  return file;
}

export async function createFile(
  db: DB,
  data: DBInsertTables["files"],
): Promise<DBTables["files"]> {
  const [file] = await db.insert(schema.files).values(data).returning();
  return file;
}

export async function updateFileById(
  db: DB,
  id: string,
  data: DBUpdateTables["files"],
): Promise<DBTables["files"] | undefined> {
  const [updatedFile] = await db
    .update(schema.files)
    .set(data)
    .where(eq(schema.files.id, id))
    .returning();
  return updatedFile;
}

export async function deleteFileById(
  db: DB,
  id: string,
): Promise<DBTables["files"] | undefined> {
  const [deletedFile] = await db
    .delete(schema.files)
    .where(eq(schema.files.id, id))
    .returning();
  return deletedFile;
}
