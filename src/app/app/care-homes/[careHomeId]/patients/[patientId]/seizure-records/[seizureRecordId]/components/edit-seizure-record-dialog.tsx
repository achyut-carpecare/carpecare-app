"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { SEIZURE_TYPES } from "@/features/seizure-records/constants";
import { updateSeizureRecordAction } from "../lib/actions";
import { toast } from "@/components/ui/sonner";

function toLocalDateTimeInputValue(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

interface EditSeizureRecordDialogProps {
  careHomeId: string;
  patientId: string;
  seizureRecordId: string;
  initial: {
    recordedAt: string | null;
    durationSeconds: number | null;
    seizureType: string | null;
    notes: string | null;
  };
}

function getSeizureTypeSelectValue(initialType: string | null): string {
  if (!initialType) return "";
  if (SEIZURE_TYPES.includes(initialType as (typeof SEIZURE_TYPES)[number])) {
    return initialType;
  }
  return "Other";
}

export function EditSeizureRecordDialog({
  careHomeId,
  patientId,
  seizureRecordId,
  initial,
}: EditSeizureRecordDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const initialSeizureTypeSelectValue = getSeizureTypeSelectValue(
    initial.seizureType,
  );
  const isOther = initialSeizureTypeSelectValue === "Other";

  const [formData, setFormData] = useState({
    recordedAt: initial.recordedAt
      ? toLocalDateTimeInputValue(new Date(initial.recordedAt))
      : toLocalDateTimeInputValue(new Date()),
    durationSeconds: initial.durationSeconds?.toString() ?? "",
    seizureType: initialSeizureTypeSelectValue,
    seizureTypeOther: isOther ? (initial.seizureType ?? "") : "",
    notes: initial.notes ?? "",
  });

  const resolvedSeizureType =
    formData.seizureType === "Other"
      ? formData.seizureTypeOther.trim()
      : formData.seizureType;

  function updateField<K extends keyof typeof formData>(
    field: K,
    value: (typeof formData)[K],
  ) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);

    const result = await updateSeizureRecordAction({
      careHomeId,
      patientId,
      seizureRecordId,
      recordedAt: new Date(formData.recordedAt).toISOString(),
      durationSeconds: Number(formData.durationSeconds),
      seizureType: resolvedSeizureType,
      notes: formData.notes,
    });

    setIsSubmitting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Seizure record updated");
    setOpen(false);
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      setFormData({
        recordedAt: initial.recordedAt
          ? toLocalDateTimeInputValue(new Date(initial.recordedAt))
          : toLocalDateTimeInputValue(new Date()),
        durationSeconds: initial.durationSeconds?.toString() ?? "",
        seizureType: initialSeizureTypeSelectValue,
        seizureTypeOther: isOther ? (initial.seizureType ?? "") : "",
        notes: initial.notes ?? "",
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="rounded-xl">
          <Pencil className="w-4 h-4 mr-2" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg rounded-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit event</DialogTitle>
            <DialogDescription>
              Update the date, duration, type, and notes for this seizure
              record.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="recordedAt">Date & time</Label>
                <Input
                  id="recordedAt"
                  type="datetime-local"
                  value={formData.recordedAt}
                  onChange={(e) => updateField("recordedAt", e.target.value)}
                  className="rounded-xl"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (seconds)</Label>
                <Input
                  id="duration"
                  type="number"
                  min={1}
                  value={formData.durationSeconds}
                  onChange={(e) =>
                    updateField("durationSeconds", e.target.value)
                  }
                  placeholder="e.g. 83"
                  className="rounded-xl"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Seizure type</Label>
              <Select
                value={formData.seizureType}
                onValueChange={(value) => updateField("seizureType", value)}
              >
                <SelectTrigger id="type" className="w-full rounded-xl">
                  <SelectValue placeholder="Select a seizure type" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  {SEIZURE_TYPES.map((type) => (
                    <SelectItem key={type} value={type} className="rounded-xl">
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.seizureType === "Other" && (
              <div className="space-y-2">
                <Label htmlFor="typeOther">Other seizure type</Label>
                <Input
                  id="typeOther"
                  value={formData.seizureTypeOther}
                  onChange={(e) =>
                    updateField("seizureTypeOther", e.target.value)
                  }
                  placeholder="Describe the seizure type"
                  className="rounded-xl"
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => updateField("notes", e.target.value)}
                placeholder="What happened? How did recovery go?"
                className="rounded-xl min-h-[120px]"
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
              disabled={isSubmitting || !resolvedSeizureType}
              className="rounded-xl"
            >
              {isSubmitting ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
