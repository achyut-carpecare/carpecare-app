import Link from "next/link";
import { ArrowRight, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateTime, formatDuration } from "../lib/format";

interface TimelineItem {
  kind: "seizure" | "share";
  id: string;
  timestamp: string;
  durationSeconds?: number | null;
  seizureType?: string | null;
  notes?: string | null;
  recorderName?: string | null;
  recipientEmail?: string | null;
  sharerName?: string | null;
  expiresAt?: string | null;
}

interface SparseTimelineProps {
  items: TimelineItem[];
  careHomeId: string;
  patientId: string;
}

export function SparseTimeline({
  items,
  careHomeId,
  patientId,
}: SparseTimelineProps) {
  return (
    <div className="relative pl-7 space-y-5">
      <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-border" />
      {items.map((item) => (
        <TimelineEvent
          key={`${item.kind}-${item.id}`}
          item={item}
          careHomeId={careHomeId}
          patientId={patientId}
        />
      ))}
    </div>
  );
}

function TimelineEvent({
  item,
  careHomeId,
  patientId,
}: {
  item: TimelineItem;
  careHomeId: string;
  patientId: string;
}) {
  const isSeizure = item.kind === "seizure";

  return (
    <div className="relative">
      <div
        className={[
          "absolute -left-[22px] top-2 w-3 h-3 rounded-full border-2 border-background shadow-sm",
          isSeizure ? "bg-amber-500" : "bg-primary",
        ].join(" ")}
      />
      <Card className="rounded-xl">
        <CardContent className="p-4 space-y-2">
          <div className="text-xs font-semibold text-muted-foreground">
            {formatDateTime(item.timestamp)}
          </div>
          <div className="font-semibold">
            {isSeizure ? (
              <>
                {item.seizureType ?? "Seizure"} ·{" "}
                {formatDuration(item.durationSeconds)}
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 inline mr-1" />
                Share link sent to {item.recipientEmail ?? "a medic"}
              </>
            )}
          </div>
          {isSeizure && item.notes && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {item.notes}
            </p>
          )}
          {!isSeizure && item.expiresAt && (
            <p className="text-sm text-muted-foreground">
              Expires {formatDateTime(item.expiresAt)}
            </p>
          )}
          {isSeizure && (
            <div className="flex flex-wrap gap-2 pt-1">
              <Button asChild size="sm" className="rounded-lg">
                <Link
                  href={`/app/care-homes/${careHomeId}/patients/${patientId}/seizure-records/${item.id}`}
                >
                  View record
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
              <Button
                asChild
                size="sm"
                variant="outline"
                className="rounded-lg"
              >
                <Link
                  href={`/app/care-homes/${careHomeId}/patients/${patientId}/seizure-records/${item.id}`}
                >
                  Share with medic
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
