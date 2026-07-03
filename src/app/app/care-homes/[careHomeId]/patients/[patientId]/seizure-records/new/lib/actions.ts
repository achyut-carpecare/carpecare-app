"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/features/database";
import { createSeizureRecord } from "@/features/database/queries";

export async function createSeizureRecordAction({
  patientId,
  recordedAt,
  durationSeconds,
  seizureType,
  notes,
  videoId,
}: {
  patientId: string;
  recordedAt: string;
  durationSeconds: number;
  seizureType?: string;
  notes?: string;
  videoId?: string;
}) {
  try {
    if (!recordedAt || !durationSeconds || durationSeconds <= 0) {
      return { error: "Date/time and a positive duration are required" };
    }

    if (!seizureType?.trim()) {
      return { error: "Seizure type is required" };
    }

    const record = await createSeizureRecord(db, {
      patientId,
      recordedAt,
      durationSeconds,
      seizureType: seizureType?.trim() || null,
      notes: notes?.trim() || null,
      videoId: videoId ?? null,
    });

    revalidatePath(`/app/care-homes`);

    return { success: true, record };
  } catch (error) {
    console.error("Failed to create seizure record:", error);
    return { error: "Failed to create seizure record" };
  }
}
