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
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  removeOrganisationMemberAction,
  resendOrganisationInvitationAction,
  revokeOrganisationInvitationAction,
} from "../lib/actions";
import { toast } from "@/components/ui/sonner";

interface OrgMember {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | undefined;
}

interface OrgInvitation {
  id: string;
  invitedEmail: string;
  status: string;
}

interface OrgMembersListProps {
  members: OrgMember[];
  invitations: OrgInvitation[];
}

function formatName(first?: string | null, last?: string | null) {
  return [first, last].filter(Boolean).join(" ") || "Unknown";
}

export function OrgMembersList({ members, invitations }: OrgMembersListProps) {
  const router = useRouter();
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [pendingInvitationIds, setPendingInvitationIds] = useState<Set<string>>(
    new Set(),
  );

  async function handleRemove(memberId: string) {
    setRemovingId(memberId);
    const result = await removeOrganisationMemberAction(memberId);
    setRemovingId(null);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Organisation Admin removed");
    router.refresh();
  }

  async function handleResendInvitation(invitationId: string) {
    setPendingInvitationIds((prev) => new Set(prev).add(invitationId));
    const result = await resendOrganisationInvitationAction(invitationId);
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
    const result = await revokeOrganisationInvitationAction(invitationId);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Invitation revoked");
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        {members.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No Organisation Admins yet.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Actions</TableHead>
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
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-xl text-destructive"
                      disabled={removingId === member.id}
                      onClick={() => handleRemove(member.id)}
                    >
                      <UserX className="w-4 h-4 mr-2" />
                      {removingId === member.id ? "Removing..." : "Remove"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {invitations.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">
            Pending invitations
          </h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invitations.map((invitation) => (
                <TableRow key={invitation.id}>
                  <TableCell className="font-medium">
                    {invitation.invitedEmail}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {invitation.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleResendInvitation(invitation.id)}
                          disabled={pendingInvitationIds.has(invitation.id)}
                        >
                          <Mail className="w-4 h-4 mr-2" />
                          {pendingInvitationIds.has(invitation.id)
                            ? "Sending..."
                            : "Resend invitation"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleRevokeInvitation(invitation.id)}
                          className="text-destructive"
                        >
                          <UserX className="w-4 h-4 mr-2" />
                          Revoke invitation
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
