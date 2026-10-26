"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addOrganisationMemberAction } from "../lib/actions";
import { toast } from "@/components/ui/sonner";

interface Candidate {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | undefined;
}

interface AddOrgMemberDialogProps {
  organisationId: string;
  candidates: Candidate[];
}

function formatCandidateName(candidate: Candidate) {
  const name = [candidate.firstName, candidate.lastName]
    .filter(Boolean)
    .join(" ");
  if (name && candidate.email) return `${name} (${candidate.email})`;
  return name || candidate.email || "Unknown";
}

export function AddOrgMemberDialog({
  organisationId,
  candidates,
}: AddOrgMemberDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!userId) return;
    setIsSubmitting(true);

    const result = await addOrganisationMemberAction({
      organisationId,
      userId,
    });

    setIsSubmitting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Senior manager added");
    setUserId("");
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="rounded-xl">
          <UserPlus className="w-4 h-4 mr-2" />
          Add senior manager
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add senior manager</DialogTitle>
            <DialogDescription>
              Pick someone who already manages an establishment in this
              organisation. They&apos;ll get admin rights across every home
              here, immediately, without a second login.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {candidates.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nobody to promote yet - everyone with Admin rights at a home
                here is already a senior manager. Make someone an Admin at one
                of this organisation&apos;s homes first.
              </p>
            ) : (
              <Select value={userId} onValueChange={setUserId}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select a person" />
                </SelectTrigger>
                <SelectContent>
                  {candidates.map((candidate) => (
                    <SelectItem key={candidate.id} value={candidate.id}>
                      {formatCandidateName(candidate)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !userId}
              className="rounded-xl"
            >
              {isSubmitting ? "Adding..." : "Add"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
