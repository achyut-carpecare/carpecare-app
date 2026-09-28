"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/features/database";
import { createSeizureRecord } from "@/features/database/queries";
import { createClient } from "@/features/auth/server";

export async function createSeizureRecordAction({
  patientId,
  recordedAt,
  durationSeconds,
  videoDurationSeconds,
  seizureType,
  notes,
  videoId,
}: {
  patientId: string;
  recordedAt: string;
  durationSeconds: number;
  videoDurationSeconds?: number;
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

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "You must be signed in" };
    }

    const record = await createSeizureRecord(db, {
      patientId,
      recordedAt,
      durationSeconds,
      videoDurationSeconds: videoDurationSeconds ?? null,
      seizureType: seizureType?.trim() || null,
      notes: notes?.trim() || null,
      videoId: videoId ?? null,
      recordedBy: user.id,
    });

    revalidatePath(`/app/care-homes`);

    return { success: true, record };
  } catch (error) {
    console.error("Failed to create seizure record:", error);
    return { error: "Failed to create seizure record" };
  }
}
