import { redirect } from "next/navigation";
import { Users } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/features/auth/server";
import { getAuthUserEmailsByIds } from "@/features/auth/admin";
import { db } from "@/features/database";
import {
  getUserProfiles,
  getUserWithMemberships,
} from "@/features/database/queries";
import { PageHeader } from "@/features/dashboard/components/page-header";
import { AccessDenied } from "@/features/dashboard/components/access-denied";
import { InviteUserDialog } from "./components/invite-user-dialog";
import { DeleteUserButton } from "./components/delete-user-button";
import { AdminStatusSwitch } from "./components/admin-status-switch";
import { ResetMfaButton } from "./components/reset-mfa-button";

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const result = await getUserWithMemberships(db, user.id);

  if (!result || !result.profile.isSystemAdmin) {
    return <AccessDenied />;
  }

  const profiles = await getUserProfiles(db);
  const emailById = await getAuthUserEmailsByIds(profiles.map((p) => p.id));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform users"
        subtitle="Manage system administrator accounts"
        actions={<InviteUserDialog />}
      />

      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            All users
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>System admin</TableHead>
                <TableHead>MFA</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground"
                  >
                    No users found.
                  </TableCell>
                </TableRow>
              )}
              {profiles.map((profile) => {
                const isCurrentUser = profile.id === user.id;
                const email = emailById.get(profile.id);

                return (
                  <TableRow key={profile.id}>
                    <TableCell className="font-medium">
                      {[profile.firstName, profile.lastName]
                        .filter(Boolean)
                        .join(" ") || "Unnamed user"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {email ?? "—"}
                    </TableCell>
                    <TableCell>
                      <AdminStatusSwitch
                        userId={profile.id}
                        isAdmin={profile.isSystemAdmin}
                        disabled={isCurrentUser}
                      />
                    </TableCell>
                    <TableCell>
                      {profile.mfaEnabled ? (
                        <Badge variant="secondary">Enabled</Badge>
                      ) : (
                        <Badge variant="warning">Disabled</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <ResetMfaButton userId={profile.id} />
                      <DeleteUserButton
                        userId={profile.id}
                        disabled={isCurrentUser}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
