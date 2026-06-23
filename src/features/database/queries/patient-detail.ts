import { and, eq, max, min, sql } from "drizzle-orm";
import { schema, type DB } from "..";

export async function getPatientTimeline(db: DB, patientId: string) {
  type TimelineItem =
    | {
        kind: "seizure";
        id: string;
        timestamp: string;
        durationSeconds: number | null;
        seizureType: string | null;
        notes: string | null;
        recorderName: string | null;
      }
    | {
        kind: "share";
        id: string;
        timestamp: string;
        recipientEmail: string | null;
        sharerName: string | null;
        expiresAt: string | null;
      };

  const seizures = await db
    .select({
      id: schema.seizureRecords.id,
      recordedAt: schema.seizureRecords.recordedAt,
      durationSeconds: schema.seizureRecords.durationSeconds,
      seizureType: schema.seizureRecords.seizureType,
      notes: schema.seizureRecords.notes,
      recorderFirstName: schema.userProfiles.firstName,
      recorderLastName: schema.userProfiles.lastName,
    })
    .from(schema.seizureRecords)
    .leftJoin(
      schema.userProfiles,
      eq(schema.seizureRecords.recordedBy, schema.userProfiles.id),
    )
    .where(eq(schema.seizureRecords.patientId, patientId))
    .orderBy(sql`${schema.seizureRecords.recordedAt} desc`);

  const shares = await db
    .select({
      id: schema.seizureRecordShares.id,
      createdAt: schema.seizureRecordShares.createdAt,
      recipientEmail: schema.seizureRecordShares.recipientEmail,
      expiresAt: schema.seizureRecordShares.expiresAt,
      sharerFirstName: schema.userProfiles.firstName,
      sharerLastName: schema.userProfiles.lastName,
    })
    .from(schema.seizureRecordShares)
    .innerJoin(
      schema.seizureRecords,
      eq(schema.seizureRecordShares.seizureRecordId, schema.seizureRecords.id),
    )
    .leftJoin(
      schema.userProfiles,
      eq(schema.seizureRecordShares.sharedBy, schema.userProfiles.id),
    )
    .where(eq(schema.seizureRecords.patientId, patientId))
    .orderBy(sql`${schema.seizureRecordShares.createdAt} desc`);

  const mappedSeizures: TimelineItem[] = seizures.map((s) => ({
    kind: "seizure",
    id: s.id,
    timestamp: s.recordedAt ?? new Date().toISOString(),
    durationSeconds: s.durationSeconds,
    seizureType: s.seizureType,
    notes: s.notes,
    recorderName: formatName(s.recorderFirstName, s.recorderLastName),
  }));

  const mappedShares: TimelineItem[] = shares.map((s) => ({
    kind: "share",
    id: s.id,
    timestamp: s.createdAt ?? new Date().toISOString(),
    recipientEmail: s.recipientEmail,
    sharerName: formatName(s.sharerFirstName, s.sharerLastName),
    expiresAt: s.expiresAt,
  }));

  return [...mappedSeizures, ...mappedShares].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
}

export async function getPatientStats(db: DB, patientId: string) {
  const rows = await db
    .select({
      totalEvents: sql<number>`cast(count(*) as integer)`,
      averageDuration: sql<
        number | null
      >`avg(${schema.seizureRecords.durationSeconds})`,
      longestCalmSpell: sql<
        number | null
      >`max(${schema.seizureRecords.durationSeconds})`,
      lastRecordedAt: max(schema.seizureRecords.recordedAt),
      firstRecordedAt: min(schema.seizureRecords.recordedAt),
    })
    .from(schema.seizureRecords)
    .where(eq(schema.seizureRecords.patientId, patientId));

  const commonTypeRow = await db
    .select({
      seizureType: schema.seizureRecords.seizureType,
      count: sql<number>`cast(count(*) as integer)`,
    })
    .from(schema.seizureRecords)
    .where(
      and(
        eq(schema.seizureRecords.patientId, patientId),
        sql`${schema.seizureRecords.seizureType} is not null`,
      ),
    )
    .groupBy(schema.seizureRecords.seizureType)
    .orderBy(sql`count(*) desc`)
    .limit(1);

  const row = rows[0];

  return {
    totalEvents: row?.totalEvents ?? 0,
    averageDuration: row?.averageDuration ?? null,
    longestCalmSpell: null, // requires date-based diff, computed below
    lastRecordedAt: row?.lastRecordedAt ?? null,
    commonType: commonTypeRow[0]?.seizureType ?? null,
  };
}

export async function getSeizureCalendarDays(db: DB, patientId: string) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 1);

  const records = await db
    .select({
      recordedAt: schema.seizureRecords.recordedAt,
    })
    .from(schema.seizureRecords)
    .where(
      and(
        eq(schema.seizureRecords.patientId, patientId),
        sql`${schema.seizureRecords.recordedAt} >= ${monthStart.toISOString()}`,
        sql`${schema.seizureRecords.recordedAt} < ${monthEnd.toISOString()}`,
      ),
    );

  const dayCounts = new Map<number, number>();
  for (const record of records) {
    if (!record.recordedAt) continue;
    const day = new Date(record.recordedAt).getDate();
    dayCounts.set(day, (dayCounts.get(day) ?? 0) + 1);
  }

  return dayCounts;
}

export async function getBestCalmSpellDays(db: DB, patientId: string) {
  const records = await db
    .select({ recordedAt: schema.seizureRecords.recordedAt })
    .from(schema.seizureRecords)
    .where(eq(schema.seizureRecords.patientId, patientId))
    .orderBy(sql`${schema.seizureRecords.recordedAt} asc`);

  if (records.length === 0) return null;

  const dates = records
    .map((r) => (r.recordedAt ? new Date(r.recordedAt) : null))
    .filter(Boolean) as Date[];

  let best = 0;
  for (let i = 1; i < dates.length; i++) {
    const diff =
      (dates[i].getTime() - dates[i - 1].getTime()) / (1000 * 60 * 60 * 24);
    best = Math.max(best, Math.floor(diff));
  }

  return best;
}

function formatName(first?: string | null, last?: string | null) {
  return [first, last].filter(Boolean).join(" ") || "Unknown";
}
