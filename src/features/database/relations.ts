import { relations } from "drizzle-orm/relations";
import {
  careHome,
  patients,
  seizureRecords,
  userProfiles,
  files,
  seizureRecordShares,
  careHomeMembers,
  careHomeInvitations,
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
  careHomeMembers: many(careHomeMembers),
  careHomeInvitations: many(careHomeInvitations),
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
  careHomeMembers: many(careHomeMembers),
  careHomeInvitations_acceptedBy: many(careHomeInvitations, {
    relationName: "careHomeInvitations_acceptedBy_userProfiles_id",
  }),
  careHomeInvitations_invitedBy: many(careHomeInvitations, {
    relationName: "careHomeInvitations_invitedBy_userProfiles_id",
  }),
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

export const careHomeMembersRelations = relations(
  careHomeMembers,
  ({ one }) => ({
    careHome: one(careHome, {
      fields: [careHomeMembers.careHomeId],
      references: [careHome.id],
    }),
    userProfile: one(userProfiles, {
      fields: [careHomeMembers.userId],
      references: [userProfiles.id],
    }),
  }),
);

export const careHomeInvitationsRelations = relations(
  careHomeInvitations,
  ({ one }) => ({
    userProfile_acceptedBy: one(userProfiles, {
      fields: [careHomeInvitations.acceptedBy],
      references: [userProfiles.id],
      relationName: "careHomeInvitations_acceptedBy_userProfiles_id",
    }),
    careHome: one(careHome, {
      fields: [careHomeInvitations.careHomeId],
      references: [careHome.id],
    }),
    userProfile_invitedBy: one(userProfiles, {
      fields: [careHomeInvitations.invitedBy],
      references: [userProfiles.id],
      relationName: "careHomeInvitations_invitedBy_userProfiles_id",
    }),
  }),
);
