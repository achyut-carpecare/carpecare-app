import { and, eq } from "drizzle-orm";
import { schema, type DB } from "..";
import type { DBInsertTables, DBTables, DBUpdateTables } from "../types";

export async function getPatients(
  db: DB,
  {
    careHomeId,
    offset,
    limit,
  }: {
    careHomeId?: string;
    offset?: number;
    limit?: number;
  } = {},
): Promise<DBTables["patients"][]> {
  const conditions = careHomeId
    ? [eq(schema.patients.careHomeId, careHomeId)]
    : [];
  return await db
    .select()
    .from(schema.patients)
    .where(and(...conditions))
    .limit(limit ?? 100)
    .offset(offset ?? 0);
}

export async function getPatientById(
  db: DB,
  id: string,
  {
    careHomeId,
  }: {
    careHomeId?: string;
  } = {},
): Promise<DBTables["patients"] | undefined> {
  const [patient] = await db
    .select()
    .from(schema.patients)
    .where(
      and(
        eq(schema.patients.id, id),
        ...(careHomeId ? [eq(schema.patients.careHomeId, careHomeId)] : []),
      ),
    );
  return patient;
}

export async function createPatient(
  db: DB,
  data: DBInsertTables["patients"],
): Promise<DBTables["patients"]> {
  const [patient] = await db.insert(schema.patients).values(data).returning();
  return patient;
}

export async function updatePatientById(
  db: DB,
  id: string,
  data: DBUpdateTables["patients"],
  {
    careHomeId,
  }: {
    careHomeId?: string;
  } = {},
): Promise<DBTables["patients"] | undefined> {
  const [updatedPatient] = await db
    .update(schema.patients)
    .set(data)
    .where(
      and(
        eq(schema.patients.id, id),
        ...(careHomeId ? [eq(schema.patients.careHomeId, careHomeId)] : []),
      ),
    )
    .returning();
  return updatedPatient;
}

export async function deletePatientById(
  db: DB,
  id: string,
  {
    careHomeId,
  }: {
    careHomeId?: string;
  } = {},
): Promise<DBTables["patients"] | undefined> {
  const [deletedPatient] = await db
    .delete(schema.patients)
    .where(
      and(
        eq(schema.patients.id, id),
        ...(careHomeId ? [eq(schema.patients.careHomeId, careHomeId)] : []),
      ),
    )
    .returning();
  return deletedPatient;
}
