import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Award,
  Building2,
  Clock,
  Eye,
  Plus,
  Share2,
  TrendingUp,
  Video,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { db } from "@/features/database";
import { createClient } from "@/features/auth/server";
import { PageHeader } from "@/features/dashboard/components/page-header";
import { AccessDenied } from "@/features/dashboard/components/access-denied";
import {
  getCareHomeById,
  getCareHomeCounts,
  getCareHomeMonthlyInsights,
  getMostActiveRecorder,
  getRecentActivity,
  getResidentsToWatch,
  getUnopenedShares,
  getUserWithMemberships,
  getVideoCoverage,
} from "@/features/database/queries";
import { firstDayOfMonth } from "@/features/database/lib/date";
import {
  formatDate,
  formatDuration,
  formatTime,
} from "@/features/dashboard/lib/format";

interface DashboardPageProps {
  params: Promise<{ careHomeId: string }>;
}

function toDateParam(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default async function CareHomeDashboardPage({
  params,
}: DashboardPageProps) {
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

  const isMember = memberships.some((m) => m.careHome.id === careHomeId);

  if (!isMember && !profile.isSystemAdmin) {
    return <AccessDenied />;
  }

  const careHome = await getCareHomeById(db, careHomeId);

  if (!careHome) {
    notFound();
  }

  const [
    counts,
    insights,
    recentActivity,
    residentsToWatch,
    unopenedShares,
    videoCoverage,
    mostActiveRecorder,
  ] = await Promise.all([
    getCareHomeCounts(db, careHomeId),
    getCareHomeMonthlyInsights(db, careHomeId),
    getRecentActivity(db, careHomeId, 8),
    getResidentsToWatch(db, careHomeId),
    getUnopenedShares(db, careHomeId),
    getVideoCoverage(db, careHomeId),
    getMostActiveRecorder(db, careHomeId),
  ]);

  const today = toDateParam(new Date());
  const monthStart = toDateParam(firstDayOfMonth(new Date()));
  const eventsBase = `/app/care-homes/${careHomeId}/events`;

  return (
    <div className="space-y-6">
      <PageHeader
        title={careHome.name ?? "Care home"}
        subtitle="Welcome back. Here is what is happening."
        actions={
          <>
            <Button asChild variant="secondary" className="rounded-xl">
              <Link href={`/app/care-homes/${careHomeId}/patients`}>
                <Plus className="w-4 h-4 mr-2" />
                Add resident
              </Link>
            </Button>
            <Button asChild className="rounded-xl">
              <Link href={`/app/care-homes/${careHomeId}/patients`}>
                <Activity className="w-4 h-4 mr-2" />
                Record event
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Users}
          label="Residents"
          value={counts.patientCount}
          href={`/app/care-homes/${careHomeId}/patients`}
        />
        <StatCard
          icon={Building2}
          label="Team members"
          value={counts.memberCount}
          href={`/app/care-homes/${careHomeId}/members`}
        />
        <StatCard
          icon={Activity}
          label="Events this month"
          value={counts.eventsThisMonth}
          href={`${eventsBase}?from=${monthStart}&to=${today}`}
        />
        <StatCard
          icon={AlertCircle}
          label="Residents with an event today"
          value={counts.patientsWithEventToday}
          href={`${eventsBase}?from=${today}&to=${today}`}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <InsightCard
          icon={Clock}
          label="Average duration this month"
          value={formatDuration(insights.averageDuration)}
        />
        <InsightCard
          icon={Activity}
          label="Most common type this month"
          value={insights.commonType ?? "—"}
        />
        <InsightCard
          icon={Share2}
          label="Active shares"
          value={counts.activeShares.toString()}
        />
        <InsightCard
          icon={Video}
          label="Events with video this month"
          value={
            videoCoverage.total === 0
              ? "—"
              : `${videoCoverage.percent}% (${videoCoverage.withVideo}/${videoCoverage.total})`
          }
        />
        <InsightCard
          icon={Award}
          label="Most active recorder this month"
          value={
            mostActiveRecorder
              ? `${mostActiveRecorder.name} (${mostActiveRecorder.eventCount})`
              : "—"
          }
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Residents to watch
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {residentsToWatch.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No events in the last 7 days.
              </p>
            ) : (
              residentsToWatch.map((r) => (
                <Link
                  key={r.patientId}
                  href={`/app/care-homes/${careHomeId}/patients/${r.patientId}`}
                  className="flex items-center justify-between p-3 rounded-xl border border-border hover:border-primary/30 transition-colors"
                >
                  <div>
                    <div className="font-medium">{r.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Last event {formatDate(r.lastRecordedAt)}
                    </div>
                  </div>
                  <Badge variant="secondary" className="rounded-full">
                    {r.eventCount} in 7 days
                  </Badge>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              Unopened shares
              {unopenedShares.totalUnopened > 0 && (
                <Badge variant="warning" className="rounded-full">
                  {unopenedShares.totalUnopened}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {unopenedShares.shares.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Every share has been opened.
              </p>
            ) : (
              unopenedShares.shares.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-border"
                >
                  <div>
                    <div className="font-medium">
                      {s.patientName} · {s.recipientEmail ?? "a medic"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Sent {formatDate(s.createdAt)}
                    </div>
                  </div>
                  {s.expired ? (
                    <Badge variant="destructive" className="rounded-full">
                      Expired
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="rounded-full">
                      Waiting
                    </Badge>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Recent activity</CardTitle>
          <Link
            href={eventsBase}
            className="text-sm font-medium text-primary hover:underline"
          >
            View all events
          </Link>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nothing recorded yet. A calm start is good news.
            </p>
          ) : (
            recentActivity.map((item) => (
              <div
                key={`${item.kind}-${item.id}`}
                className="flex items-center justify-between p-3 rounded-xl border border-border"
              >
                <div className="space-y-0.5">
                  <div className="font-medium">
                    {item.kind === "seizure" ? (
                      <>
                        {item.patientName} · {item.seizureType ?? "Seizure"} ·{" "}
                        {formatDuration(item.durationSeconds)}
                      </>
                    ) : (
                      <>Share sent to {item.recipientEmail ?? "a medic"}</>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {item.kind === "seizure" ? (
                      <>
                        Recorded{" "}
                        {item.recorderName ? `by ${item.recorderName}` : ""} at{" "}
                        {formatTime(item.timestamp)}
                      </>
                    ) : (
                      <>
                        {item.patientName} · Shared{" "}
                        {item.sharerName ? `by ${item.sharerName}` : ""}
                      </>
                    )}
                  </div>
                </div>
                {item.kind === "seizure" ? (
                  <Button
                    asChild
                    variant="secondary"
                    size="sm"
                    className="rounded-lg"
                  >
                    <Link
                      href={`/app/care-homes/${careHomeId}/patients/${item.patientId}`}
                    >
                      View
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                  </Button>
                ) : (
                  <Badge variant="secondary">Active</Badge>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  href?: string;
}) {
  const content = (
    <Card className="rounded-2xl h-full transition-colors hover:border-primary/30">
      <CardContent className="p-5 space-y-1">
        <Icon className="w-5 h-5 text-primary" />
        <div className="text-3xl font-bold">{value}</div>
        <div className="text-sm text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

function InsightCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <Card className="rounded-2xl">
      <CardContent className="p-5 flex items-center gap-3">
        <div className="p-2 rounded-xl bg-primary/10">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <div>
          <div className="font-semibold">{value}</div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}
