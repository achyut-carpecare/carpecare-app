import { redirect } from "next/navigation";
import { db } from "@/features/database";
import { createClient } from "@/features/auth/server";
import { AppShell } from "@/features/dashboard/components/app-shell";
import { getUserWithMemberships } from "@/features/database/queries";

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

  const result = await getUserWithMemberships(db, user.id);

  if (!result) {
    redirect("/auth/login");
  }

  const { profile, memberships } = result;
  const careHomes = memberships.map((m) => m.careHome);
  const adminCareHomeIds = memberships
    .filter((m) => m.role === "admin")
    .map((m) => m.careHome.id);

  return (
    <AppShell
      userEmail={user.email}
      userRole={profile.role}
      careHomes={careHomes}
      adminCareHomeIds={adminCareHomeIds}
    >
      {children}
    </AppShell>
  );
}
