"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/features/database";
import {
  createCareHome,
  createOrganisation,
  deleteCareHomeById,
  getCareHomeById,
  updateCareHomeById,
} from "@/features/database/queries";
import {
  requireOrganisationAdmin,
  requireSystemAdmin,
} from "@/features/auth/guards";

/** System admin to create a standalone home, or an Org Admin to add one to their own org. */
async function requireCareHomeCreator(organisationId?: string) {
  if (organisationId) {
    return requireOrganisationAdmin(organisationId);
  }
  return requireSystemAdmin();
}

/** System admin, or an Org Admin of the home's own organisation (standalone homes stay system-admin-only). */
async function requireCareHomeOwner(careHomeId: string) {
  const careHome = await getCareHomeById(db, careHomeId);
  if (!careHome) {
    return { error: "Care home not found" };
  }
  if (careHome.organisationId) {
    return requireOrganisationAdmin(careHome.organisationId);
  }
  return requireSystemAdmin();
}

export async function createOrganisationAction(data: { name: string }) {
  try {
    const auth = await requireSystemAdmin();
    if (auth.error) {
      return { error: auth.error };
    }

    const trimmedName = data.name.trim();
    if (!trimmedName) {
      return { error: "Organisation name is required" };
    }

    const organisation = await createOrganisation(db, { name: trimmedName });

    revalidatePath("/app/admin/organisations");

    return { success: true, organisation };
  } catch (error) {
    console.error("Failed to create organisation:", error);
    return { error: "Failed to create organisation" };
  }
}

export async function createCareHomeAction(data: {
  name: string;
  organisationId?: string;
}) {
  try {
    const auth = await requireCareHomeCreator(data.organisationId);
    if (auth.error) {
      return { error: auth.error };
    }

    const trimmedName = data.name.trim();
    if (!trimmedName) {
      return { error: "Care home name is required" };
    }

    const careHome = await createCareHome(db, {
      name: trimmedName,
      ...(data.organisationId ? { organisationId: data.organisationId } : {}),
    });

    revalidatePath("/app/admin");
    revalidatePath("/app");
    if (data.organisationId) {
      revalidatePath(`/app/organisations/${data.organisationId}`);
    }

    return { success: true, careHome };
  } catch (error) {
    console.error("Failed to create care home:", error);
    return { error: "Failed to create care home" };
  }
}

export async function updateCareHomeAction(id: string, data: { name: string }) {
  try {
    const auth = await requireCareHomeOwner(id);
    if (auth.error) {
      return { error: auth.error };
    }

    const trimmedName = data.name.trim();
    if (!trimmedName) {
      return { error: "Care home name is required" };
    }

    const careHome = await updateCareHomeById(db, id, { name: trimmedName });

    revalidatePath("/app/admin");
    revalidatePath("/app");
    if (careHome?.organisationId) {
      revalidatePath(`/app/organisations/${careHome.organisationId}`);
    }

    return { success: true, careHome };
  } catch (error) {
    console.error("Failed to update care home:", error);
    return { error: "Failed to update care home" };
  }
}

export async function deleteCareHomeAction(id: string) {
  try {
    const auth = await requireCareHomeOwner(id);
    if (auth.error) {
      return { error: auth.error };
    }

    const careHome = await deleteCareHomeById(db, id);

    revalidatePath("/app/admin");
    revalidatePath("/app");
    if (careHome?.organisationId) {
      revalidatePath(`/app/organisations/${careHome.organisationId}`);
    }

    return { success: true, careHome };
  } catch (error) {
    console.error("Failed to delete care home:", error);
    return { error: "Failed to delete care home" };
  }
}
