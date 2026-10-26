"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/features/database";
import {
  createSeizureRecordShare,
  deleteSeizureRecordById,
  deleteSeizureRecordShareById,
  getCareHomeMembersWithProfiles,
  getOrganisationMembers,
  getSeizureRecordWithDetails,
  updateSeizureRecordById,
} from "@/features/database/queries";
import {
  generateToken,
  hashToken,
  sendShareLinkEmail,
  sendShareNotificationEmail,
} from "@/features/email";
import { formatDateTime, formatName } from "@/features/dashboard/lib/format";
import { requirePatientMutationAccess } from "@/features/auth/guards";
import { getAuthUserEmailsByIds } from "@/features/auth/admin";
import {
  assertOwnsVideoFile,
  deleteVideoFile,
} from "@/features/storage/actions";

export async function createSeizureRecordShareAction({
  seizureRecordId,
  recipientEmail,
  expiresInDays,
}: {
  seizureRecordId: string;
  recipientEmail: string;
  expiresInDays: number;
}) {
  try {
    const trimmedEmail = recipientEmail.trim();
    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      return { error: "A valid recipient email is required" };
    }

    if (expiresInDays < 1 || expiresInDays > 30) {
      return { error: "Expiry must be between 1 and 30 days" };
    }

    const record = await getSeizureRecordWithDetails(db, seizureRecordId);
    if (!record) {
      return { error: "Seizure record not found" };
    }

    const { patient, careHome } = record;
    if (!patient || !careHome) {
      return {
        error: "Seizure record is missing patient or establishment data",
      };
    }

    const auth = await requirePatientMutationAccess(patient.id);
    if (auth.error || !auth.profile) {
      return { error: auth.error };
    }

    const membership = auth.memberships.find(
      (m) => m.careHome.id === careHome.id,
    );
    const isStaffShare = membership?.role === "member";

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const rawLinkToken = generateToken();
    const linkTokenHash = hashToken(rawLinkToken);

    const share = await createSeizureRecordShare(db, {
      seizureRecordId,
      recipientEmail: trimmedEmail,
      expiresAt: expiresAt.toISOString(),
      linkTokenHash,
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
    if (!appUrl) {
      return {
        error: "App URL is not configured. Please set NEXT_PUBLIC_APP_URL.",
      };
    }

    const shareUrl = `${appUrl}/share/${share.id}?token=${rawLinkToken}`;

    try {
      await sendShareLinkEmail({
        to: trimmedEmail,
        careHomeName: careHome.name ?? "Carpe Care",
        patientName: formatName(patient.firstName, patient.lastName),
        shareUrl,
        expiresAt: formatDateTime(share.expiresAt),
        recordId: seizureRecordId,
      });
    } catch (emailError) {
      console.error("Failed to send share link email:", emailError);
      await deleteSeizureRecordShareById(db, share.id);
      return { error: "Failed to send the share email. Please try again." };
    }

    if (isStaffShare) {
      // Best-effort: staff can still share immediately, no approval
      // bottleneck - admins just get a heads-up. Never block or fail the
      // share itself if this doesn't go out.
      try {
        const membersWithProfiles = await getCareHomeMembersWithProfiles(
          db,
          careHome.id,
        );
        const directAdminIds = membersWithProfiles
          .filter((m) => m.member.role === "admin")
          .map((m) => m.profile.id);

        // Org Admins who manage this establishment purely via the org
        // cascade (no direct care_home_members row) should hear about
        // staff shares too - they're full admins here either way.
        const orgAdminIds = careHome.organisationId
          ? (await getOrganisationMembers(db, careHome.organisationId)).map(
              (m) => m.userId,
            )
          : [];

        const adminIds = Array.from(
          new Set([...directAdminIds, ...orgAdminIds]),
        );
        const adminEmailById = await getAuthUserEmailsByIds(adminIds);
        const recordUrl = `${appUrl}/app/care-homes/${careHome.id}/patients/${patient.id}/seizure-records/${seizureRecordId}`;

        await Promise.all(
          adminIds.map((adminId) => {
            const adminEmail = adminEmailById.get(adminId);
            if (!adminEmail) return Promise.resolve();
            return sendShareNotificationEmail({
              to: adminEmail,
              careHomeName: careHome.name ?? "Carpe Care",
              staffName: formatName(
                auth.profile!.firstName,
                auth.profile!.lastName,
              ),
              patientName: formatName(patient.firstName, patient.lastName),
              recipientEmail: trimmedEmail,
              expiresAt: formatDateTime(share.expiresAt),
              recordId: seizureRecordId,
              recordUrl,
            });
          }),
        );
      } catch (notifyError) {
        console.error("Failed to notify admins of staff share:", notifyError);
      }
    }

    revalidatePath(`/app/care-homes/${careHome.id}/patients/${patient.id}`);

    return { success: true, share };
  } catch (error) {
    console.error("Failed to create share:", error);
    return { error: "Failed to create share link" };
  }
}

export async function deleteSeizureRecordAction({
  careHomeId,
  patientId,
  seizureRecordId,
}: {
  careHomeId: string;
  patientId: string;
  seizureRecordId: string;
}) {
  try {
    const auth = await requirePatientMutationAccess(patientId);
    if (auth.error) {
      return { error: auth.error };
    }

    const deleted = await deleteSeizureRecordById(db, seizureRecordId, {
      careHomeId,
      patientId,
    });

    if (!deleted) {
      return { error: "Seizure record not found" };
    }

    if (deleted.videoId) {
      await deleteVideoFile(deleted.videoId);
    }

    revalidatePath(`/app/care-homes/${careHomeId}/patients/${patientId}`);
    revalidatePath(`/app/care-homes/${careHomeId}`);

    return { success: true };
  } catch (error) {
    console.error("Failed to delete seizure record:", error);
    return { error: "Failed to delete seizure record" };
  }
}

export async function updateSeizureRecordAction({
  careHomeId,
  patientId,
  seizureRecordId,
  recordedAt,
  durationSeconds,
  videoDurationSeconds,
  seizureType,
  notes,
  videoId,
}: {
  careHomeId: string;
  patientId: string;
  seizureRecordId: string;
  recordedAt: string;
  durationSeconds: number;
  videoDurationSeconds?: number;
  seizureType?: string;
  notes?: string;
  videoId?: string;
}) {
  try {
    const auth = await requirePatientMutationAccess(patientId);
    if (auth.error || !auth.userId) {
      return {
        error: auth.error ?? "You do not have permission to edit this record",
      };
    }

    const record = await getSeizureRecordWithDetails(db, seizureRecordId, {
      careHomeId,
      patientId,
    });
    if (!record) {
      return { error: "Seizure record not found" };
    }

    if (!recordedAt || !durationSeconds || durationSeconds <= 0) {
      return { error: "Date/time and a positive duration are required" };
    }

    if (!seizureType?.trim()) {
      return { error: "Seizure type is required" };
    }

    if (videoId && !(await assertOwnsVideoFile(videoId, auth.userId))) {
      return { error: "Invalid video" };
    }

    const previousVideoId = record.seizureRecord.videoId;

    await updateSeizureRecordById(
      db,
      seizureRecordId,
      {
        recordedAt,
        durationSeconds,
        ...(videoDurationSeconds != null ? { videoDurationSeconds } : {}),
        seizureType: seizureType.trim() || null,
        notes: notes?.trim() || null,
        ...(videoId ? { videoId } : {}),
      },
      { careHomeId, patientId },
    );

    if (videoId && previousVideoId && previousVideoId !== videoId) {
      await deleteVideoFile(previousVideoId);
    }

    revalidatePath(
      `/app/care-homes/${careHomeId}/patients/${patientId}/seizure-records/${seizureRecordId}`,
    );
    revalidatePath(`/app/care-homes/${careHomeId}/patients/${patientId}`);
    revalidatePath(`/app/care-homes/${careHomeId}`);

    return { success: true };
  } catch (error) {
    console.error("Failed to update seizure record:", error);
    return { error: "Failed to update seizure record" };
  }
}
