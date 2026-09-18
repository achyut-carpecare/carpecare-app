import { redirect, notFound } from "next/navigation";
import { createClient } from "@/features/auth/server";
import { db } from "@/features/database";
import { getAuthUserEmailsByIds } from "@/features/auth/admin";
import { PageHeader } from "@/features/dashboard/components/page-header";
import { AccessDenied } from "@/features/dashboard/components/access-denied";
import {
  getCareHomeById,
  getCareHomeInvitations,
  getCareHomeMembersWithProfiles,
  getUserWithMemberships,
} from "@/features/database/queries";
import { InviteMemberDialog } from "./components/invite-member-dialog";
import { JoinCareHomeButton } from "./components/join-care-home-button";
import { MembersList } from "./components/members-list";

interface MembersPageProps {
  params: Promise<{ careHomeId: string }>;
}

export default async function MembersPage({ params }: MembersPageProps) {
  const { careHomeId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const result = await getUserWithMemberships(db, user.id);
  if (!result) {
    redirect("/auth/login");
  }

  const { profile, memberships } = result;

  const isSystemAdmin = profile.isSystemAdmin;
  const membership = memberships.find((m) => m.careHome.id === careHomeId);
  const isMember = membership != null;
  const isCareHomeAdmin = membership?.role === "admin";
  const canManage = isSystemAdmin || isCareHomeAdmin;

  if (!canManage) {
    return <AccessDenied />;
  }

  const careHome = await getCareHomeById(db, careHomeId);
  if (!careHome) {
    notFound();
  }

  const membersWithProfiles = await getCareHomeMembersWithProfiles(
    db,
    careHomeId,
  );
  const invitations = await getCareHomeInvitations(db, careHomeId, {
    status: "pending",
  });

  const userIds = membersWithProfiles.map((item) => item.member.userId);
  const emailById = await getAuthUserEmailsByIds(userIds);

  const members = membersWithProfiles.map((item) => ({
    id: item.member.id,
    userId: item.member.userId,
    careHomeId: item.member.careHomeId,
    role: item.member.role,
    firstName: item.profile.firstName,
    lastName: item.profile.lastName,
    email: emailById.get(item.member.userId),
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team members"
        subtitle={`Manage who can access ${careHome.name ?? "this care home"}`}
        actions={
          <div className="flex items-center gap-2">
            {isSystemAdmin && !isMember && (
              <JoinCareHomeButton careHomeId={careHomeId} />
            )}
            {canManage && <InviteMemberDialog careHomeId={careHomeId} />}
          </div>
        }
      />

      <MembersList
        members={members}
        invitations={invitations}
        canManage={canManage}
      />
    </div>
  );
}
