"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/features/database";
import { createSeizureRecord } from "@/features/database/queries";

export async function createSeizureRecordAction({
  patientId,
  recordedAt,
  durationSeconds,
  seizureType,
  notes,
}: {
  patientId: string;
  recordedAt: string;
  durationSeconds: number;
  seizureType?: string;
  notes?: string;
}) {
  try {
    if (!recordedAt || !durationSeconds || durationSeconds <= 0) {
      return { error: "Date/time and a positive duration are required" };
    }

    const record = await createSeizureRecord(db, {
      patientId,
      recordedAt,
      durationSeconds,
      seizureType: seizureType?.trim() || null,
      notes: notes?.trim() || null,
    });

    revalidatePath(`/app/care-homes`);

    return { success: true, record };
  } catch (error) {
    console.error("Failed to create seizure record:", error);
    return { error: "Failed to create seizure record" };
  }
}
