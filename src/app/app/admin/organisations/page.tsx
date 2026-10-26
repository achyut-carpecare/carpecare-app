import Link from "next/link";
import { Building2, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { db } from "@/features/database";
import { requireSystemAdmin } from "@/features/auth/guards";
import {
  getCareHomesForOrganisation,
  getOrganisations,
} from "@/features/database/queries";
import { PageHeader } from "@/features/dashboard/components/page-header";
import { AccessDenied } from "@/features/dashboard/components/access-denied";
import { CreateOrganisationDialog } from "./components/create-organisation-dialog";

export default async function AdminOrganisationsPage() {
  const auth = await requireSystemAdmin();
  if (auth.error) {
    return <AccessDenied />;
  }

  const organisations = await getOrganisations(db);
  const organisationsWithCounts = await Promise.all(
    organisations.map(async (organisation) => {
      const homes = await getCareHomesForOrganisation(db, organisation.id);
      return { ...organisation, homeCount: homes.length };
    }),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Organisations"
        subtitle="Multi-site providers - each contains one or more establishments"
        actions={<CreateOrganisationDialog />}
      />

      {organisationsWithCounts.length === 0 ? (
        <Card className="rounded-2xl">
          <CardContent className="p-8 text-center text-muted-foreground">
            No organisations yet. Most providers are single-site and don&apos;t
            need one - only create one for a provider with multiple
            establishments sharing admin oversight.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {organisationsWithCounts.map((organisation) => (
            <Link
              key={organisation.id}
              href={`/app/organisations/${organisation.id}`}
            >
              <Card className="rounded-2xl hover:border-primary/30 transition-colors h-full">
                <CardContent className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-primary" />
                    <div>
                      <div className="font-semibold">
                        {organisation.name ?? "Unnamed organisation"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {organisation.homeCount}{" "}
                        {organisation.homeCount === 1
                          ? "establishment"
                          : "establishments"}
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
