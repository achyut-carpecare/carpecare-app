import { relations } from "drizzle-orm/relations";
import {
  careHome,
  patients,
  seizureRecords,
  userProfiles,
  files,
  seizureRecordShares,
} from "./schema";

export const patientsRelations = relations(patients, ({ one, many }) => ({
  careHome: one(careHome, {
    fields: [patients.careHomeId],
    references: [careHome.id],
  }),
  seizureRecords: many(seizureRecords),
}));

export const careHomeRelations = relations(careHome, ({ many }) => ({
  patients: many(patients),
}));

export const seizureRecordsRelations = relations(
  seizureRecords,
  ({ one, many }) => ({
    patient: one(patients, {
      fields: [seizureRecords.patientId],
      references: [patients.id],
    }),
    userProfile: one(userProfiles, {
      fields: [seizureRecords.recordedBy],
      references: [userProfiles.id],
    }),
    file: one(files, {
      fields: [seizureRecords.videoId],
      references: [files.id],
    }),
    seizureRecordShares: many(seizureRecordShares),
  }),
);

export const userProfilesRelations = relations(userProfiles, ({ many }) => ({
  seizureRecords: many(seizureRecords),
  seizureRecordShares: many(seizureRecordShares),
}));

export const filesRelations = relations(files, ({ many }) => ({
  seizureRecords: many(seizureRecords),
}));

export const seizureRecordSharesRelations = relations(
  seizureRecordShares,
  ({ one }) => ({
    seizureRecord: one(seizureRecords, {
      fields: [seizureRecordShares.seizureRecordId],
      references: [seizureRecords.id],
    }),
    userProfile: one(userProfiles, {
      fields: [seizureRecordShares.sharedBy],
      references: [userProfiles.id],
    }),
  }),
);
