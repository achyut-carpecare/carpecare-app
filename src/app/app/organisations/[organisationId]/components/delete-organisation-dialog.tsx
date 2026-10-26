"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
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
import { deleteOrganisationAction } from "../lib/actions";
import { toast } from "@/components/ui/sonner";

interface DeleteOrganisationDialogProps {
  organisationId: string;
  organisationName: string;
}

export function DeleteOrganisationDialog({
  organisationId,
  organisationName,
}: DeleteOrganisationDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleConfirm() {
    setIsSubmitting(true);

    const result = await deleteOrganisationAction(organisationId);

    setIsSubmitting(false);
    setOpen(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Organisation deleted");
    router.push("/app/admin/organisations");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm" className="rounded-lg">
          <Trash2 className="w-4 h-4 mr-1" />
          Delete organisation
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>Delete {organisationName}</DialogTitle>
          <DialogDescription>
            This removes the organisation and every Organisation Admin seat.
            Establishments underneath it are <strong>not</strong> deleted - they
            become standalone and keep their residents and records, but lose the
            shared organisation-level admin access. This cannot be undone.
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
            {isSubmitting ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
