"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/features/database";
import {
  createCareHome,
  deleteCareHomeById,
  updateCareHomeById,
} from "@/features/database/queries";

export async function createCareHomeAction(data: { name: string }) {
  try {
    const trimmedName = data.name.trim();
    if (!trimmedName) {
      return { error: "Care home name is required" };
    }

    const careHome = await createCareHome(db, {
      name: trimmedName,
    });

    revalidatePath("/app/admin");
    revalidatePath("/app");

    return { success: true, careHome };
  } catch (error) {
    console.error("Failed to create care home:", error);
    return { error: "Failed to create care home" };
  }
}

export async function updateCareHomeAction(id: string, data: { name: string }) {
  try {
    const trimmedName = data.name.trim();
    if (!trimmedName) {
      return { error: "Care home name is required" };
    }

    const careHome = await updateCareHomeById(db, id, { name: trimmedName });

    revalidatePath("/app/admin");
    revalidatePath("/app");

    return { success: true, careHome };
  } catch (error) {
    console.error("Failed to update care home:", error);
    return { error: "Failed to update care home" };
  }
}

export async function deleteCareHomeAction(id: string) {
  try {
    const careHome = await deleteCareHomeById(db, id);

    revalidatePath("/app/admin");
    revalidatePath("/app");

    return { success: true, careHome };
  } catch (error) {
    console.error("Failed to delete care home:", error);
    return { error: "Failed to delete care home" };
  }
}
