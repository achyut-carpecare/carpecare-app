"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/features/database";
import {
  createOrganisationMember,
  deleteOrganisationById,
  deleteOrganisationMemberById,
  getOrganisationMemberById,
  updateOrganisationById,
} from "@/features/database/queries";
import {
  requireOrganisationAdmin,
  requireSystemAdmin,
} from "@/features/auth/guards";

export async function renameOrganisationAction({
  organisationId,
  name,
}: {
  organisationId: string;
  name: string;
}) {
  try {
    const auth = await requireOrganisationAdmin(organisationId);
    if (auth.error) {
      return { error: auth.error };
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      return { error: "Organisation name is required" };
    }

    await updateOrganisationById(db, organisationId, { name: trimmedName });

    revalidatePath(`/app/organisations/${organisationId}`);
    revalidatePath("/app/admin/organisations");

    return { success: true };
  } catch (error) {
    console.error("Failed to rename organisation:", error);
    return { error: "Failed to rename organisation" };
  }
}

export async function addOrganisationMemberAction({
  organisationId,
  userId,
}: {
  organisationId: string;
  userId: string;
}) {
  try {
    const auth = await requireOrganisationAdmin(organisationId);
    if (auth.error) {
      return { error: auth.error };
    }

    await createOrganisationMember(db, { organisationId, userId });

    revalidatePath(`/app/organisations/${organisationId}`);

    return { success: true };
  } catch (error) {
    console.error("Failed to add organisation member:", error);
    return { error: "Failed to add senior manager" };
  }
}

export async function removeOrganisationMemberAction(
  organisationMemberId: string,
) {
  try {
    const member = await getOrganisationMemberById(db, organisationMemberId);
    if (!member) {
      return { error: "Member not found" };
    }

    const auth = await requireOrganisationAdmin(member.organisationId);
    if (auth.error) {
      return { error: auth.error };
    }

    await deleteOrganisationMemberById(db, organisationMemberId);

    revalidatePath(`/app/organisations/${member.organisationId}`);

    return { success: true };
  } catch (error) {
    console.error("Failed to remove organisation member:", error);
    return { error: "Failed to remove senior manager" };
  }
}

export async function deleteOrganisationAction(organisationId: string) {
  try {
    const auth = await requireSystemAdmin();
    if (auth.error) {
      return { error: auth.error };
    }

    await deleteOrganisationById(db, organisationId);

    revalidatePath("/app/admin/organisations");

    return { success: true };
  } catch (error) {
    console.error("Failed to delete organisation:", error);
    return { error: "Failed to delete organisation" };
  }
}
