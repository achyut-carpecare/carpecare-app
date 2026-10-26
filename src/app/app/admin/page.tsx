import Link from "next/link";
import { Building2, Users } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireSystemAdmin } from "@/features/auth/guards";
import { db } from "@/features/database";
import { PageHeader } from "@/features/dashboard/components/page-header";
import { AccessDenied } from "@/features/dashboard/components/access-denied";
import { getCareHomeCounts, getCareHomes } from "@/features/database/queries";
import { formatCareHomeKind } from "@/features/dashboard/lib/format";
import { AddCareHomeDialog } from "./components/add-care-home-dialog";
import { EditCareHomeDialog } from "./components/edit-care-home-dialog";
import { DeleteCareHomeDialog } from "./components/delete-care-home-dialog";

export default async function AdminDashboardPage() {
  const auth = await requireSystemAdmin();
  if (auth.error) {
    return <AccessDenied />;
  }

  const careHomes = await getCareHomes(db);

  const careHomesWithCounts = await Promise.all(
    careHomes.map(async (home) => {
      const counts = await getCareHomeCounts(db, home.id);
      return { ...home, ...counts };
    }),
  );

  const totalPatients = careHomesWithCounts.reduce(
    (sum, h) => sum + h.patientCount,
    0,
  );
  const totalMembers = careHomesWithCounts.reduce(
    (sum, h) => sum + h.memberCount,
    0,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin dashboard"
        subtitle="A calm overview of all establishments"
        actions={<AddCareHomeDialog />}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="rounded-2xl">
          <CardContent className="p-5 space-y-1">
            <Building2 className="w-5 h-5 text-primary" />
            <div className="text-3xl font-bold">
              {careHomesWithCounts.length}
            </div>
            <div className="text-sm text-muted-foreground">Establishments</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-5 space-y-1">
            <Users className="w-5 h-5 text-primary" />
            <div className="text-3xl font-bold">{totalPatients}</div>
            <div className="text-sm text-muted-foreground">Residents</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-5 space-y-1">
            <Users className="w-5 h-5 text-primary" />
            <div className="text-3xl font-bold">{totalMembers}</div>
            <div className="text-sm text-muted-foreground">Team members</div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">All establishments</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Residents</TableHead>
                <TableHead className="text-right">Members</TableHead>
                <TableHead className="text-right">Events this month</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {careHomesWithCounts.map((home) => (
                <TableRow key={home.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/app/care-homes/${home.id}`}
                      className="hover:underline"
                    >
                      {home.name ?? "Unnamed establishment"}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {formatCareHomeKind(home.kind)}
                    </Badge>
                    {home.organisationId && (
                      <span className="ml-1.5 text-xs text-muted-foreground">
                        in an org
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {home.patientCount}
                  </TableCell>
                  <TableCell className="text-right">
                    {home.memberCount}
                  </TableCell>
                  <TableCell className="text-right">
                    {home.eventsThisMonth}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex gap-2">
                      <EditCareHomeDialog careHome={home} />
                      <DeleteCareHomeDialog careHome={home} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
