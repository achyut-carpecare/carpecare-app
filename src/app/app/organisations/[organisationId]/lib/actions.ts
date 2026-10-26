"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/features/database";
import { schema } from "@/features/database";
import { getAuthUserEmailsByIds } from "@/features/auth/admin";
import {
  createOrganisationMember,
  deleteOrganisationById,
  deleteOrganisationInvitationById,
  deleteOrganisationMemberById,
  getCareHomeAdminsForOrganisation,
  getCareHomeById,
  getOrganisationById,
  getOrganisationInvitationById,
  getOrganisationMemberById,
  getOrganisationMembers,
  getPendingOrganisationInvitationByEmail,
  updateCareHomeById,
  updateOrganisationById,
} from "@/features/database/queries";
import {
  requireOrganisationAdmin,
  requireSystemAdmin,
} from "@/features/auth/guards";
import {
  generateToken,
  hashToken,
  sendOrganisationInviteEmail,
} from "@/features/email";

const INVITATION_EXPIRY_DAYS = 7;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function formatName(first?: string | null, last?: string | null) {
  return [first, last].filter(Boolean).join(" ") || "Someone";
}

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

    // Re-derive the legitimate candidate pool server-side rather than
    // trusting the client-submitted userId - the dropdown only displays
    // this restriction, it doesn't enforce it.
    const candidates = await getCareHomeAdminsForOrganisation(
      db,
      organisationId,
    );
    if (!candidates.some((candidate) => candidate.id === userId)) {
      return {
        error:
          "This person must already be an Admin at one of this organisation's establishments",
      };
    }

    await createOrganisationMember(db, { organisationId, userId });

    revalidatePath(`/app/organisations/${organisationId}`);

    return { success: true };
  } catch (error) {
    console.error("Failed to add organisation member:", error);
    return { error: "Failed to add Organisation Admin" };
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
    return { error: "Failed to remove Organisation Admin" };
  }
}

export async function attachCareHomeToOrganisationAction({
  careHomeId,
  organisationId,
}: {
  careHomeId: string;
  organisationId: string;
}) {
  try {
    // Cross-tenant structural move - gated to System Admin rather than Org
    // Admin alone, so an org can't unilaterally absorb an unrelated
    // establishment it doesn't already have any relationship with.
    const auth = await requireSystemAdmin();
    if (auth.error) {
      return { error: auth.error };
    }

    const careHome = await getCareHomeById(db, careHomeId);
    if (!careHome) {
      return { error: "Establishment not found" };
    }
    if (careHome.organisationId) {
      return {
        error: "This establishment already belongs to an organisation",
      };
    }

    await updateCareHomeById(db, careHomeId, { organisationId });

    revalidatePath(`/app/organisations/${organisationId}`);
    revalidatePath("/app/admin");
    revalidatePath("/app/admin/organisations");

    return { success: true };
  } catch (error) {
    console.error("Failed to attach establishment to organisation:", error);
    return { error: "Failed to attach establishment" };
  }
}

export async function detachCareHomeFromOrganisationAction(careHomeId: string) {
  try {
    const auth = await requireSystemAdmin();
    if (auth.error) {
      return { error: auth.error };
    }

    const careHome = await getCareHomeById(db, careHomeId);
    if (!careHome) {
      return { error: "Establishment not found" };
    }

    const organisationId = careHome.organisationId;

    await updateCareHomeById(db, careHomeId, { organisationId: null });

    if (organisationId) {
      revalidatePath(`/app/organisations/${organisationId}`);
    }
    revalidatePath("/app/admin");
    revalidatePath("/app/admin/organisations");

    return { success: true };
  } catch (error) {
    console.error("Failed to detach establishment from organisation:", error);
    return { error: "Failed to detach establishment" };
  }
}

