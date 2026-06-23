import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/features/auth/server";
import { db } from "@/features/database";
import {
  getCareHomeById,
  getPatientById,
  getSeizureRecordWithDetails,
  getUserWithMemberships,
} from "@/features/database/queries";
import { PageHeader } from "@/features/dashboard/components/page-header";
import {
  formatDateTime,
  formatDuration,
  formatName,
} from "@/features/dashboard/lib/format";
import { ShareDialog } from "./components/share-dialog";

interface SeizureRecordPageProps {
  params: Promise<{
    careHomeId: string;
    patientId: string;
    seizureRecordId: string;
  }>;
}

export default async function SeizureRecordPage({
  params,
}: SeizureRecordPageProps) {
  const { careHomeId, patientId, seizureRecordId } = await params;

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
  if (!membership && profile.role !== "system_admin") {
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

  const recordWithDetails = await getSeizureRecordWithDetails(
    db,
    seizureRecordId,
    {
      careHomeId,
      patientId,
    },
  );

  if (!recordWithDetails) {
    notFound();
  }

  const { seizureRecord, recorder, file } = recordWithDetails;

  return (
    <div className="space-y-6">
      <Link
        href={`/app/care-homes/${careHomeId}/patients/${patientId}`}
        className="inline-flex items-center text-sm font-semibold text-primary hover:underline"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to {formatName(patient.firstName, patient.lastName)}
      </Link>

      <PageHeader
        title="Seizure record"
        subtitle={`${formatDateTime(seizureRecord.recordedAt)} · Recorded by ${formatName(recorder?.firstName, recorder?.lastName)}`}
        actions={
          <>
            <ShareDialog seizureRecordId={seizureRecordId} />
            <Button asChild variant="secondary" className="rounded-xl">
              <Link
                href={`/app/care-homes/${careHomeId}/patients/${patientId}/seizure-records/${seizureRecordId}/edit`}
              >
                <Pencil className="w-4 h-4 mr-2" />
                Edit
              </Link>
            </Button>
            <Button variant="destructive" className="rounded-xl">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </>
        }
      />

      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Video</CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="aspect-video bg-slate-900 rounded-xl flex items-center justify-center text-slate-300">
            {file ? (
              <video
                src={`/api/files/${file.id}`}
                controls
                className="w-full h-full rounded-xl"
              />
            ) : (
              <span>
                ▶ Video placeholder (
                {formatDuration(seizureRecord.durationSeconds)})
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Stat
              label="Date & time"
              value={formatDateTime(seizureRecord.recordedAt)}
            />
            <Stat
              label="Duration"
              value={formatDuration(seizureRecord.durationSeconds)}
            />
            <Stat label="Type" value={seizureRecord.seizureType ?? "—"} />
            <Stat
              label="Recorded by"
              value={formatName(recorder?.firstName, recorder?.lastName)}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Notes</CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="bg-muted rounded-xl p-4 text-sm leading-relaxed">
            {seizureRecord.notes ?? "No notes recorded."}
          </div>
        </CardContent>
      </Card>
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
