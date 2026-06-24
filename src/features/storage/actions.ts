"use server";

import { db } from "@/features/database";
import { createFile } from "@/features/database/queries";
import { createServiceClient } from "./server";
import { generateVideoPath, getVideoExtension, isVideoFile } from "./lib/utils";

const BUCKET_NAME = process.env.SUPABASE_STORAGE_BUCKET ?? "videos";
const MAX_FILE_SIZE_MB = 100;

interface UploadVideoResult {
  fileId?: string;
  error?: string;
}

export async function uploadVideoFile(
  formData: FormData,
): Promise<UploadVideoResult> {
  try {
    const file = formData.get("video") as File | null;

    if (!file || !isVideoFile(file)) {
      return { error: "A valid video file is required" };
    }

    if (file.size === 0) {
      return { error: "Video file is empty" };
    }

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      return { error: `Video must be under ${MAX_FILE_SIZE_MB} MB` };
    }

    const supabase = await createServiceClient();
    const path = generateVideoPath(file);

    const { data, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(path, file, {
        contentType: file.type || "video/mp4",
        upsert: false,
      });

    if (uploadError || !data?.path) {
      console.error("Storage upload failed:", uploadError);
      return { error: "Failed to upload video. Please try again." };
    }

    const dbFile = await createFile(db, {
      s3Key: data.path,
      mimeType: file.type || "video/mp4",
      sizeBytes: file.size,
    });

    return { fileId: dbFile.id };
  } catch (error) {
    console.error("Upload video action failed:", error);
    return { error: "Unexpected error uploading video" };
  }
}

export async function getSignedVideoUrl(s3Key: string, expiresInSeconds = 300) {
  const supabase = await createServiceClient();

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(s3Key, expiresInSeconds);

  if (error || !data?.signedUrl) {
    console.error("Failed to create signed URL:", error);
    return null;
  }

  return data.signedUrl;
}

export { getVideoExtension, isVideoFile };
