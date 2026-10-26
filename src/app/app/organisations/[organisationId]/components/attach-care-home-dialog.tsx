"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Link2 } from "lucide-react";
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
import { attachCareHomeToOrganisationAction } from "../lib/actions";
import { toast } from "@/components/ui/sonner";

interface StandaloneCareHome {
  id: string;
  name: string | null;
}

interface AttachCareHomeDialogProps {
  organisationId: string;
  standaloneCareHomes: StandaloneCareHome[];
}

export function AttachCareHomeDialog({
  organisationId,
  standaloneCareHomes,
}: AttachCareHomeDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [careHomeId, setCareHomeId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!careHomeId) return;
    setIsSubmitting(true);

    const result = await attachCareHomeToOrganisationAction({
      careHomeId,
      organisationId,
    });

    setIsSubmitting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Establishment attached");
    setCareHomeId("");
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="rounded-xl">
          <Link2 className="w-4 h-4 mr-2" />
          Attach existing
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Attach an existing establishment</DialogTitle>
            <DialogDescription>
              For an establishment that was set up on its own before this
              organisation decided to bring it in. It keeps all its residents
              and records - this just adds the organisation&apos;s senior
              managers as admins here too.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {standaloneCareHomes.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No standalone establishments available - everything in the
                system is already part of an organisation.
              </p>
            ) : (
              <Select value={careHomeId} onValueChange={setCareHomeId}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select an establishment" />
                </SelectTrigger>
                <SelectContent>
                  {standaloneCareHomes.map((home) => (
                    <SelectItem key={home.id} value={home.id}>
                      {home.name ?? "Unnamed establishment"}
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
              disabled={isSubmitting || !careHomeId}
              className="rounded-xl"
            >
              {isSubmitting ? "Attaching..." : "Attach"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
