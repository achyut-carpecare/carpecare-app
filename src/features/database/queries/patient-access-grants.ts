import { and, eq } from "drizzle-orm";
import { schema, type DB } from "..";
import type { DBInsertTables, DBTables } from "../types";

export async function getPatientAccessGrantsForUser(
  db: DB,
  userId: string,
  careHomeId?: string,
): Promise<DBTables["patientAccessGrants"][]> {
  return await db
    .select()
    .from(schema.patientAccessGrants)
    .where(
      and(
        eq(schema.patientAccessGrants.userId, userId),
        ...(careHomeId
          ? [eq(schema.patientAccessGrants.careHomeId, careHomeId)]
          : []),
      ),
    );
}

export async function getPatientAccessGrantsForPatient(
  db: DB,
  patientId: string,
): Promise<DBTables["patientAccessGrants"][]> {
  return await db
    .select()
    .from(schema.patientAccessGrants)
    .where(eq(schema.patientAccessGrants.patientId, patientId));
}

export async function getPatientAccessGrant(
  db: DB,
  userId: string,
  patientId: string,
): Promise<DBTables["patientAccessGrants"] | undefined> {
  const [grant] = await db
    .select()
    .from(schema.patientAccessGrants)
    .where(
      and(
        eq(schema.patientAccessGrants.userId, userId),
        eq(schema.patientAccessGrants.patientId, patientId),
      ),
    );
  return grant;
}

export async function createPatientAccessGrant(
  db: DB,
  data: DBInsertTables["patientAccessGrants"],
): Promise<DBTables["patientAccessGrants"]> {
  const [grant] = await db
    .insert(schema.patientAccessGrants)
    .values(data)
    .returning();
  return grant;
}

export async function deletePatientAccessGrantById(
  db: DB,
  id: string,
): Promise<DBTables["patientAccessGrants"] | undefined> {
  const [deleted] = await db
    .delete(schema.patientAccessGrants)
    .where(eq(schema.patientAccessGrants.id, id))
    .returning();
  return deleted;
}
