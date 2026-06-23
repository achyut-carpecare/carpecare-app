import { and, eq, gte, max, sql } from "drizzle-orm";
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

export async function getPatientsWithLastSeizure(db: DB, careHomeId: string) {
  const patients = await getPatients(db, { careHomeId });

  const rows = await db
    .select({
      patientId: schema.seizureRecords.patientId,
      lastRecordedAt: max(schema.seizureRecords.recordedAt),
      totalEvents: sql<number>`cast(count(*) as integer)`,
    })
    .from(schema.seizureRecords)
    .innerJoin(
      schema.patients,
      eq(schema.seizureRecords.patientId, schema.patients.id),
    )
    .where(eq(schema.patients.careHomeId, careHomeId))
    .groupBy(schema.seizureRecords.patientId);

  const statsByPatient = new Map(
    rows.map((r) => [
      r.patientId,
      { lastRecordedAt: r.lastRecordedAt, totalEvents: r.totalEvents },
    ]),
  );

  return patients.map((patient) => {
    const stats = statsByPatient.get(patient.id);
    return {
      ...patient,
      lastRecordedAt: stats?.lastRecordedAt ?? null,
      totalEvents: stats?.totalEvents ?? 0,
    };
  });
}
