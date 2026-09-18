import { createClient } from "@/features/auth/server";
import { db } from "@/features/database";
import { getUserProfileById } from "@/features/database/queries";
import { formatName } from "@/features/dashboard/lib/format";
import { Header } from "@/app/home/lib/components/Header";
import { HelpForm } from "./components/help-form";

export default async function HelpPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = user ? await getUserProfileById(db, user.id) : undefined;
  const defaultName = profile
    ? formatName(profile.firstName, profile.lastName)
    : undefined;

  return (
    <div className="flex min-h-full flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center p-6">
        <HelpForm
          defaultName={defaultName === "Unknown" ? undefined : defaultName}
          defaultEmail={user?.email ?? undefined}
        />
      </main>
    </div>
  );
}
