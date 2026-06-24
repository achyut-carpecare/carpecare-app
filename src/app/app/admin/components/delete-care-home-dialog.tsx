"use client";

import { useState } from "react";
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
import { deleteCareHomeAction } from "../lib/actions";
import { toast } from "@/components/ui/sonner";

interface DeleteCareHomeDialogProps {
  careHome: { id: string; name: string | null };
}

export function DeleteCareHomeDialog({ careHome }: DeleteCareHomeDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleConfirm() {
    setIsSubmitting(true);

    const result = await deleteCareHomeAction(careHome.id);

    setIsSubmitting(false);
    setOpen(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Care home deleted");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm" className="rounded-lg">
          <Trash2 className="w-4 h-4 mr-1" />
          Delete
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>Delete care home</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete{" "}
            <strong>{careHome.name ?? "this care home"}</strong>? This cannot be
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
