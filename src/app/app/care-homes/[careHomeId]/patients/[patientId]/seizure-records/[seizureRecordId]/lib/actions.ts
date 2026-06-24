"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/features/database";
import {
  createSeizureRecordShare,
  getSeizureRecordWithDetails,
} from "@/features/database/queries";
import { generateToken, hashToken, sendShareLinkEmail } from "@/features/email";
import { formatDateTime, formatName } from "@/features/dashboard/lib/format";

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
