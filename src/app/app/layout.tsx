import { redirect } from "next/navigation";
import { createClient } from "@/features/auth/server";
import { getEffectiveMemberships } from "@/features/auth/guards";
import { db } from "@/features/database";
import { getOrganisationsForUser } from "@/features/database/queries";
import { AppShell } from "@/features/dashboard/components/app-shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const result = await getEffectiveMemberships();

  if (result.error || !result.profile) {
    redirect("/auth/login");
  }

  const { profile, memberships } = result;
  const careHomes = memberships.map((m) => m.careHome);
  const adminCareHomeIds = memberships
    .filter((m) => m.role === "admin")
    .map((m) => m.careHome.id);

  const organisations = await getOrganisationsForUser(db, result.userId);

  return (
    <AppShell
      userEmail={user.email}
      userRole={profile.isSystemAdmin}
      careHomes={careHomes}
      adminCareHomeIds={adminCareHomeIds}
      organisations={organisations}
    >
      {children}
    </AppShell>
  );
}
