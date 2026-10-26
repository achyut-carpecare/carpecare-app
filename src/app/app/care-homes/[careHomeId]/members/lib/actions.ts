"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/features/database";
import { schema } from "@/features/database";
import { getAuthUserEmailsByIds } from "@/features/auth/admin";
import {
  requireCareHomeAccountManager,
  requireCareHomeAdmin,
} from "@/features/auth/guards";
import {
  getCareHomeById,
  getCareHomeInvitationById,
  getCareHomeMemberById,
  getCareHomeMembers,
  getPendingCareHomeInvitationByEmail,
  getUserProfileById,
} from "@/features/database/queries";
import {
  generateToken,
  hashToken,
  sendInvitationEmail,
} from "@/features/email";

const INVITATION_EXPIRY_DAYS = 7;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function formatName(first?: string | null, last?: string | null) {
  return [first, last].filter(Boolean).join(" ") || "Someone";
}

export async function inviteMemberAction({
  careHomeId,
  email,
  role,
}: {
  careHomeId: string;
  email: string;
  role: "admin" | "member";
}) {
  try {
    const auth = await requireCareHomeAccountManager(careHomeId);
    if (auth.error) {
      return { error: auth.error };
    }

    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      return { error: "A valid email address is required" };
    }

    const careHome = await getCareHomeById(db, careHomeId);
    if (!careHome) {
      return { error: "Care home not found" };
    }

    const members = await getCareHomeMembers(db, careHomeId);
    const memberEmails = await getAuthUserEmailsByIds(
      members.map((m) => m.userId),
    );
    const isAlreadyMember = Array.from(memberEmails.values()).some(
      (email) => email?.toLowerCase() === normalizedEmail,
    );
    if (isAlreadyMember) {
      return {
        error: "This email address is already a member of this care home",
      };
    }

    const existingPending = await getPendingCareHomeInvitationByEmail(
      db,
      careHomeId,
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
      .insert(schema.careHomeInvitations)
      .values({
        careHomeId,
        invitedEmail: normalizedEmail,
        role,
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
      await sendInvitationEmail({
        to: normalizedEmail,
        careHomeName: careHome.name ?? "Carpe Care",
        inviterName: formatName(
          auth.profile!.firstName,
          auth.profile!.lastName,
        ),
        role,
        inviteUrl,
        expiresAt: expiresAt.toLocaleDateString(),
      });
    } catch (emailError) {
      // The email never went out, so don't leave a "pending" row behind -
      // it would permanently block retrying (unique-pending-email index)
      // with no invite ever delivered.
      console.error("Failed to send invitation email:", emailError);
      await db
        .delete(schema.careHomeInvitations)
        .where(eq(schema.careHomeInvitations.id, invitation.id));
      return { error: "Failed to send invitation email. Please try again." };
    }

    revalidatePath(`/app/care-homes/${careHomeId}/members`);

    return { success: true, invitation };
  } catch (error) {
    console.error("Failed to invite member:", error);
    return { error: "Failed to send invitation" };
  }
}

export async function resendInvitationAction(invitationId: string) {
  try {
    const invitation = await getCareHomeInvitationById(db, invitationId);
    if (!invitation) {
      return { error: "Invitation not found" };
    }

    if (invitation.status !== "pending") {
      return { error: "This invitation is no longer pending" };
    }

    const auth = await requireCareHomeAccountManager(invitation.careHomeId);
    if (auth.error) {
      return { error: auth.error };
    }

    const careHome = await getCareHomeById(db, invitation.careHomeId);
    if (!careHome) {
      return { error: "Care home not found" };
    }

    const linkToken = generateToken();
    const linkTokenHash = hashToken(linkToken);
    const expiresAt = new Date(
      Date.now() + INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    );

    await db
      .update(schema.careHomeInvitations)
      .set({
        linkTokenHash,
        expiresAt: expiresAt.toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.careHomeInvitations.id, invitationId));

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const inviteUrl = `${appUrl}/invite/${invitationId}?token=${linkToken}`;

    await sendInvitationEmail({
      to: invitation.invitedEmail,
      careHomeName: careHome.name ?? "Carpe Care",
      inviterName: formatName(auth.profile!.firstName, auth.profile!.lastName),
      role: invitation.role,
      inviteUrl,
      expiresAt: expiresAt.toLocaleDateString(),
    });

    revalidatePath(`/app/care-homes/${invitation.careHomeId}/members`);

    return { success: true };
  } catch (error) {
    console.error("Failed to resend invitation:", error);
    return { error: "Failed to resend invitation" };
  }
}

export async function revokeInvitationAction(invitationId: string) {
  try {
    const invitation = await getCareHomeInvitationById(db, invitationId);
    if (!invitation) {
      return { error: "Invitation not found" };
    }

    const auth = await requireCareHomeAccountManager(invitation.careHomeId);
    if (auth.error) {
      return { error: auth.error };
    }

    await db
      .update(schema.careHomeInvitations)
      .set({
        status: "revoked",
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.careHomeInvitations.id, invitationId));

    revalidatePath(`/app/care-homes/${invitation.careHomeId}/members`);

    return { success: true };
  } catch (error) {
    console.error("Failed to revoke invitation:", error);
    return { error: "Failed to revoke invitation" };
  }
}

export async function updateMemberRoleAction({
  memberId,
  role,
}: {
  memberId: string;
  role: "admin" | "member";
}) {
  try {
    const member = await getCareHomeMemberById(db, memberId);
    if (!member) {
      return { error: "Member not found" };
    }

    const auth = await requireCareHomeAdmin(member.careHomeId);
    if (auth.error) {
      return { error: auth.error };
    }

    if (!auth.profile) {
      return { error: "Unable to verify your permissions" };
    }

    const targetProfile = await getUserProfileById(db, member.userId);
    if (targetProfile?.isSystemAdmin && !auth.profile.isSystemAdmin) {
      return { error: "You cannot change the role of a system administrator" };
    }

    await db
      .update(schema.careHomeMembers)
      .set({
        role,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.careHomeMembers.id, memberId));

    revalidatePath(`/app/care-homes/${member.careHomeId}/members`);

    return { success: true };
  } catch (error) {
    console.error("Failed to update member role:", error);
    return { error: "Failed to update member role" };
  }
}

export async function removeMemberAction(memberId: string) {
  try {
    const member = await getCareHomeMemberById(db, memberId);
    if (!member) {
      return { error: "Member not found" };
    }

    const auth = await requireCareHomeAccountManager(member.careHomeId);
    if (auth.error) {
      return { error: auth.error };
    }

    const targetProfile = await getUserProfileById(db, member.userId);
    if (targetProfile?.isSystemAdmin && !auth.profile?.isSystemAdmin) {
      return { error: "You cannot remove a system administrator" };
    }

    await db
      .delete(schema.careHomeMembers)
      .where(eq(schema.careHomeMembers.id, memberId));

    revalidatePath(`/app/care-homes/${member.careHomeId}/members`);

    return { success: true };
  } catch (error) {
    console.error("Failed to remove member:", error);
    return { error: "Failed to remove member" };
  }
}
