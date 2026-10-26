"use server";

import { db } from "@/features/database";
import {
  getCareHomeById,
  getCareHomesForOrganisation,
  getOrganisationMemberByUserIdAndOrganisationId,
  getOrganisationsForUser,
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
 * Org Admin for the given organisation, or a system admin. Org Admins can
 * manage each other (add/remove seats, create/rename establishments) - there
 * is no extra restriction here beyond holding the grant.
 */
export async function requireOrganisationAdmin(
  organisationId: string,
): Promise<GuardResult> {
  const auth = await requireAuthenticatedUser();
  if (auth.error || !auth.profile) return auth;

  if (auth.profile.isSystemAdmin) return auth;

  const membership = await getOrganisationMemberByUserIdAndOrganisationId(
    db,
    auth.userId,
    organisationId,
  );
  if (!membership) {
    return { error: PERMISSION_ERROR };
  }

  return auth;
}

export interface EffectiveMembership {
  careHome: UserWithMemberships["memberships"][number]["careHome"];
  role: "admin" | "member" | "it_admin";
  accessMode: "home_wide" | "person_scoped";
}

export interface EffectiveAccessOk {
  error?: undefined;
  userId: string;
  profile: UserWithMemberships["profile"];
  memberships: EffectiveMembership[];
}

export type EffectiveAccessResult = EffectiveAccessOk | GuardErr;

/**
 * Every care home this user has access to - their direct care_home_members
 * rows, plus every home under an organisation they're an Org Admin of
 * (shown as admin/home_wide, matching what the cascade in
 * requireCareHomeAdmin actually grants). Use this instead of reading
 * `memberships` straight off requireAuthenticatedUser() wherever the UI
 * needs the full list - the care-home switcher, the "your care homes"
 * landing page - rather than a single yes/no check on one care home.
 */
export async function getEffectiveMemberships(): Promise<EffectiveAccessResult> {
  const auth = await requireAuthenticatedUser();
  if (auth.error || !auth.profile) return auth;

  const byId = new Map<string, EffectiveMembership>(
    auth.memberships.map((m) => [
      m.careHome.id,
      { careHome: m.careHome, role: m.role, accessMode: m.accessMode },
    ]),
  );

  const orgs = await getOrganisationsForUser(db, auth.userId);
  for (const org of orgs) {
    const homes = await getCareHomesForOrganisation(db, org.id);
    for (const careHome of homes) {
      const existing = byId.get(careHome.id);
      if (!existing || existing.role !== "admin") {
        byId.set(careHome.id, {
          careHome,
          role: "admin",
          accessMode: "home_wide",
        });
      }
    }
  }

  return {
    userId: auth.userId,
    profile: auth.profile,
    memberships: Array.from(byId.values()),
  };
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
