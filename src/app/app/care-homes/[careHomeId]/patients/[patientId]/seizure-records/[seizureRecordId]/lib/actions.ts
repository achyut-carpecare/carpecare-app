"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/features/database";
import {
  createSeizureRecordShare,
  deleteSeizureRecordById,
  getSeizureRecordWithDetails,
  getUserWithMemberships,
  updateSeizureRecordById,
} from "@/features/database/queries";
import { generateToken, hashToken, sendShareLinkEmail } from "@/features/email";
import { formatDateTime, formatName } from "@/features/dashboard/lib/format";
import { createClient } from "@/features/auth/server";

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
    if (!trimmedEmail) {
      return { error: "Recipient email is required" };
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
      return { error: "Seizure record is missing patient or care home data" };
    }

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

    const emailResult = await sendShareLinkEmail({
      to: trimmedEmail,
      careHomeName: careHome.name ?? "Carpe Care",
      patientName: formatName(patient.firstName, patient.lastName),
      shareUrl,
      expiresAt: formatDateTime(share.expiresAt),
    });

    console.log(
      "createSeizureRecordShareAction: email accepted by",
      emailResult.envelope?.from ?? "unknown",
      "for",
      trimmedEmail,
      "messageId:",
      emailResult.messageId,
    );

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
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "You must be signed in" };
    }

    const result = await getUserWithMemberships(db, user.id);
    if (!result) {
      return { error: "You must be signed in" };
    }

    const { profile, memberships } = result;
    const membership = memberships.find((m) => m.careHome.id === careHomeId);

    if (!profile.isSystemAdmin && membership?.role !== "admin") {
      return { error: "You do not have permission to delete this record" };
    }

    const deleted = await deleteSeizureRecordById(db, seizureRecordId, {
      careHomeId,
      patientId,
    });

    if (!deleted) {
      return { error: "Seizure record not found" };
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
  seizureType,
  notes,
}: {
  careHomeId: string;
  patientId: string;
  seizureRecordId: string;
  recordedAt: string;
  durationSeconds: number;
  seizureType?: string;
  notes?: string;
}) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "You must be signed in" };
    }

    const result = await getUserWithMemberships(db, user.id);
    if (!result) {
      return { error: "You must be signed in" };
    }

    const { profile, memberships } = result;
    const membership = memberships.find((m) => m.careHome.id === careHomeId);

    if (!profile.isSystemAdmin && membership?.role !== "admin") {
      return { error: "You do not have permission to edit this record" };
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

    await updateSeizureRecordById(
      db,
      seizureRecordId,
      {
        recordedAt,
        durationSeconds,
        seizureType: seizureType.trim() || null,
        notes: notes?.trim() || null,
      },
      { careHomeId, patientId },
    );

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
