import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/features/auth/server";
import { db } from "@/features/database";
import {
  getCareHomeById,
  getPatientById,
  getUserWithMemberships,
  getPatientTimeline,
  getPatientStats,
  getSeizureCalendarDays,
  getBestCalmSpellDays,
} from "@/features/database/queries";
import { PageHeader } from "@/features/dashboard/components/page-header";
import { DaysSinceRing } from "@/features/dashboard/components/days-since-ring";
import { DotCalendar } from "@/features/dashboard/components/dot-calendar";
import { SparseTimeline } from "@/features/dashboard/components/sparse-timeline";
import { formatDate, formatDuration } from "@/features/dashboard/lib/format";
import { daysSince, formatName } from "../lib/helpers";
import { EditPatientDialog } from "../components/edit-patient-dialog";

interface PatientDetailPageProps {
  params: Promise<{ careHomeId: string; patientId: string }>;
}

export default async function PatientDetailPage({
  params,
}: PatientDetailPageProps) {
  const { careHomeId, patientId } = await params;

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
    notFound();
  }

  const careHome = await getCareHomeById(db, careHomeId);
  if (!careHome) {
    notFound();
  }

  const patient = await getPatientById(db, patientId, { careHomeId });
  if (!patient) {
    notFound();
  }

  const [timeline, stats, eventDays, bestCalmSpell] = await Promise.all([
    getPatientTimeline(db, patientId),
    getPatientStats(db, patientId),
    getSeizureCalendarDays(db, patientId),
    getBestCalmSpellDays(db, patientId),
  ]);

  const ds = daysSince(stats.lastRecordedAt);

  return (
    <div className="space-y-6">
      <Link
        href={`/app/care-homes/${careHomeId}/patients`}
        className="inline-flex items-center text-sm font-semibold text-primary hover:underline"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to residents
      </Link>

      <PageHeader
        title={formatName(patient.firstName, patient.lastName)}
        subtitle={`DOB ${formatDate(patient.dateOfBirth)} · NHS ${patient.nhsNumber ?? "—"}`}
        actions={
          <>
            <EditPatientDialog careHomeId={careHomeId} patient={patient} />
            <Button asChild className="rounded-xl">
              <Link
                href={`/app/care-homes/${careHomeId}/patients/${patientId}/seizure-records/new`}
              >
                <Zap className="w-4 h-4 mr-2" />
                Record event
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        <div className="space-y-6">
          <Card className="rounded-2xl">
            <CardContent className="p-6">
              <DaysSinceRing days={ds} />
              <p className="text-sm text-center text-muted-foreground mt-3">
                {ds === 0
                  ? `${formatName(patient.firstName, patient.lastName)} had a seizure today. Staff checked in and recovery was good.`
                  : ds === null
                    ? "No seizure events recorded yet."
                    : `A calm period of ${ds} days. Every calm day matters.`}
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quick stats</CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="grid grid-cols-2 gap-4">
                <Stat
                  label="Total events"
                  value={stats.totalEvents.toString()}
                />
                <Stat
                  label="Best calm spell"
                  value={bestCalmSpell ? `${bestCalmSpell} days` : "—"}
                />
                <Stat
                  label="Average duration"
                  value={formatDuration(stats.averageDuration)}
                />
                <Stat label="Common type" value={stats.commonType ?? "—"} />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Event days this month</CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <DotCalendar eventDays={eventDays} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                About {formatName(patient.firstName, patient.lastName)}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Stat
                  label="Full name"
                  value={formatName(patient.firstName, patient.lastName)}
                />
                <Stat
                  label="Date of birth"
                  value={formatDate(patient.dateOfBirth)}
                />
                <Stat label="NHS number" value={patient.nhsNumber ?? "—"} />
                <Stat label="Care home" value={careHome.name ?? "—"} />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base">Seizure timeline</CardTitle>
              <Badge variant="secondary" className="rounded-full">
                Sparse events are normal
              </Badge>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              {timeline.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No events or shares recorded yet.
                </p>
              ) : (
                <SparseTimeline
                  items={timeline}
                  careHomeId={careHomeId}
                  patientId={patientId}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="font-semibold mt-0.5">{value}</div>
    </div>
  );
}
