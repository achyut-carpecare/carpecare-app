import {
  pgTable,
  integer,
  bigint,
  boolean,
  timestamp,
  foreignKey,
  uuid,
  varchar,
  text,
  unique,
  uniqueIndex,
  date,
  pgEnum,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const careHomeRole = pgEnum("care_home_role", ["admin", "member"]);
export const invitationStatus = pgEnum("invitation_status", [
  "pending",
  "accepted",
  "expired",
  "revoked",
]);

export const gooseDbVersion = pgTable("goose_db_version", {
  id: integer()
    .primaryKey()
    .generatedByDefaultAsIdentity({
      name: "goose_db_version_id_seq",
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: 2147483647,
      cache: 1,
    }),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  versionId: bigint("version_id", { mode: "number" }).notNull(),
  isApplied: boolean("is_applied").notNull(),
  tstamp: timestamp({ mode: "string" }).defaultNow().notNull(),
});

export const seizureRecordShares = pgTable(
  "seizure_record_shares",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    seizureRecordId: uuid("seizure_record_id"),
    sharedBy: uuid("shared_by"),
    recipientEmail: varchar("recipient_email"),
    expiresAt: timestamp("expires_at", { mode: "string" }),
    linkTokenHash: text("link_token_hash"),
    otpHash: text("otp_hash"),
    otpAttempts: integer("otp_attempts").default(0),
    lastOtpSentAt: timestamp("last_otp_sent_at", { mode: "string" }),
    accessedAt: timestamp("accessed_at", { mode: "string" }),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.seizureRecordId],
      foreignColumns: [seizureRecords.id],
      name: "seizure_record_shares_seizure_record_id_fkey",
    }),
    foreignKey({
      columns: [table.sharedBy],
      foreignColumns: [userProfiles.id],
      name: "seizure_record_shares_shared_by_fkey",
    }),
  ],
);

export const careHomeMembers = pgTable(
  "care_home_members",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    userId: uuid("user_id").notNull(),
    careHomeId: uuid("care_home_id").notNull(),
    role: careHomeRole().default("member").notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.careHomeId],
      foreignColumns: [careHome.id],
      name: "care_home_members_care_home_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [userProfiles.id],
      name: "care_home_members_user_id_fkey",
    }).onDelete("cascade"),
    unique("care_home_members_user_id_care_home_id_key").on(
      table.userId,
      table.careHomeId,
    ),
  ],
);

export const careHomeInvitations = pgTable(
  "care_home_invitations",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    careHomeId: uuid("care_home_id").notNull(),
    invitedEmail: varchar("invited_email").notNull(),
    role: careHomeRole().default("member").notNull(),
    invitedBy: uuid("invited_by"),
    status: invitationStatus().default("pending").notNull(),
    linkTokenHash: text("link_token_hash"),
    otpHash: text("otp_hash"),
    otpAttempts: integer("otp_attempts").default(0),
    lastOtpSentAt: timestamp("last_otp_sent_at", { mode: "string" }),
    acceptedAt: timestamp("accepted_at", { mode: "string" }),
    acceptedBy: uuid("accepted_by"),
    expiresAt: timestamp("expires_at", { mode: "string" }),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("idx_care_home_invitations_pending_email")
      .using(
        "btree",
        table.careHomeId.asc().nullsLast().op("text_ops"),
        table.invitedEmail.asc().nullsLast().op("text_ops"),
      )
      .where(sql`(status = 'pending'::invitation_status)`),
    foreignKey({
      columns: [table.acceptedBy],
      foreignColumns: [userProfiles.id],
      name: "care_home_invitations_accepted_by_fkey",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.careHomeId],
      foreignColumns: [careHome.id],
      name: "care_home_invitations_care_home_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.invitedBy],
      foreignColumns: [userProfiles.id],
      name: "care_home_invitations_invited_by_fkey",
    }).onDelete("set null"),
  ],
);

export const seizureRecords = pgTable(
  "seizure_records",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    patientId: uuid("patient_id"),
    recordedBy: uuid("recorded_by"),
    videoId: uuid("video_id"),
    recordedAt: timestamp("recorded_at", { mode: "string" }),
    durationSeconds: integer("duration_seconds"),
    seizureType: varchar("seizure_type"),
    notes: text(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.patientId],
      foreignColumns: [patients.id],
      name: "seizure_records_patient_id_fkey",
    }),
    foreignKey({
      columns: [table.recordedBy],
      foreignColumns: [userProfiles.id],
      name: "seizure_records_recorded_by_fkey",
    }),
    foreignKey({
      columns: [table.videoId],
      foreignColumns: [files.id],
      name: "seizure_records_video_id_fkey",
    }),
  ],
);

export const patients = pgTable(
  "patients",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    careHomeId: uuid("care_home_id"),
    firstName: varchar("first_name"),
    lastName: varchar("last_name"),
    dateOfBirth: date("date_of_birth"),
    nhsNumber: varchar("nhs_number"),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.careHomeId],
      foreignColumns: [careHome.id],
      name: "patients_care_home_id_fkey",
    }),
  ],
);

export const files = pgTable("files", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  s3Key: varchar("s3_key"),
  mimeType: varchar("mime_type"),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  sizeBytes: bigint("size_bytes", { mode: "number" }),
  uploadedAt: timestamp("uploaded_at", { mode: "string" }),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().notNull(),
});

export const careHome = pgTable("care_home", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  name: varchar(),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().notNull(),
});

export const platformInvitations = pgTable(
  "platform_invitations",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    invitedEmail: varchar("invited_email").notNull(),
    invitedBy: uuid("invited_by"),
    status: invitationStatus().default("pending").notNull(),
    linkTokenHash: text("link_token_hash"),
    acceptedAt: timestamp("accepted_at", { mode: "string" }),
    acceptedBy: uuid("accepted_by"),
    expiresAt: timestamp("expires_at", { mode: "string" }),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("idx_platform_invitations_pending_email")
      .using("btree", table.invitedEmail.asc().nullsLast().op("text_ops"))
      .where(sql`(status = 'pending'::invitation_status)`),
    foreignKey({
      columns: [table.acceptedBy],
      foreignColumns: [userProfiles.id],
      name: "platform_invitations_accepted_by_fkey",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.invitedBy],
      foreignColumns: [userProfiles.id],
      name: "platform_invitations_invited_by_fkey",
    }).onDelete("set null"),
  ],
);

export const userProfiles = pgTable("user_profiles", {
  id: uuid().primaryKey().notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().notNull(),
  isSystemAdmin: boolean("is_system_admin").default(false).notNull(),
});
