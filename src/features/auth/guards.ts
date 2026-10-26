"use server";

import { db } from "@/features/database";
import {
  getCareHomeById,
  getOrganisationMemberByUserIdAndOrganisationId,
  getPatientAccessGrant,
  getPatientById,
  getUserWithMemberships,
} from "@/features/database/queries";
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

const PERMISSION_ERROR = "You do not have permission to perform this action";

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

/**
 * True if the user holds an admin grant on the care home's parent
 * organisation. An org-level grant always carries full establishment-admin
 * rights at every home underneath it - this is the cascade from the access
 * model, enforced here once rather than per-action.
 */
async function hasOrgCascadeAdmin(
  userId: string,
  careHomeId: string,
): Promise<boolean> {
  const careHome = await getCareHomeById(db, careHomeId);
  if (!careHome?.organisationId) return false;

  const orgMembership = await getOrganisationMemberByUserIdAndOrganisationId(
    db,
    userId,
    careHome.organisationId,
  );
  return !!orgMembership;
}

/** Any role (admin, member, or it_admin) within the given care home, or a system admin. */
export async function requireCareHomeMember(
  careHomeId: string,
): Promise<GuardResult> {
  const auth = await requireAuthenticatedUser();
  if (auth.error || !auth.profile) return auth;

  if (auth.profile.isSystemAdmin) return auth;

  const membership = auth.memberships.find((m) => m.careHome.id === careHomeId);
  if (membership) return auth;

  if (await hasOrgCascadeAdmin(auth.userId, careHomeId)) return auth;

  return { error: PERMISSION_ERROR };
}

/** Admin role within the given care home, an org-cascade admin, or a system admin. */
export async function requireCareHomeAdmin(
  careHomeId: string,
): Promise<GuardResult> {
  const auth = await requireAuthenticatedUser();
  if (auth.error || !auth.profile) return auth;

  if (auth.profile.isSystemAdmin) return auth;

  const membership = auth.memberships.find((m) => m.careHome.id === careHomeId);
  if (membership?.role === "admin") return auth;

  if (await hasOrgCascadeAdmin(auth.userId, careHomeId)) return auth;

  return { error: PERMISSION_ERROR };
}

/**
 * Admin or IT Admin within the given care home, an org-cascade admin, or a
 * system admin. For account-lifecycle actions only (invite/remove a staff
 * login, assign person-scoped access) - never clinical data. IT Admin never
 * satisfies requireCareHomeAdmin or requirePatientAccess.
 */
export async function requireCareHomeAccountManager(
  careHomeId: string,
): Promise<GuardResult> {
  const auth = await requireAuthenticatedUser();
  if (auth.error || !auth.profile) return auth;

  if (auth.profile.isSystemAdmin) return auth;

  const membership = auth.memberships.find((m) => m.careHome.id === careHomeId);
  if (membership?.role === "admin" || membership?.role === "it_admin") {
    return auth;
  }

  if (await hasOrgCascadeAdmin(auth.userId, careHomeId)) return auth;

  return { error: PERMISSION_ERROR };
}

/**
 * Can this user view, record, edit, delete, or share data for this specific
 * patient? Admins and org-cascade admins always pass. A home-wide member
 * passes for any patient at their care home. A person-scoped member only
 * passes if they hold an explicit patient_access_grants row for this
 * patient. IT Admin never passes - account management isn't clinical access.
 */
export async function requirePatientAccess(
  patientId: string,
): Promise<GuardResult> {
  const auth = await requireAuthenticatedUser();
  if (auth.error || !auth.profile) return auth;

  if (auth.profile.isSystemAdmin) return auth;

  const patient = await getPatientById(db, patientId);
  if (!patient?.careHomeId) {
    return { error: "Resident not found" };
  }

  if (await hasOrgCascadeAdmin(auth.userId, patient.careHomeId)) return auth;

  const membership = auth.memberships.find(
    (m) => m.careHome.id === patient.careHomeId,
  );
  if (!membership || membership.role === "it_admin") {
    return { error: PERMISSION_ERROR };
  }

  if (membership.role === "admin" || membership.accessMode === "home_wide") {
    return auth;
  }

  const grant = await getPatientAccessGrant(db, auth.userId, patientId);
  if (!grant) {
    return { error: PERMISSION_ERROR };
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