export async function inviteOrganisationAdminAction({
  organisationId,
  email,
}: {
  organisationId: string;
  email: string;
}) {
  try {
    const auth = await requireOrganisationAdmin(organisationId);
    if (auth.error) {
      return { error: auth.error };
    }

    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      return { error: "A valid email address is required" };
    }

    const organisation = await getOrganisationById(db, organisationId);
    if (!organisation) {
      return { error: "Organisation not found" };
    }

    const members = await getOrganisationMembers(db, organisationId);
    const memberEmails = await getAuthUserEmailsByIds(
      members.map((m) => m.userId),
    );
    const isAlreadyMember = Array.from(memberEmails.values()).some(
      (email) => email?.toLowerCase() === normalizedEmail,
    );
    if (isAlreadyMember) {
      return {
        error: "This email address is already an Organisation Admin here",
      };
    }

    const existingPending = await getPendingOrganisationInvitationByEmail(
      db,
      organisationId,
      normalizedEmail,
    );
    if (existingPending) {
      return {
        error: "An invitation is already pending for this email address",
      };
    }

    const linkToken = generateToken();
    const linkTokenHash = hashToken(linkToken);
    const expiresAt = new Date(
      Date.now() + INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    );

    const invitation = await db
      .insert(schema.organisationInvitations)
      .values({
        organisationId,
        invitedEmail: normalizedEmail,
        invitedBy: auth.userId,
        status: "pending",
        linkTokenHash,
        expiresAt: expiresAt.toISOString(),
      })
      .returning()
      .then((rows) => rows[0]);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const inviteUrl = `${appUrl}/invite/${invitation.id}?token=${linkToken}`;

    try {
      await sendOrganisationInviteEmail({
        to: normalizedEmail,
        organisationName: organisation.name ?? "Carpe Care",
        inviterName: formatName(
          auth.profile!.firstName,
          auth.profile!.lastName,
        ),
        inviteUrl,
        expiresAt: expiresAt.toLocaleDateString(),
      });
    } catch (emailError) {
      // The email never went out, so don't leave a "pending" row behind -
      // it would permanently block retrying (unique-pending-email index)
      // with no invite ever delivered.
      console.error(
        "Failed to send organisation invitation email:",
        emailError,
      );
      await deleteOrganisationInvitationById(db, invitation.id);
      return { error: "Failed to send invitation email. Please try again." };
    }

    revalidatePath(`/app/organisations/${organisationId}`);

    return { success: true, invitation };
  } catch (error) {
    console.error("Failed to invite organisation admin:", error);
    return { error: "Failed to send invitation" };
  }
}

export async function resendOrganisationInvitationAction(invitationId: string) {
  try {
    const invitation = await getOrganisationInvitationById(db, invitationId);
    if (!invitation) {
      return { error: "Invitation not found" };
    }

    if (invitation.status !== "pending") {
      return { error: "This invitation is no longer pending" };
    }

    const auth = await requireOrganisationAdmin(invitation.organisationId);
    if (auth.error) {
      return { error: auth.error };
    }

    const organisation = await getOrganisationById(
      db,
      invitation.organisationId,
    );
    if (!organisation) {
      return { error: "Organisation not found" };
    }

    const linkToken = generateToken();
    const linkTokenHash = hashToken(linkToken);
    const expiresAt = new Date(
      Date.now() + INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    );

    await db
      .update(schema.organisationInvitations)
      .set({
        linkTokenHash,
        expiresAt: expiresAt.toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.organisationInvitations.id, invitationId));

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const inviteUrl = `${appUrl}/invite/${invitationId}?token=${linkToken}`;

    await sendOrganisationInviteEmail({
      to: invitation.invitedEmail,
      organisationName: organisation.name ?? "Carpe Care",
      inviterName: formatName(auth.profile!.firstName, auth.profile!.lastName),
      inviteUrl,
      expiresAt: expiresAt.toLocaleDateString(),
    });

    revalidatePath(`/app/organisations/${invitation.organisationId}`);

    return { success: true };
  } catch (error) {
    console.error("Failed to resend organisation invitation:", error);
    return { error: "Failed to resend invitation" };
  }
}

export async function revokeOrganisationInvitationAction(invitationId: string) {
  try {
    const invitation = await getOrganisationInvitationById(db, invitationId);
    if (!invitation) {
      return { error: "Invitation not found" };
    }

    const auth = await requireOrganisationAdmin(invitation.organisationId);
    if (auth.error) {
      return { error: auth.error };
    }

    await db
      .update(schema.organisationInvitations)
      .set({
        status: "revoked",
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.organisationInvitations.id, invitationId));

    revalidatePath(`/app/organisations/${invitation.organisationId}`);

    return { success: true };
  } catch (error) {
    console.error("Failed to revoke organisation invitation:", error);
    return { error: "Failed to revoke invitation" };
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
