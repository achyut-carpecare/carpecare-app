"use server";

import { db } from "@/features/database";
import { getUserWithMemberships } from "@/features/database/queries";
import { createClient } from "./server";

type UserWithMemberships = NonNullable<
  Awaited<ReturnType<typeof getUserWithMemberships>>
>;

export interface GuardOk {
  error?: undefined;
  userId: string;
  profile: UserWithMemberships["profile"];
  memberships: UserWithMemberships["memberships"];
}

export interface GuardErr {
  error: string;
  userId?: undefined;
  profile?: undefined;
  memberships?: undefined;
}

export type GuardResult = GuardOk | GuardErr;

export async function requireAuthenticatedUser(): Promise<GuardResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in" };
  }

  const result = await getUserWithMemberships(db, user.id);
  if (!result) {
    return { error: "You must be signed in" };
  }

  return {
    userId: user.id,
    profile: result.profile,
    memberships: result.memberships,
  };
}

/** Any role (admin or member) within the given care home, or a system admin. */
export async function requireCareHomeMember(
  careHomeId: string,
): Promise<GuardResult> {
  const auth = await requireAuthenticatedUser();
  if (auth.error || !auth.profile) return auth;

  const membership = auth.memberships.find((m) => m.careHome.id === careHomeId);
  if (!auth.profile.isSystemAdmin && !membership) {
    return { error: "You do not have permission to perform this action" };
  }

  return auth;
}

/** Admin role within the given care home, or a system admin. */
export async function requireCareHomeAdmin(
  careHomeId: string,
): Promise<GuardResult> {
  const auth = await requireAuthenticatedUser();
  if (auth.error || !auth.profile) return auth;

  const membership = auth.memberships.find((m) => m.careHome.id === careHomeId);
  if (!auth.profile.isSystemAdmin && membership?.role !== "admin") {
    return { error: "You do not have permission to perform this action" };
  }

  return auth;
}

/**
 * Platform-level system admin. Also requires an aal2 (MFA-verified) session
 * - these are the most sensitive actions in the app (delete user, reset
 * another user's MFA, grant admin, delete a care home), and unlike page
 * navigation, Server Actions aren't gated by the proxy's pathname matcher, so
 * that check has to be repeated here.
 */
export async function requireSystemAdmin(): Promise<GuardResult> {
  const auth = await requireAuthenticatedUser();
  if (auth.error || !auth.profile) return auth;

  if (!auth.profile.isSystemAdmin) {
    return { error: "You must be a system admin" };
  }

  const supabase = await createClient();
  const { data: aal } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (!aal || aal.currentLevel !== "aal2") {
    return { error: "MFA verification is required for this action" };
  }

  return auth;
}
