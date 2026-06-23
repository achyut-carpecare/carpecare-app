"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/features/database";
import {
  createSeizureRecordShare,
  getSeizureRecordById,
} from "@/features/database/queries";

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

    const record = await getSeizureRecordById(db, seizureRecordId);
    if (!record) {
      return { error: "Seizure record not found" };
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const share = await createSeizureRecordShare(db, {
      seizureRecordId,
      recipientEmail: trimmedEmail,
      expiresAt: expiresAt.toISOString(),
    });

    revalidatePath(
      `/app/care-homes/${record.patientId}/patients/${record.patientId}`,
    );

    return { success: true, share };
  } catch (error) {
    console.error("Failed to create share:", error);
    return { error: "Failed to create share link" };
  }
}
