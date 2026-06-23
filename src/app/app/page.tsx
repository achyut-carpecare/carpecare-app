import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { db } from "@/features/database";
import { createClient } from "@/features/auth/server";
import {
  getCareHomeCounts,
  getUserWithMemberships,
} from "@/features/database/queries";

export default async function AppPage() {
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

  if (profile.role === "system_admin") {
    redirect("/app/admin");
  }

  if (memberships.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center space-y-4">
        <h1 className="text-2xl font-bold">No care home yet</h1>
        <p className="text-muted-foreground">
          You are not assigned to any care home. Contact your administrator.
        </p>
      </div>
    );
  }

  if (memberships.length === 1) {
    redirect(`/app/care-homes/${memberships[0].careHome.id}`);
  }

  const careHomesWithCounts = await Promise.all(
    memberships.map(async (membership) => {
      const counts = await getCareHomeCounts(db, membership.careHome.id);
      return {
        ...membership.careHome,
        role: membership.role,
        ...counts,
      };
    }),
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Your care homes</h1>
        <p className="text-muted-foreground">Choose a care home to continue.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {careHomesWithCounts.map((home) => (
          <Card key={home.id} className="rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="w-5 h-5 text-primary" />
                {home.name ?? "Unnamed care home"}
              </CardTitle>
              <CardDescription className="capitalize">
                {home.role.toLowerCase().replace("_", " ")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  {home.patientCount} residents
                </div>
                <div>{home.eventsThisMonth} events this month</div>
              </div>
              <Button asChild className="w-full rounded-xl">
                <Link href={`/app/care-homes/${home.id}`}>
                  Open care home
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
