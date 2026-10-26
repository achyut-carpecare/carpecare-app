"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { removeOrganisationMemberAction } from "../lib/actions";
import { toast } from "@/components/ui/sonner";

interface OrgMember {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | undefined;
}

interface OrgMembersListProps {
  members: OrgMember[];
}

function formatName(first?: string | null, last?: string | null) {
  return [first, last].filter(Boolean).join(" ") || "Unknown";
}

export function OrgMembersList({ members }: OrgMembersListProps) {
  const router = useRouter();
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function handleRemove(memberId: string) {
    setRemovingId(memberId);
    const result = await removeOrganisationMemberAction(memberId);
    setRemovingId(null);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Senior manager removed");
    router.refresh();
  }

  if (members.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No senior managers yet.</p>
    );
  }

  return (
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
  );
}
