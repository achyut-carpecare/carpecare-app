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
import { deleteSeizureRecordAction } from "../lib/actions";
import { toast } from "@/components/ui/sonner";

interface DeleteSeizureRecordButtonProps {
  careHomeId: string;
  patientId: string;
  seizureRecordId: string;
}

export function DeleteSeizureRecordButton({
  careHomeId,
  patientId,
  seizureRecordId,
}: DeleteSeizureRecordButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleConfirm() {
    setIsSubmitting(true);

    const result = await deleteSeizureRecordAction({
      careHomeId,
      patientId,
      seizureRecordId,
    });

    setIsSubmitting(false);

    if (result?.error) {
      setOpen(false);
      toast.error(result.error);
      return;
    }

    router.push(`/app/care-homes/${careHomeId}/patients/${patientId}`);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" className="rounded-xl">
          <Trash2 className="w-4 h-4 mr-2" />
          Delete
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>Delete seizure record</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this seizure record? This cannot be
            undone.
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
