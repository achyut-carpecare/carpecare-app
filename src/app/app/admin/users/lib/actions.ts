"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/features/database";
import { schema } from "@/features/database";
import { createClient } from "@/features/auth/server";
import { createAdminClient } from "@/features/auth/admin";
import {
  getCareHomeMemberByUserIdAndCareHomeId,
  getUserProfileById,
  getUserWithMemberships,
  updateUserSystemAdminById,
  createPlatformInvitation,
  getPendingPlatformInvitationByEmail,
  replaceMfaRecoveryCodes,
} from "@/features/database/queries";
import { sendPlatformInviteEmail } from "@/features/email";
import { generateToken, hashToken } from "@/features/email";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function formatName(first?: string | null, last?: string | null) {
  return [first, last].filter(Boolean).join(" ") || "Someone";
}

type AdminAuthResult =
  | { error: string; userId: null; profile: null }
  | {
      error: null;
      userId: string;
      profile: {
        isSystemAdmin: boolean;
        firstName: string | null;
        lastName: string | null;
      };
    };

async function requireSystemAdmin(): Promise<AdminAuthResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in", userId: null, profile: null };
  }

  const result = await getUserWithMemberships(db, user.id);
  if (!result || !result.profile.isSystemAdmin) {
    return {
      error: "You must be a system admin",
      userId: null,
      profile: null,
    };
  }

  return {
    error: null,
    userId: user.id,
    profile: {
      isSystemAdmin: result.profile.isSystemAdmin,
      firstName: result.profile.firstName,
      lastName: result.profile.lastName,
    },
  };
}

function randomPassword(): string {
  return `${generateToken(32)}${generateToken(32)}`;
}

export async function inviteUserAction({ email }: { email: string }) {
  try {
    const auth = await requireSystemAdmin();
    if (auth.error || !auth.profile) {
      return { error: auth.error ?? "You must be a system admin" };
    }

    const inviterProfile = auth.profile;

    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      return { error: "A valid email address is required" };
    }

    const existingPending = await getPendingPlatformInvitationByEmail(
      db,
      normalizedEmail,
    );
    if (existingPending) {
      return {
        error: "An invitation is already pending for this email address",
      };
    }

    const adminClient = await createAdminClient();

    const { data: existingUsers, error: listError } =
      await adminClient.auth.admin.listUsers();
    if (listError) {
      console.error("Failed to list auth users:", listError);
      return { error: "Failed to verify email address" };
    }

    const emailTaken = existingUsers.users.some(
      (u) => u.email?.toLowerCase() === normalizedEmail,
    );
    if (emailTaken) {
      return { error: "An account already exists for this email address" };
    }

    const linkToken = generateToken();
    const linkTokenHash = hashToken(linkToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invitation = await createPlatformInvitation(db, {
      invitedEmail: normalizedEmail,
      invitedBy: auth.userId,
      status: "pending",
      linkTokenHash,
      expiresAt: expiresAt.toISOString(),
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const registerUrl = `${appUrl}/auth/register-admin?invite=${invitation.id}&token=${linkToken}`;

    await sendPlatformInviteEmail({
      to: normalizedEmail,
      inviterName: formatName(
        inviterProfile.firstName,
        inviterProfile.lastName,
      ),
      registerUrl,
    });

    revalidatePath("/app/admin/users");

    return { success: true };
  } catch (error) {
    console.error("Failed to invite user:", error);
    return { error: "Failed to invite user" };
  }
}

export async function toggleSystemAdminAction({
  userId,
  isSystemAdmin,
}: {
  userId: string;
  isSystemAdmin: boolean;
}) {
  try {
    const auth = await requireSystemAdmin();
    if (auth.error) {
      return { error: auth.error };
    }

    if (userId === auth.userId && !isSystemAdmin) {
      return { error: "You cannot remove your own system admin access" };
    }

    const profile = await getUserProfileById(db, userId);
    if (!profile) {
      return { error: "User not found" };
    }

    await updateUserSystemAdminById(db, userId, isSystemAdmin);

    revalidatePath("/app/admin/users");

    return { success: true };
  } catch (error) {
    console.error("Failed to update admin status:", error);
    return { error: "Failed to update admin status" };
  }
}

export async function deleteUserAction(userId: string) {
  try {
    const auth = await requireSystemAdmin();
    if (auth.error) {
      return { error: auth.error };
    }

    if (userId === auth.userId) {
      return { error: "You cannot delete your own account" };
    }

    const adminClient = await createAdminClient();
    const { error: deleteError } =
      await adminClient.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error("Failed to delete auth user:", deleteError);
      return { error: "Failed to delete user" };
    }

    await db.transaction(async (tx) => {
      await tx
        .update(schema.seizureRecords)
        .set({ recordedBy: null, updatedAt: new Date().toISOString() })
        .where(eq(schema.seizureRecords.recordedBy, userId));

      await tx
        .update(schema.seizureRecordShares)
        .set({ sharedBy: null, updatedAt: new Date().toISOString() })
        .where(eq(schema.seizureRecordShares.sharedBy, userId));

      await tx
        .delete(schema.userProfiles)
        .where(eq(schema.userProfiles.id, userId));
    });

    revalidatePath("/app/admin/users");

    return { success: true };
  } catch (error) {
    console.error("Failed to delete user:", error);
    return { error: "Failed to delete user" };
  }
}

export async function resetUserMfaAction(userId: string) {
  try {
    const auth = await requireSystemAdmin();
    if (auth.error) {
      return { error: auth.error };
    }

    const profile = await getUserProfileById(db, userId);
    if (!profile) {
      return { error: "User not found" };
    }

    const adminClient = await createAdminClient();
    const { data: factorsData, error: factorsError } =
      await adminClient.auth.admin.mfa.listFactors({ userId });

    if (factorsError) {
      console.error("Failed to list MFA factors:", factorsError);
      return { error: "Failed to reset MFA" };
    }

    for (const factor of factorsData?.factors ?? []) {
      await adminClient.auth.admin.mfa.deleteFactor({
        id: factor.id,
        userId,
      });
    }

    await replaceMfaRecoveryCodes(db, userId, []);

    revalidatePath("/app/admin/users");

    return { success: true };
  } catch (error) {
    console.error("Failed to reset user MFA:", error);
    return { error: "Failed to reset MFA" };
  }
}

export async function joinCareHomeAction({
  careHomeId,
  role = "admin",
}: {
  careHomeId: string;
  role?: "admin" | "member";
}) {
  try {
    const auth = await requireSystemAdmin();
    if (auth.error || !auth.userId) {
      return { error: auth.error ?? "You must be a system admin" };
    }

    const currentUserId = auth.userId;

    const existing = await getCareHomeMemberByUserIdAndCareHomeId(
      db,
      currentUserId,
      careHomeId,
    );
    if (existing) {
      return { error: "You are already a member of this care home" };
    }

    await db.insert(schema.careHomeMembers).values({
      userId: currentUserId,
      careHomeId,
      role,
    });

    revalidatePath(`/app/care-homes/${careHomeId}/members`);
    revalidatePath(`/app/care-homes/${careHomeId}`);

    return { success: true };
  } catch (error) {
    console.error("Failed to join care home:", error);
    return { error: "Failed to join care home" };
  }
}
