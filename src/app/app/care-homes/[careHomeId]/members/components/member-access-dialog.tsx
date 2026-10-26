"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "@/components/ui/sonner";
import {
  getMemberPatientAccessAction,
  updateMemberAccessAction,
} from "../lib/actions";

interface PatientOption {
  id: string;
  firstName: string | null;
  lastName: string | null;
}

interface MemberAccessDialogProps {
  memberId: string;
  memberName: string;
  accessMode: "home_wide" | "person_scoped";
  patients: PatientOption[];
}

function formatPatientName(patient: PatientOption) {
  return (
    [patient.firstName, patient.lastName].filter(Boolean).join(" ") ||
    "Unnamed resident"
  );
}

export function MemberAccessDialog({
  memberId,
  memberName,
  accessMode: initialAccessMode,
  patients,
}: MemberAccessDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [accessMode, setAccessMode] = useState(initialAccessMode);
  const [selectedPatientIds, setSelectedPatientIds] = useState<Set<string>>(
    new Set(),
  );

  async function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) return;

    setAccessMode(initialAccessMode);
    setLoading(true);
    const result = await getMemberPatientAccessAction(memberId);
    setLoading(false);

    if (result.error) {
      toast.error(result.error);
      setOpen(false);
      return;
    }

    setSelectedPatientIds(new Set(result.patientIds));
  }

  function togglePatient(patientId: string, checked: boolean) {
    setSelectedPatientIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(patientId);
      } else {
        next.delete(patientId);
      }
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    const result = await updateMemberAccessAction({
      memberId,
      accessMode,
      patientIds: Array.from(selectedPatientIds),
    });
    setSaving(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Access updated");
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Button
        variant="ghost"
        size="sm"
        className="rounded-xl"
        onClick={() => handleOpenChange(true)}
      >
        <ShieldCheck className="w-4 h-4 mr-2" />
        Manage access
      </Button>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>Access for {memberName}</DialogTitle>
          <DialogDescription>
            Choose whether {memberName} sees every resident at this
            establishment, or only specific people.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Loading...
          </p>
        ) : (
          <div className="space-y-4 py-2">
            <RadioGroup
              value={accessMode}
              onValueChange={(value) =>
                setAccessMode(value as "home_wide" | "person_scoped")
              }
            >
              <div className="flex items-start gap-3 rounded-xl border p-3">
                <RadioGroupItem value="home_wide" id="home_wide" />
                <Label htmlFor="home_wide" className="font-normal">
                  <span className="font-medium block">
                    Every resident at this establishment
                  </span>
                  <span className="text-sm text-muted-foreground">
                    The default - matches a typical care home carer.
                  </span>
                </Label>
              </div>
              <div className="flex items-start gap-3 rounded-xl border p-3">
                <RadioGroupItem value="person_scoped" id="person_scoped" />
                <Label htmlFor="person_scoped" className="font-normal">
                  <span className="font-medium block">
                    Only specific residents
                  </span>
                  <span className="text-sm text-muted-foreground">
                    For a domiciliary carer, trainee, or agency worker who
                    shouldn&apos;t see everyone.
                  </span>
                </Label>
              </div>
            </RadioGroup>

            {accessMode === "person_scoped" && (
              <div className="space-y-2 max-h-56 overflow-y-auto rounded-xl border p-3">
                {patients.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No residents yet.
                  </p>
                ) : (
                  patients.map((patient) => (
                    <div key={patient.id} className="flex items-center gap-2.5">
                      <Checkbox
                        id={`patient-${patient.id}`}
                        checked={selectedPatientIds.has(patient.id)}
                        onCheckedChange={(checked) =>
                          togglePatient(patient.id, checked === true)
                        }
                      />
                      <Label
                        htmlFor={`patient-${patient.id}`}
                        className="font-normal"
                      >
                        {formatPatientName(patient)}
                      </Label>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

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
            onClick={handleSave}
            disabled={loading || saving}
            className="rounded-xl"
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
