"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, MoreHorizontal, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  removeMemberAction,
  resendInvitationAction,
  revokeInvitationAction,
  updateMemberRoleAction,
} from "../lib/actions";
import { toast } from "@/components/ui/sonner";
import { MemberAccessDialog } from "./member-access-dialog";

interface Member {
  id: string;
  userId: string;
  careHomeId: string;
  role: "admin" | "member" | "it_admin";
  accessMode: "home_wide" | "person_scoped";
  firstName: string | null;
  lastName: string | null;
  email: string | undefined;
}

interface Invitation {
  id: string;
  careHomeId: string;
  invitedEmail: string;
  role: "admin" | "member" | "it_admin";
  status: string;
}

interface PatientOption {
  id: string;
  firstName: string | null;
  lastName: string | null;
}

interface MembersListProps {
  members: Member[];
  invitations: Invitation[];
  // Invite/resend/revoke/remove - available to Admin and IT Admin.
  canManageAccounts: boolean;
  // Change someone's role - Admin only, IT Admin can't grant/revoke admin.
  canManageRoles: boolean;
  patients: PatientOption[];
}

export function MembersList({
  members,
  invitations,
  canManageAccounts,
  canManageRoles,
  patients,
}: MembersListProps) {
  const router = useRouter();
  const [pendingInvitationIds, setPendingInvitationIds] = useState<Set<string>>(
    new Set(),
  );

  async function handleRoleChange(
    memberId: string,
    role: "admin" | "member" | "it_admin",
  ) {
    const result = await updateMemberRoleAction({ memberId, role });
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Role updated");
    router.refresh();
  }

  async function handleRemove(memberId: string) {
    const result = await removeMemberAction(memberId);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Member removed");
    router.refresh();
  }

  async function handleResendInvitation(invitationId: string) {
    setPendingInvitationIds((prev) => new Set(prev).add(invitationId));
    const result = await resendInvitationAction(invitationId);
    setPendingInvitationIds((prev) => {
      const next = new Set(prev);
      next.delete(invitationId);
      return next;
    });

    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Invitation resent");
    router.refresh();
  }

  async function handleRevokeInvitation(invitationId: string) {
    const result = await revokeInvitationAction(invitationId);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Invitation revoked");
    router.refresh();
  }

  function formatName(first?: string | null, last?: string | null) {
    return [first, last].filter(Boolean).join(" ") || "Unknown";
  }

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Current members</h2>
        {members.length === 0 ? (
          <p className="text-sm text-muted-foreground">No members yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Access</TableHead>
                {canManageAccounts && (
                  <TableHead className="text-right">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">
                    {formatName(member.firstName, member.lastName)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {member.email ?? "—"}
                  </TableCell>
                  <TableCell>
                    {canManageRoles ? (
                      <Select
                        value={member.role}
                        onValueChange={(value) =>
                          handleRoleChange(
                            member.id,
                            value as "admin" | "member" | "it_admin",
                          )
                        }
                      >
                        <SelectTrigger className="w-32 rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="it_admin">IT Admin</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="secondary" className="capitalize">
                        {member.role.replace("_", " ")}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {member.role === "it_admin" ? (
                      <span className="text-sm text-muted-foreground">
                        Accounts only
                      </span>
                    ) : canManageAccounts ? (
                      <MemberAccessDialog
                        memberId={member.id}
                        memberName={formatName(
                          member.firstName,
                          member.lastName,
                        )}
                        accessMode={member.accessMode}
                        patients={patients}
                      />
                    ) : (
                      <Badge variant="outline" className="capitalize">
                        {member.accessMode === "home_wide"
                          ? "Everyone"
                          : "Specific residents"}
                      </Badge>
                    )}
                  </TableCell>
                  {canManageAccounts && (
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleRemove(member.id)}
                            className="text-destructive"
                          >
                            <UserX className="w-4 h-4 mr-2" />
                            Remove member
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Pending invitations</h2>
        {invitations.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No pending invitations.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                {canManageAccounts && (
                  <TableHead className="text-right">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {invitations.map((invitation) => (
                <TableRow key={invitation.id}>
                  <TableCell className="font-medium">
                    {invitation.invitedEmail}
                  </TableCell>
                  <TableCell className="capitalize">
                    {invitation.role.replace("_", " ")}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {invitation.status}
                    </Badge>
                  </TableCell>
                  {canManageAccounts && (
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              handleResendInvitation(invitation.id)
                            }
                            disabled={pendingInvitationIds.has(invitation.id)}
                          >
                            <Mail className="w-4 h-4 mr-2" />
                            {pendingInvitationIds.has(invitation.id)
                              ? "Sending..."
                              : "Resend invitation"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleRevokeInvitation(invitation.id)
                            }
                            className="text-destructive"
                          >
                            <UserX className="w-4 h-4 mr-2" />
                            Revoke invitation
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
