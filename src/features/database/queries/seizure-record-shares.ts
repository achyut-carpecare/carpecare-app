import { and, eq, inArray } from "drizzle-orm";
import { schema, type DB } from "..";
import type { DBInsertTables, DBTables, DBUpdateTables } from "../types";

export async function getSeizureRecordShares(
  db: DB,
  {
    seizureRecordIds,
    offset,
    limit,
  }: {
    seizureRecordIds?: string[];
    offset?: number;
    limit?: number;
  } = {},
): Promise<DBTables["seizureRecordShares"][]> {
  const conditions: ReturnType<typeof eq>[] = [];
  if (seizureRecordIds && seizureRecordIds.length > 0) {
    conditions.push(
      inArray(schema.seizureRecordShares.seizureRecordId, seizureRecordIds),
    );
  }

  return await db
    .select()
    .from(schema.seizureRecordShares)
    .where(and(...conditions))
    .limit(limit ?? 100)
    .offset(offset ?? 0);
}

export async function getSeizureRecordShareById(
  db: DB,
  id: string,
  {
    seizureRecordIds,
  }: {
    seizureRecordIds?: string[];
  } = {},
): Promise<DBTables["seizureRecordShares"] | undefined> {
  const [share] = await db
    .select()
    .from(schema.seizureRecordShares)
    .where(
      and(
        eq(schema.seizureRecordShares.id, id),
        ...(seizureRecordIds && seizureRecordIds.length > 0
          ? [
              inArray(
                schema.seizureRecordShares.seizureRecordId,
                seizureRecordIds,
              ),
            ]
          : []),
      ),
    )
    .limit(1);
  return share;
}

export async function createSeizureRecordShare(
  db: DB,
  data: DBInsertTables["seizureRecordShares"],
): Promise<DBTables["seizureRecordShares"]> {
  const [share] = await db
    .insert(schema.seizureRecordShares)
    .values(data)
    .returning();
  return share;
}

export async function updateSeizureRecordShareById(
  db: DB,
  id: string,
  data: DBUpdateTables["seizureRecordShares"],
): Promise<DBTables["seizureRecordShares"] | undefined> {
  const [updatedShare] = await db
    .update(schema.seizureRecordShares)
    .set(data)
    .where(eq(schema.seizureRecordShares.id, id))
    .returning();
  return updatedShare;
}

export async function deleteSeizureRecordShareById(
  db: DB,
  id: string,
): Promise<DBTables["seizureRecordShares"] | undefined> {
  const [deletedShare] = await db
    .delete(schema.seizureRecordShares)
    .where(eq(schema.seizureRecordShares.id, id))
    .returning();
  return deletedShare;
}
