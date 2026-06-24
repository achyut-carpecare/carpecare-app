import { notFound, redirect } from "next/navigation";
import { Download, Mail } from "lucide-react";
import { eq } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { db } from "@/features/database";
import { schema } from "@/features/database";
import {
  formatDateTime,
  formatDuration,
  formatName,
} from "@/features/dashboard/lib/format";
import { compareTokenHash } from "@/features/email";
import { getSeizureRecordShareById } from "@/features/database/queries";
import { isShareSessionValid } from "./actions";

interface SharePageProps {
  params: Promise<{ shareId: string }>;
  searchParams: Promise<{ token?: string }>;
}

export default async function SharePage({
  params,
  searchParams,
}: SharePageProps) {
  const { shareId } = await params;
  const { token } = await searchParams;

  const share = await getSeizureRecordShareById(db, shareId);
  if (!share) {
    notFound();
  }

  if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full rounded-2xl">
          <CardContent className="p-8 text-center">
            <h1 className="text-xl font-bold mb-2">Link expired</h1>
            <p className="text-muted-foreground">
              This secure share link has expired. Please contact the care home
              for a new link.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasValidSession = await isShareSessionValid(shareId);

  if (!hasValidSession) {
    if (!token || !share.linkTokenHash) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <Card className="max-w-md w-full rounded-2xl">
            <CardContent className="p-8 text-center">
              <h1 className="text-xl font-bold mb-2">Invalid link</h1>
              <p className="text-muted-foreground">
                This share link is missing a required access token. Please
                request a new link from the care home.
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    if (!compareTokenHash(token, share.linkTokenHash)) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <Card className="max-w-md w-full rounded-2xl">
            <CardContent className="p-8 text-center">
              <h1 className="text-xl font-bold mb-2">Invalid link</h1>
              <p className="text-muted-foreground">
                This share link is invalid or has been revoked. Please contact
                the care home for a new link.
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Token is valid but no session yet. Redirect to the client-only verify
    // page so the user can request and enter the OTP without hydration issues.
    redirect(`/share/${shareId}/verify?token=${encodeURIComponent(token)}`);
  }

  const recordWithDetails = await db
    .select({
      seizureRecord: schema.seizureRecords,
      patient: schema.patients,
      careHome: schema.careHome,
      recorder: schema.userProfiles,
      file: schema.files,
    })
    .from(schema.seizureRecordShares)
    .innerJoin(
      schema.seizureRecords,
      eq(schema.seizureRecordShares.seizureRecordId, schema.seizureRecords.id),
    )
    .innerJoin(
      schema.patients,
      eq(schema.seizureRecords.patientId, schema.patients.id),
    )
    .innerJoin(
      schema.careHome,
      eq(schema.patients.careHomeId, schema.careHome.id),
    )
    .leftJoin(
      schema.userProfiles,
      eq(schema.seizureRecords.recordedBy, schema.userProfiles.id),
    )
    .leftJoin(schema.files, eq(schema.seizureRecords.videoId, schema.files.id))
    .where(eq(schema.seizureRecordShares.id, shareId))
    .limit(1);

  const row = recordWithDetails[0];
  if (!row) {
    notFound();
  }

  const { seizureRecord, patient, careHome, recorder, file } = row;
  const patientName = formatName(patient.firstName, patient.lastName);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="font-semibold text-lg">Carpe Care</div>
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground border border-border rounded-full px-3 py-1">
          Read-only share
        </span>
      </header>

      <main className="max-w-3xl mx-auto p-6 space-y-6">
        <Alert className="rounded-xl">
          <AlertDescription>
            This secure share was sent to{" "}
            <strong>{share.recipientEmail ?? "you"}</strong> by{" "}
            {careHome.name ?? "the care home"}. It expires{" "}
            {share.expiresAt ? formatDateTime(share.expiresAt) : "soon"}.
          </AlertDescription>
        </Alert>

        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Seizure record</h1>
          <p className="text-muted-foreground">
            {patientName} · {careHome.name ?? "Care home"} ·{" "}
            {formatDateTime(seizureRecord.recordedAt)}
          </p>
        </div>

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
            <CardTitle className="text-base">Event details</CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
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
            <CardTitle className="text-base">Clinical notes</CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="bg-muted rounded-xl p-4 text-sm leading-relaxed">
              {seizureRecord.notes ?? "No notes recorded."}
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-3">
          <Button className="rounded-xl">
            <Download className="w-4 h-4 mr-2" />
            Download video
          </Button>
          <Button variant="outline" className="rounded-xl">
            <Mail className="w-4 h-4 mr-2" />
            Request more info
          </Button>
        </div>
      </main>
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
