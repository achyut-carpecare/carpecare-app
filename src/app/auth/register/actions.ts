"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/features/database";
import { schema } from "@/features/database";
import { createClient } from "@/features/auth/server";
import { createAdminClient } from "@/features/auth/admin";
import {
  getCareHomeById,
  getCareHomeInvitationById,
} from "@/features/database/queries";
import { compareTokenHash } from "@/features/email";

interface RegisterWithInvitationInput {
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
  const invitation = await getCareHomeInvitationById(db, invitationId);
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

export async function registerWithInvitationAction(
  input: RegisterWithInvitationInput,
) {
  let careHomeId: string;

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

    const careHome = await getCareHomeById(db, invitation.careHomeId);
    if (!careHome) {
      return { error: "Care home not found" };
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
            "An account already exists for this email address. Please sign in to accept the invitation.",
        };
      }
      console.error("Failed to create invited user:", createError);
      return { error: "Failed to create account" };
    }

    if (!userData.user) {
      return { error: "Failed to create account" };
    }

    const userId = userData.user.id;
    careHomeId = invitation.careHomeId;

    await db.transaction(async (tx) => {
      await tx
        .insert(schema.userProfiles)
        .values({
          id: userId,
          firstName,
          lastName,
          role: "care_home_user",
        })
        .onConflictDoUpdate({
          target: schema.userProfiles.id,
          set: {
            firstName,
            lastName,
            updatedAt: new Date().toISOString(),
          },
        });

      const existingMembership = await tx
        .select()
        .from(schema.careHomeMembers)
        .where(
          and(
            eq(schema.careHomeMembers.userId, userId),
            eq(schema.careHomeMembers.careHomeId, invitation.careHomeId),
          ),
        );

      if (existingMembership.length === 0) {
        await tx.insert(schema.careHomeMembers).values({
          userId,
          careHomeId: invitation.careHomeId,
          role: invitation.role,
        });
      }

      await tx
        .update(schema.careHomeInvitations)
        .set({
          status: "accepted",
          acceptedAt: new Date().toISOString(),
          acceptedBy: userId,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(schema.careHomeInvitations.id, invitationId));
    });

    const supabase = await createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: invitation.invitedEmail,
      password,
    });

    if (signInError) {
      console.error("Failed to sign in newly created user:", signInError);
      return {
        error: "Account created but sign in failed. Please sign in manually.",
      };
    }
  } catch (error) {
    console.error("registerWithInvitationAction failed:", error);
    return { error: "Something went wrong. Please try again." };
  }

  revalidatePath(`/app/care-homes/${careHomeId}/members`);
  revalidatePath("/app", "layout");

  return redirect(`/app/care-homes/${careHomeId}`);
}
