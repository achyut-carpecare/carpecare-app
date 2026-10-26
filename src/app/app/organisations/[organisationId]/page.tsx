import Link from "next/link";
import { notFound } from "next/navigation";
import { Building2, Users, Activity, Video } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { db } from "@/features/database";
import { requireOrganisationAdmin } from "@/features/auth/guards";
import { getAuthUserEmailsByIds } from "@/features/auth/admin";
import {
  getCareHomeAdminsForOrganisation,
  getCareHomeCounts,
  getCareHomesForOrganisation,
  getOrganisationById,
  getOrganisationMembersWithProfiles,
  getStandaloneCareHomes,
} from "@/features/database/queries";
import { PageHeader } from "@/features/dashboard/components/page-header";
import { AccessDenied } from "@/features/dashboard/components/access-denied";
import { formatCareHomeKind } from "@/features/dashboard/lib/format";
import { AddCareHomeToOrgDialog } from "./components/add-care-home-to-org-dialog";
import { AttachCareHomeDialog } from "./components/attach-care-home-dialog";
import { DetachCareHomeButton } from "./components/detach-care-home-button";
import { RenameOrganisationDialog } from "./components/rename-organisation-dialog";
import { AddOrgMemberDialog } from "./components/add-org-member-dialog";
import { OrgMembersList } from "./components/org-members-list";
import { DeleteOrganisationDialog } from "./components/delete-organisation-dialog";

interface OrganisationPageProps {
  params: Promise<{ organisationId: string }>;
}

export default async function OrganisationPage({
  params,
}: OrganisationPageProps) {
  const { organisationId } = await params;

  const auth = await requireOrganisationAdmin(organisationId);
  if (auth.error || !auth.profile) {
    return <AccessDenied />;
  }

  const organisation = await getOrganisationById(db, organisationId);
  if (!organisation) {
    notFound();
  }

  const [homes, membersWithProfiles, candidateProfiles, standaloneCareHomes] =
    await Promise.all([
      getCareHomesForOrganisation(db, organisationId),
      getOrganisationMembersWithProfiles(db, organisationId),
      getCareHomeAdminsForOrganisation(db, organisationId),
      auth.profile.isSystemAdmin
        ? getStandaloneCareHomes(db)
        : Promise.resolve([]),
    ]);

  const homesWithCounts = await Promise.all(
    homes.map(async (home) => {
      const counts = await getCareHomeCounts(db, home.id);
      return { ...home, ...counts };
    }),
  );

  const totalResidents = homesWithCounts.reduce(
    (sum, h) => sum + h.patientCount,
    0,
  );
  const totalMembers = homesWithCounts.reduce(
    (sum, h) => sum + h.memberCount,
    0,
  );
  const totalEventsThisMonth = homesWithCounts.reduce(
    (sum, h) => sum + h.eventsThisMonth,
    0,
  );

  const emailById = await getAuthUserEmailsByIds([
    ...membersWithProfiles.map((m) => m.profile.id),
    ...candidateProfiles.map((p) => p.id),
  ]);

  const members = membersWithProfiles.map((m) => ({
    id: m.member.id,
    firstName: m.profile.firstName,
    lastName: m.profile.lastName,
    email: emailById.get(m.profile.id),
  }));

  const candidates = candidateProfiles.map((p) => ({
    id: p.id,
    firstName: p.firstName,
    lastName: p.lastName,
    email: emailById.get(p.id),
  }));

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader
        title={organisation.name ?? "Unnamed organisation"}
        subtitle={`${homes.length} ${homes.length === 1 ? "establishment" : "establishments"}`}
        actions={
          <div className="flex items-center gap-2">
            <RenameOrganisationDialog
              organisationId={organisationId}
              currentName={organisation.name ?? ""}
            />
            {auth.profile.isSystemAdmin && (
              <DeleteOrganisationDialog
                organisationId={organisationId}
                organisationName={organisation.name ?? "this organisation"}
              />
            )}
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl">
          <CardContent className="p-5 space-y-1">
            <Building2 className="w-5 h-5 text-primary" />
            <div className="text-3xl font-bold">{homes.length}</div>
            <div className="text-sm text-muted-foreground">Establishments</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-5 space-y-1">
            <Users className="w-5 h-5 text-primary" />
            <div className="text-3xl font-bold">{totalResidents}</div>
            <div className="text-sm text-muted-foreground">
              Residents, across all homes
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-5 space-y-1">
            <Video className="w-5 h-5 text-primary" />
            <div className="text-3xl font-bold">{totalEventsThisMonth}</div>
            <div className="text-sm text-muted-foreground">
              Events this month
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-5 space-y-1">
            <Activity className="w-5 h-5 text-primary" />
            <div className="text-3xl font-bold">{totalMembers}</div>
            <div className="text-sm text-muted-foreground">
              Staff, across all homes
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Establishments</CardTitle>
          <div className="flex items-center gap-2">
            {auth.profile.isSystemAdmin && (
              <AttachCareHomeDialog
                organisationId={organisationId}
                standaloneCareHomes={standaloneCareHomes}
              />
            )}
            <AddCareHomeToOrgDialog organisationId={organisationId} />
          </div>
        </CardHeader>
        <CardContent>
          {homesWithCounts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No establishments yet - add the first one above.
            </p>
          ) : (
            <div className="space-y-3">
              {homesWithCounts.map((home) => (
                <div
                  key={home.id}
                  className="flex items-center justify-between rounded-xl border p-4 hover:border-primary/30 transition-colors"
                >
                  <Link href={`/app/care-homes/${home.id}`} className="flex-1">
                    <div className="font-medium flex items-center gap-2">
                      {home.name ?? "Unnamed establishment"}
                      <Badge variant="outline">
                        {formatCareHomeKind(home.kind)}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {home.patientCount} residents · {home.memberCount} staff ·{" "}
                      {home.eventsThisMonth} events this month
                    </div>
                  </Link>
                  {auth.profile.isSystemAdmin && (
                    <DetachCareHomeButton
                      careHomeId={home.id}
                      careHomeName={home.name ?? "this establishment"}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Senior managers</CardTitle>
          <AddOrgMemberDialog
            organisationId={organisationId}
            candidates={candidates}
          />
        </CardHeader>
        <CardContent>
          <OrgMembersList members={members} />
        </CardContent>
      </Card>
    </div>
  );
}
