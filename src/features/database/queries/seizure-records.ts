import { and, eq } from "drizzle-orm";
import { schema, type DB } from "..";
import type { DBInsertTables, DBTables, DBUpdateTables } from "../types";

export async function getSeizureRecords(
  db: DB,
  {
    careHomeId,
    patientId,
    offset,
    limit,
  }: {
    careHomeId?: string;
    patientId?: string;
    offset?: number;
    limit?: number;
  } = {},
): Promise<DBTables["seizureRecords"][]> {
  const conditions: ReturnType<typeof eq>[] = [];
  if (careHomeId) {
    conditions.push(eq(schema.patients.careHomeId, careHomeId));
  }
  if (patientId) {
    conditions.push(eq(schema.seizureRecords.patientId, patientId));
  }

  const rows = await db
    .select({ seizureRecord: schema.seizureRecords })
    .from(schema.seizureRecords)
    .innerJoin(
      schema.patients,
      eq(schema.seizureRecords.patientId, schema.patients.id),
    )
    .where(and(...conditions))
    .limit(limit ?? 100)
    .offset(offset ?? 0);

  return rows.map((r) => r.seizureRecord);
}

export async function getSeizureRecordById(
  db: DB,
  id: string,
  {
    careHomeId,
    patientId,
  }: {
    careHomeId?: string;
    patientId?: string;
  } = {},
): Promise<DBTables["seizureRecords"] | undefined> {
  const rows = await db
    .select({ seizureRecord: schema.seizureRecords })
    .from(schema.seizureRecords)
    .innerJoin(
      schema.patients,
      eq(schema.seizureRecords.patientId, schema.patients.id),
    )
    .where(
      and(
        eq(schema.seizureRecords.id, id),
        ...(patientId ? [eq(schema.seizureRecords.patientId, patientId)] : []),
        ...(careHomeId ? [eq(schema.patients.careHomeId, careHomeId)] : []),
      ),
    )
    .limit(1);

  return rows[0]?.seizureRecord;
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
  {
    careHomeId,
    patientId,
  }: {
    careHomeId?: string;
    patientId?: string;
  } = {},
): Promise<DBTables["seizureRecords"] | undefined> {
  // Scoped update requires verifying the record belongs to the care home.
  if (careHomeId || patientId) {
    const existing = await getSeizureRecordById(db, id, {
      careHomeId,
      patientId,
    });
    if (!existing) return undefined;
  }

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
  {
    careHomeId,
    patientId,
  }: {
    careHomeId?: string;
    patientId?: string;
  } = {},
): Promise<DBTables["seizureRecords"] | undefined> {
  if (careHomeId || patientId) {
    const existing = await getSeizureRecordById(db, id, {
      careHomeId,
      patientId,
    });
    if (!existing) return undefined;
  }

  const [deletedRecord] = await db
    .delete(schema.seizureRecords)
    .where(eq(schema.seizureRecords.id, id))
    .returning();
  return deletedRecord;
}

export async function getSeizureRecordIdsForPatient(
  db: DB,
  patientId: string,
): Promise<string[]> {
  const rows = await db
    .select({ id: schema.seizureRecords.id })
    .from(schema.seizureRecords)
    .where(eq(schema.seizureRecords.patientId, patientId));
  return rows.map((r) => r.id);
}
