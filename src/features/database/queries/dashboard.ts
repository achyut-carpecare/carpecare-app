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

  const [{ count: activeShares }] = await db
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
        gte(schema.seizureRecordShares.expiresAt, new Date().toISOString()),
      ),
    );

  const [{ count: patientsWithEventToday }] = await db
    .select({
      count: sql<number>`cast(count(distinct ${schema.patients.id}) as integer)`,
    })
    .from(schema.patients)
    .innerJoin(
      schema.seizureRecords,
      eq(schema.seizureRecords.patientId, schema.patients.id),
    )
    .where(
      and(
        eq(schema.patients.careHomeId, careHomeId),
        gte(schema.seizureRecords.recordedAt, today.toISOString()),
      ),
    );

  return {
    patientCount,
    memberCount,
    eventsThisMonth,
    activeShares,
    patientsWithEventToday,
  };
}

export async function getCareHomeMonthlyInsights(db: DB, careHomeId: string) {
  const monthStart = firstDayOfMonth(new Date());

  const [row] = await db
    .select({
      averageDuration: sql<
        number | null
      >`avg(${schema.seizureRecords.durationSeconds})`,
    })
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

  const commonTypeRow = await db
    .select({
      seizureType: schema.seizureRecords.seizureType,
      count: sql<number>`cast(count(*) as integer)`,
    })
    .from(schema.seizureRecords)
    .innerJoin(
      schema.patients,
      eq(schema.seizureRecords.patientId, schema.patients.id),
    )
    .where(
      and(
        eq(schema.patients.careHomeId, careHomeId),
        gte(schema.seizureRecords.createdAt, monthStart.toISOString()),
        sql`${schema.seizureRecords.seizureType} is not null`,
      ),
    )
    .groupBy(schema.seizureRecords.seizureType)
    .orderBy(sql`count(*) desc`)
    .limit(1);

  return {
    averageDuration: row?.averageDuration ?? null,
    commonType: commonTypeRow[0]?.seizureType ?? null,
  };
}

export async function getResidentsToWatch(
  db: DB,
  careHomeId: string,
  { days = 7, limit = 5 }: { days?: number; limit?: number } = {},
) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const rows = await db
    .select({
      patientId: schema.patients.id,
      firstName: schema.patients.firstName,
      lastName: schema.patients.lastName,
      eventCount: sql<number>`cast(count(*) as integer)`,
      lastRecordedAt: sql<
        string | null
      >`max(${schema.seizureRecords.recordedAt})`,
    })
    .from(schema.seizureRecords)
    .innerJoin(
      schema.patients,
      eq(schema.seizureRecords.patientId, schema.patients.id),
    )
    .where(
      and(
        eq(schema.patients.careHomeId, careHomeId),
        gte(schema.seizureRecords.recordedAt, since.toISOString()),
      ),
    )
    .groupBy(
      schema.patients.id,
      schema.patients.firstName,
      schema.patients.lastName,
    )
    .orderBy(sql`count(*) desc`)
    .limit(limit);

  return rows.map((r) => ({
    patientId: r.patientId,
    name: formatName(r.firstName, r.lastName),
    eventCount: r.eventCount,
    lastRecordedAt: r.lastRecordedAt,
  }));
}

export async function getUnopenedShares(db: DB, careHomeId: string, limit = 5) {
  const conditions = [
    eq(schema.patients.careHomeId, careHomeId),
    sql`${schema.seizureRecordShares.accessedAt} is null`,
  ];

  const [{ count: totalUnopened }] = await db
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
    .where(and(...conditions));

  const rows = await db
    .select({
      id: schema.seizureRecordShares.id,
      patientId: schema.patients.id,
      patientFirstName: schema.patients.firstName,
      patientLastName: schema.patients.lastName,
      recipientEmail: schema.seizureRecordShares.recipientEmail,
      createdAt: schema.seizureRecordShares.createdAt,
      expiresAt: schema.seizureRecordShares.expiresAt,
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
    .where(and(...conditions))
    .orderBy(sql`${schema.seizureRecordShares.createdAt} desc`)
    .limit(limit);

  return {
    totalUnopened,
    shares: rows.map((r) => ({
      id: r.id,
      patientId: r.patientId,
      patientName: formatName(r.patientFirstName, r.patientLastName),
      recipientEmail: r.recipientEmail,
      createdAt: r.createdAt,
      expiresAt: r.expiresAt,
      expired: r.expiresAt ? new Date(r.expiresAt) < new Date() : false,
    })),
  };
}

export async function getVideoCoverage(db: DB, careHomeId: string) {
  const monthStart = firstDayOfMonth(new Date());

  const [{ total, withVideo }] = await db
    .select({
      total: count(),
      withVideo: sql<number>`cast(count(${schema.seizureRecords.videoId}) as integer)`,
    })
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

  return {
    total,
    withVideo,
    percent: total > 0 ? Math.round((withVideo / total) * 100) : null,
  };
}

export async function getMostActiveRecorder(db: DB, careHomeId: string) {
  const monthStart = firstDayOfMonth(new Date());

  const [row] = await db
    .select({
      userId: schema.userProfiles.id,
      firstName: schema.userProfiles.firstName,
      lastName: schema.userProfiles.lastName,
      eventCount: sql<number>`cast(count(*) as integer)`,
    })
    .from(schema.seizureRecords)
    .innerJoin(
      schema.patients,
      eq(schema.seizureRecords.patientId, schema.patients.id),
    )
    .innerJoin(
      schema.userProfiles,
      eq(schema.seizureRecords.recordedBy, schema.userProfiles.id),
    )
    .where(
      and(
        eq(schema.patients.careHomeId, careHomeId),
        gte(schema.seizureRecords.createdAt, monthStart.toISOString()),
      ),
    )
    .groupBy(
      schema.userProfiles.id,
      schema.userProfiles.firstName,
      schema.userProfiles.lastName,
    )
    .orderBy(sql`count(*) desc`)
    .limit(1);

  if (!row) return null;

  return {
    userId: row.userId,
    name: formatName(row.firstName, row.lastName),
    eventCount: row.eventCount,
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
