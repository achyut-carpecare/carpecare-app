"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Link2Off } from "lucide-react";
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
import { detachCareHomeFromOrganisationAction } from "../lib/actions";
import { toast } from "@/components/ui/sonner";

interface DetachCareHomeButtonProps {
  careHomeId: string;
  careHomeName: string;
}

export function DetachCareHomeButton({
  careHomeId,
  careHomeName,
}: DetachCareHomeButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleConfirm() {
    setIsSubmitting(true);

    const result = await detachCareHomeFromOrganisationAction(careHomeId);

    setIsSubmitting(false);
    setOpen(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Establishment detached");
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-xl"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          title="Remove from organisation"
        >
          <Link2Off className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>
            Remove {careHomeName} from this organisation
          </DialogTitle>
          <DialogDescription>
            {careHomeName} becomes a standalone establishment again - it keeps
            all its residents and records. Senior managers here lose admin
            access to it unless they&apos;re also a direct member.
          </DialogDescription>
        </DialogHeader>
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
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="rounded-xl"
          >
            {isSubmitting ? "Removing..." : "Remove"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
