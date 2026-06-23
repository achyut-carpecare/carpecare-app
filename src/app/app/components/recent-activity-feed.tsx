import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

type Activity = {
  kind: "seizure" | "share";
  id: string;
  patientId: string;
  patientName: string;
  timestamp: string;
  durationSeconds: number | null;
  seizureType: string | null;
  recorderName: string | null;
  recipientEmail: string | null;
  sharerName: string | null;
};

interface RecentActivityFeedProps {
  careHomeId: string;
  activities: Activity[];
}

export function RecentActivityFeed({
  careHomeId,
  activities,
}: RecentActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>What&apos;s happening today</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Nothing has been recorded recently. A calm start is good news.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>What&apos;s happening today</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {activities.map((activity) => (
          <ActivityItem
            key={`${activity.kind}-${activity.id}`}
            careHomeId={careHomeId}
            activity={activity}
          />
        ))}
      </CardContent>
    </Card>
  );
}

function ActivityItem({
  careHomeId,
  activity,
}: {
  careHomeId: string;
  activity: Activity;
}) {
  const formattedTime = formatTimestamp(activity.timestamp);

  if (activity.kind === "seizure") {
    const duration = activity.durationSeconds
      ? formatDuration(activity.durationSeconds)
      : null;

    return (
      <div className="flex items-start justify-between gap-4 rounded-xl border p-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Link
              href={`/app/care-homes/${careHomeId}/patients/${activity.patientId}`}
              className="font-semibold hover:underline"
            >
              {activity.patientName}
            </Link>
            <Badge
              variant="outline"
              className="text-amber-600 border-amber-200 bg-amber-50"
            >
              Seizure
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {activity.seizureType ?? "Unspecified"}
            {duration ? ` · ${duration}` : ""}
            {activity.recorderName
              ? ` · Recorded by ${activity.recorderName}`
              : ""}
          </p>
          <p className="text-xs text-muted-foreground">{formattedTime}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border p-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <Link
            href={`/app/care-homes/${careHomeId}/patients/${activity.patientId}`}
            className="font-semibold hover:underline"
          >
            {activity.patientName}
          </Link>
          <Badge
            variant="outline"
            className="text-blue-600 border-blue-200 bg-blue-50"
          >
            Shared
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Sent to {activity.recipientEmail ?? "a recipient"}
          {activity.sharerName ? ` by ${activity.sharerName}` : ""}
        </p>
        <p className="text-xs text-muted-foreground">{formattedTime}</p>
      </div>
    </div>
  );
}

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

function formatTimestamp(isoString: string) {
  const date = new Date(isoString);
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
