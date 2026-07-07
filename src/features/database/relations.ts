import { relations } from "drizzle-orm/relations";
import {
  seizureRecords,
  seizureRecordShares,
  userProfiles,
  careHome,
  careHomeMembers,
  careHomeInvitations,
  patients,
  files,
  platformInvitations,
} from "./schema";

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

export const seizureRecordsRelations = relations(
  seizureRecords,
  ({ one, many }) => ({
    seizureRecordShares: many(seizureRecordShares),
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
  }),
);

export const userProfilesRelations = relations(userProfiles, ({ many }) => ({
  seizureRecordShares: many(seizureRecordShares),
  careHomeMembers: many(careHomeMembers),
  careHomeInvitations_acceptedBy: many(careHomeInvitations, {
    relationName: "careHomeInvitations_acceptedBy_userProfiles_id",
  }),
  careHomeInvitations_invitedBy: many(careHomeInvitations, {
    relationName: "careHomeInvitations_invitedBy_userProfiles_id",
  }),
  seizureRecords: many(seizureRecords),
  platformInvitations_acceptedBy: many(platformInvitations, {
    relationName: "platformInvitations_acceptedBy_userProfiles_id",
  }),
  platformInvitations_invitedBy: many(platformInvitations, {
    relationName: "platformInvitations_invitedBy_userProfiles_id",
  }),
}));

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

export const careHomeRelations = relations(careHome, ({ many }) => ({
  careHomeMembers: many(careHomeMembers),
  careHomeInvitations: many(careHomeInvitations),
  patients: many(patients),
}));

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

export const patientsRelations = relations(patients, ({ one, many }) => ({
  seizureRecords: many(seizureRecords),
  careHome: one(careHome, {
    fields: [patients.careHomeId],
    references: [careHome.id],
  }),
}));

export const filesRelations = relations(files, ({ many }) => ({
  seizureRecords: many(seizureRecords),
}));

export const platformInvitationsRelations = relations(
  platformInvitations,
  ({ one }) => ({
    userProfile_acceptedBy: one(userProfiles, {
      fields: [platformInvitations.acceptedBy],
      references: [userProfiles.id],
      relationName: "platformInvitations_acceptedBy_userProfiles_id",
    }),
    userProfile_invitedBy: one(userProfiles, {
      fields: [platformInvitations.invitedBy],
      references: [userProfiles.id],
      relationName: "platformInvitations_invitedBy_userProfiles_id",
    }),
  }),
);
