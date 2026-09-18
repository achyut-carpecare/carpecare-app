import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/features/auth/server";
import { db } from "@/features/database";
import { getUserProfileById } from "@/features/database/queries";
import { PageHeader } from "@/features/dashboard/components/page-header";
import { formatName } from "@/features/dashboard/lib/format";
import { ChangePasswordForm } from "./components/change-password-form";

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const profile = await getUserProfileById(db, user.id);

  const { data: factorsData } = await supabase.auth.mfa.listFactors();
  const mfaEnrolled = factorsData?.totp.some((f) => f.status === "verified");

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader
        title="Account"
        subtitle="Manage your profile and security settings"
      />

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Your details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Name
              </div>
              <div className="font-semibold mt-0.5">
                {formatName(profile?.firstName, profile?.lastName)}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Email
              </div>
              <div className="font-semibold mt-0.5">{user.email}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Two-factor authentication
            </span>
            {mfaEnrolled ? (
              <Badge variant="secondary">Enabled</Badge>
            ) : (
              <Badge variant="warning">Not set up</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Change password</CardTitle>
          <CardDescription>
            You&apos;ll stay signed in on this device after changing it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
