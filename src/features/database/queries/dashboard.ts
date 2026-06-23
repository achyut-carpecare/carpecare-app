import { and, count, eq, gte, sql } from "drizzle-orm";
import { schema, type DB } from "..";
import { firstDayOfMonth, startOfDay } from "../lib/date";

export async function getUserWithMemberships(db: DB, userId: string) {
  const [profile] = await db
    .select()
    .from(schema.userProfiles)
    .where(eq(schema.userProfiles.id, userId));

  if (!profile) return null;

  const memberships = await db
    .select({
      careHome: schema.careHome,
      role: schema.careHomeMembers.role,
    })
    .from(schema.careHomeMembers)
    .innerJoin(
      schema.careHome,
      eq(schema.careHomeMembers.careHomeId, schema.careHome.id),
    )
    .where(eq(schema.careHomeMembers.userId, userId));

  return { profile, memberships };
}

export async function getCareHomeCounts(db: DB, careHomeId: string) {
  const today = startOfDay(new Date());

  const [{ count: patientCount }] = await db
    .select({ count: count() })
    .from(schema.patients)
    .where(eq(schema.patients.careHomeId, careHomeId));

  const [{ count: memberCount }] = await db
    .select({ count: count() })
    .from(schema.careHomeMembers)
    .where(eq(schema.careHomeMembers.careHomeId, careHomeId));

  const monthStart = firstDayOfMonth(new Date());
  const [{ count: eventsThisMonth }] = await db
    .select({ count: count() })
    .from(schema.seizureRecords)
    .innerJoin(
      schema.patients,
      eq(schema.seizureRecords.patientId, schema.patients.id),
    )
    .where(
      and(
        eq(schema.patients.careHomeId, careHomeId),
        gte(schema.seizureRecords.createdAt, monthStart.toISOString()),
      ),
    );

  const [{ count: sharesThisMonth }] = await db
    .select({ count: count() })
    .from(schema.seizureRecordShares)
    .innerJoin(
      schema.seizureRecords,
      eq(schema.seizureRecordShares.seizureRecordId, schema.seizureRecords.id),
    )
    .innerJoin(
      schema.patients,
      eq(schema.seizureRecords.patientId, schema.patients.id),
    )
    .where(
      and(
        eq(schema.patients.careHomeId, careHomeId),
        gte(schema.seizureRecordShares.createdAt, monthStart.toISOString()),
      ),
    );

  const [{ count: patientsWithEventToday }] = await db
    .select({ count: count() })
    .from(schema.patients)
    .innerJoin(
      schema.seizureRecords,
      eq(schema.seizureRecords.patientId, schema.patients.id),
    )
    .where(
      and(
        eq(schema.patients.careHomeId, careHomeId),
        gte(schema.seizureRecords.createdAt, today.toISOString()),
      ),
    );

  return {
    patientCount,
    memberCount,
    eventsThisMonth,
    sharesThisMonth,
    patientsWithEventToday,
  };
}

export async function getRecentActivity(
  db: DB,
  careHomeId: string,
  limit = 10,
) {
  type Activity = {
    kind: "seizure" | "share";
    id: string;
    patientId: string;
    patientName: string;
    timestamp: string;
    durationSeconds: number | null;
    seizureType: string | null;
    recorderName: string | null;
    recipientEmail: string | null;
    sharerName: string | null;
  };

  const seizures = await db
    .select({
      id: schema.seizureRecords.id,
      patientId: schema.patients.id,
      patientFirstName: schema.patients.firstName,
      patientLastName: schema.patients.lastName,
      recordedAt: schema.seizureRecords.recordedAt,
      durationSeconds: schema.seizureRecords.durationSeconds,
      seizureType: schema.seizureRecords.seizureType,
      recorderFirstName: schema.userProfiles.firstName,
      recorderLastName: schema.userProfiles.lastName,
    })
    .from(schema.seizureRecords)
    .innerJoin(
      schema.patients,
      eq(schema.seizureRecords.patientId, schema.patients.id),
    )
    .leftJoin(
      schema.userProfiles,
      eq(schema.seizureRecords.recordedBy, schema.userProfiles.id),
    )
    .where(eq(schema.patients.careHomeId, careHomeId))
    .orderBy(sql`${schema.seizureRecords.recordedAt} desc`)
    .limit(limit);

  const shares = await db
    .select({
      id: schema.seizureRecordShares.id,
      patientId: schema.patients.id,
      patientFirstName: schema.patients.firstName,
      patientLastName: schema.patients.lastName,
      createdAt: schema.seizureRecordShares.createdAt,
      recipientEmail: schema.seizureRecordShares.recipientEmail,
      sharerFirstName: schema.userProfiles.firstName,
      sharerLastName: schema.userProfiles.lastName,
    })
    .from(schema.seizureRecordShares)
    .innerJoin(
      schema.seizureRecords,
      eq(schema.seizureRecordShares.seizureRecordId, schema.seizureRecords.id),
    )
    .innerJoin(
      schema.patients,
      eq(schema.seizureRecords.patientId, schema.patients.id),
    )
    .leftJoin(
      schema.userProfiles,
      eq(schema.seizureRecordShares.sharedBy, schema.userProfiles.id),
    )
    .where(eq(schema.patients.careHomeId, careHomeId))
    .orderBy(sql`${schema.seizureRecordShares.createdAt} desc`)
    .limit(limit);

  const mappedSeizures: Activity[] = seizures.map((s) => ({
    kind: "seizure",
    id: s.id,
    patientId: s.patientId,
    patientName: formatName(s.patientFirstName, s.patientLastName),
    timestamp: s.recordedAt ?? new Date().toISOString(),
    durationSeconds: s.durationSeconds,
    seizureType: s.seizureType,
    recorderName: formatName(s.recorderFirstName, s.recorderLastName),
    recipientEmail: null,
    sharerName: null,
  }));

  const mappedShares: Activity[] = shares.map((s) => ({
    kind: "share",
    id: s.id,
    patientId: s.patientId,
    patientName: formatName(s.patientFirstName, s.patientLastName),
    timestamp: s.createdAt ?? new Date().toISOString(),
    durationSeconds: null,
    seizureType: null,
    recorderName: null,
    recipientEmail: s.recipientEmail,
    sharerName: formatName(s.sharerFirstName, s.sharerLastName),
  }));

  return [...mappedSeizures, ...mappedShares]
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )
    .slice(0, limit);
}

function formatName(first?: string | null, last?: string | null) {
  return [first, last].filter(Boolean).join(" ") || "Unknown";
}
