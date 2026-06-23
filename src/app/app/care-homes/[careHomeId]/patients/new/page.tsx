import { notFound, redirect } from "next/navigation";
import { db } from "@/features/database";
import { createClient } from "@/features/auth/server";
import {
  getUserWithMemberships,
  getCareHomeById,
} from "@/features/database/queries";
import { PageHeader } from "@/app/app/components/page-header";

interface NewPatientPageProps {
  params: Promise<{ careHomeId: string }>;
}

export default async function NewPatientPage({ params }: NewPatientPageProps) {
  const { careHomeId } = await params;

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

  const { memberships } = userData;
  const membership = memberships.find((m) => m.careHome.id === careHomeId);
  if (!membership || membership.role !== "admin") {
    redirect(`/app/care-homes/${careHomeId}/patients`);
  }

  const careHome = await getCareHomeById(db, careHomeId);
  if (!careHome) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Add resident"
        subtitle={careHome.name ?? "Care home"}
        backHref={`/app/care-homes/${careHomeId}/patients`}
        backLabel="Back to residents"
      />

      <div className="rounded-2xl border bg-card p-8 text-center">
        <p className="text-muted-foreground">
          Add resident form is being built. Check back soon.
        </p>
      </div>
    </div>
  );
}
