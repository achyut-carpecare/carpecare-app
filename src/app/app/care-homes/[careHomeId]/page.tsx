import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import {
  Activity,
  ArrowRight,
  Building2,
  Plus,
  Share2,
  Users,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { db } from "@/features/database";
import { createClient } from "@/features/auth/server";
import { PageHeader } from "@/features/dashboard/components/page-header";
import {
  getCareHomeById,
  getCareHomeCounts,
  getRecentActivity,
  getUserWithMemberships,
} from "@/features/database/queries";
import { startOfDay } from "@/features/database/lib/date";
import { formatDuration, formatTime } from "@/features/dashboard/lib/format";

interface DashboardPageProps {
  params: Promise<{ careHomeId: string }>;
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

  if (!isMember && profile.role !== "system_admin") {
    notFound();
  }

  const careHome = await getCareHomeById(db, careHomeId);

  if (!careHome) {
    notFound();
  }

  const counts = await getCareHomeCounts(db, careHomeId);
  const recentActivity = await getRecentActivity(db, careHomeId, 20);

  const todayStart = startOfDay(new Date()).toISOString();
  const todaysActivity = recentActivity.filter(
    (a) => a.timestamp >= todayStart,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={careHome.name ?? "Care home"}
        subtitle="Welcome back. Here is what is happening today."
        actions={
          <>
            <Button asChild variant="secondary" className="rounded-xl">
              <Link href={`/app/care-homes/${careHomeId}/patients`}>
                <Plus className="w-4 h-4 mr-2" />
                Add resident
              </Link>
            </Button>
            <Button asChild className="rounded-xl">
              <Link href="#">
                <Zap className="w-4 h-4 mr-2" />
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
        />
        <StatCard
          icon={Share2}
          label="Pending shares"
          value={counts.sharesThisMonth}
        />
      </div>

      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">What happened today</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {todaysActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nothing recorded yet today. A calm start is good news.
            </p>
          ) : (
            todaysActivity.map((item) => (
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
    <Card className="rounded-2xl">
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
