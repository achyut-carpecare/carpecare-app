"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/features/database";
import { schema } from "@/features/database";
import { createClient } from "@/features/auth/server";
import { createAdminClient } from "@/features/auth/admin";
import {
  getPlatformInvitationById,
  acceptPlatformInvitationById,
} from "@/features/database/queries";
import { compareTokenHash } from "@/features/email";

interface RegisterWithPlatformInvitationInput {
  invitationId: string;
  linkToken: string;
  firstName: string;
  lastName: string;
  password: string;
}

const MIN_PASSWORD_LENGTH = 8;

function validateRegistrationInput(input: {
  firstName: string;
  lastName: string;
  password: string;
}): { error: string } | null {
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const password = input.password;

  if (!firstName) {
    return { error: "First name is required" };
  }

  if (!lastName) {
    return { error: "Last name is required" };
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
    };
  }

  return null;
}

async function validateInvitation(invitationId: string, linkToken: string) {
  const invitation = await getPlatformInvitationById(db, invitationId);
  if (!invitation) {
    return { error: "Invitation not found", invitation: null };
  }

  if (invitation.status !== "pending") {
    return { error: "This invitation is no longer valid", invitation: null };
  }

  if (invitation.expiresAt && new Date(invitation.expiresAt) < new Date()) {
    return { error: "This invitation has expired", invitation: null };
  }

  if (
    !invitation.linkTokenHash ||
    !compareTokenHash(linkToken, invitation.linkTokenHash)
  ) {
    return { error: "Invalid invitation link", invitation: null };
  }

  return { error: null, invitation };
}

export async function registerWithPlatformInvitationAction(
  input: RegisterWithPlatformInvitationInput,
) {
  try {
    const { invitationId, linkToken, firstName, lastName, password } = input;

    const inputError = validateRegistrationInput({
      firstName,
      lastName,
      password,
    });
    if (inputError) {
      return inputError;
    }

    const { error: validationError, invitation } = await validateInvitation(
      invitationId,
      linkToken,
    );
    if (validationError || !invitation) {
      return { error: validationError ?? "Invalid invitation" };
    }

    const adminClient = await createAdminClient();
    const { data: userData, error: createError } =
      await adminClient.auth.admin.createUser({
        email: invitation.invitedEmail,
        password,
        email_confirm: true,
        user_metadata: {
          first_name: firstName,
          last_name: lastName,
        },
      });

    if (createError) {
      if (
        createError.status === 422 ||
        createError.code === "user_already_exists" ||
        createError.message.toLowerCase().includes("already")
      ) {
        return {
          existingAccount: true,
          error:
            "An account already exists for this email address. Please sign in.",
        };
      }
      console.error("Failed to create invited admin user:", createError);
      return { error: "Failed to create account" };
    }

    if (!userData.user) {
      return { error: "Failed to create account" };
    }

    const userId = userData.user.id;

    await db.transaction(async (tx) => {
      // System admin access is never granted automatically on registration -
      // an existing admin must explicitly grant it afterward from the
      // Platform users page.
      await tx
        .insert(schema.userProfiles)
        .values({
          id: userId,
          firstName,
          lastName,
          isSystemAdmin: false,
        })
        .onConflictDoUpdate({
          target: schema.userProfiles.id,
          set: {
            firstName,
            lastName,
            updatedAt: new Date().toISOString(),
          },
        });

      await acceptPlatformInvitationById(tx, invitationId, linkToken, userId);
    });

    const supabase = await createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: invitation.invitedEmail,
      password,
    });

    if (signInError) {
      console.error("Failed to sign in newly created admin user:", signInError);
      return {
        error: "Account created but sign in failed. Please sign in manually.",
      };
    }
  } catch (error) {
    console.error("registerWithPlatformInvitationAction failed:", error);
    return { error: "Something went wrong. Please try again." };
  }

  revalidatePath("/app/admin/users");
  revalidatePath("/app", "layout");

  return redirect("/app");
}
