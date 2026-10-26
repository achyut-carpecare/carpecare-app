"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { inviteOrganisationAdminAction } from "../lib/actions";
import { toast } from "@/components/ui/sonner";

interface InviteOrgAdminDialogProps {
  organisationId: string;
}

export function InviteOrgAdminDialog({
  organisationId,
}: InviteOrgAdminDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);

    const result = await inviteOrganisationAdminAction({
      organisationId,
      email,
    });

    setIsSubmitting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Invitation sent");
    setEmail("");
    setOpen(false);
    router.refresh();
  }

  const canSubmit = email.trim().includes("@");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="rounded-xl">
          <Mail className="w-4 h-4 mr-2" />
          Invite by email
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Invite an Organisation Admin</DialogTitle>
            <DialogDescription>
              Send a secure email invitation to anyone, even if they don&apos;t
              have a Carpe Care account yet. They&apos;ll get admin rights
              across every establishment in this organisation once they accept.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="manager@example.com"
                className="rounded-xl"
                required
              />
            </div>
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
              disabled={isSubmitting || !canSubmit}
              className="rounded-xl"
            >
              {isSubmitting ? "Sending..." : "Send invitation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
