"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/features/database";
import { createSeizureRecord } from "@/features/database/queries";
import { requirePatientMutationAccess } from "@/features/auth/guards";
import { assertOwnsVideoFile } from "@/features/storage/actions";

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

    const auth = await requirePatientMutationAccess(patientId);
    if (auth.error || !auth.userId) {
      return {
        error:
          auth.error ?? "You do not have permission to perform this action",
      };
    }

    if (videoId && !(await assertOwnsVideoFile(videoId, auth.userId))) {
      return { error: "Invalid video" };
    }

    const record = await createSeizureRecord(db, {
      patientId,
      recordedAt,
      durationSeconds,
      videoDurationSeconds: videoDurationSeconds ?? null,
      seizureType: seizureType?.trim() || null,
      notes: notes?.trim() || null,
      videoId: videoId ?? null,
      recordedBy: auth.userId,
    });

    revalidatePath(`/app/care-homes`);

    return { success: true, record };
  } catch (error) {
    console.error("Failed to create seizure record:", error);
    return { error: "Failed to create seizure record" };
  }
}
