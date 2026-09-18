import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Activity, ArrowRight, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/features/auth/server";
import { db } from "@/features/database";
import {
  getCareHomeById,
  getPatientsWithLastSeizure,
  getUserWithMemberships,
} from "@/features/database/queries";
import { AccessDenied } from "@/features/dashboard/components/access-denied";
import { AddPatientDialog } from "./components/add-patient-dialog";
import { PageHeader } from "@/features/dashboard/components/page-header";
import { formatDate } from "@/features/dashboard/lib/format";
import { daysSince, formatName, patientStatus } from "./lib/helpers";

interface PatientsPageProps {
  params: Promise<{ careHomeId: string }>;
  searchParams: Promise<{ q?: string }>;
}

export default async function PatientsPage({
  params,
  searchParams,
}: PatientsPageProps) {
  const { careHomeId } = await params;
  const { q } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect("/auth/login");
  }

  const userData = await getUserWithMemberships(db, authUser.id);
  if (!userData) {
    redirect("/auth/login");
  }

  const { profile, memberships } = userData;
  const membership = memberships.find((m) => m.careHome.id === careHomeId);

  if (!membership && !profile.isSystemAdmin) {
    return <AccessDenied />;
  }

  const isAdmin = profile.isSystemAdmin || membership?.role === "admin";

  const careHome = await getCareHomeById(db, careHomeId);
  if (!careHome) {
    notFound();
  }

  const patients = await getPatientsWithLastSeizure(db, careHomeId);

  const filteredPatients = q
    ? patients.filter((p) =>
        formatName(p.firstName, p.lastName)
          .toLowerCase()
          .includes(q.toLowerCase()),
      )
    : patients;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Residents"
        subtitle={`Everyone at ${careHome.name ?? "this care home"}`}
        actions={
          <>
            <Button asChild variant="secondary" className="rounded-xl">
              <Link href={`/app/care-homes/${careHomeId}/events`}>
                <Activity className="w-4 h-4 mr-2" />
                All events
              </Link>
            </Button>
            {isAdmin && <AddPatientDialog careHomeId={careHomeId} />}
          </>
        }
      />

      <form
        action={`/app/care-homes/${careHomeId}/patients`}
        method="GET"
        className="max-w-md"
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            name="q"
            defaultValue={q}
            placeholder="Search residents..."
            className="pl-9 rounded-xl"
          />
        </div>
      </form>

      <div className="space-y-3">
        {filteredPatients.length === 0 ? (
          <Card className="rounded-2xl">
            <CardContent className="p-8 text-center">
              <Users className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                {q ? "No residents match your search." : "No residents yet."}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredPatients.map((patient) => {
            const ds = daysSince(patient.lastRecordedAt);
            const status = patientStatus(ds);

            return (
              <Card
                key={patient.id}
                className="rounded-2xl hover:border-primary/30 transition-colors"
              >
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-lg">
                          {formatName(patient.firstName, patient.lastName)}
                        </span>
                        <Badge
                          variant={status.variant}
                          className="rounded-full capitalize"
                        >
                          {status.label}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        DOB {formatDate(patient.dateOfBirth)} ·{" "}
                        {patient.totalEvents} records · Last event{" "}
                        {patient.lastRecordedAt
                          ? formatDate(patient.lastRecordedAt)
                          : "never"}
                      </div>
                    </div>
                    <Button asChild variant="default" className="rounded-xl">
                      <Link
                        href={`/app/care-homes/${careHomeId}/patients/${patient.id}`}
                      >
                        View resident
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
