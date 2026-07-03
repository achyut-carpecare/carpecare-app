"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, FileText, Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VideoTrimmer } from "./components/video-trimmer";
import { SEIZURE_TYPES } from "@/features/seizure-records/constants";
import { createSeizureRecordAction } from "./lib/actions";
import { uploadVideoFile } from "@/features/storage/actions";
import { toast } from "@/components/ui/sonner";

interface NewSeizureRecordPageProps {
  params: Promise<{ careHomeId: string; patientId: string }>;
}

export default function NewSeizureRecordPage({
  params,
}: NewSeizureRecordPageProps) {
  const { careHomeId, patientId } = use(params);
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [trimmedFile, setTrimmedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    recordedAt: new Date().toISOString().slice(0, 16),
    durationSeconds: "",
    seizureType: "",
    seizureTypeOther: "",
    notes: "",
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

  function handleTrimComplete(file: File) {
    setTrimmedFile(file);
    toast.success("Video trimmed and ready");
  }

  async function handleSubmit() {
    setIsSubmitting(true);
    setIsUploading(true);

    let videoId: string | undefined;

    if (trimmedFile) {
      const formData = new FormData();
      formData.set("video", trimmedFile);
      const uploadResult = await uploadVideoFile(formData);
      setIsUploading(false);

      if (uploadResult.error) {
        setIsSubmitting(false);
        toast.error(uploadResult.error);
        return;
      }

      videoId = uploadResult.fileId;
    } else {
      setIsUploading(false);
    }

    const result = await createSeizureRecordAction({
      patientId,
      recordedAt: new Date(formData.recordedAt).toISOString(),
      durationSeconds: Number(formData.durationSeconds),
      seizureType: resolvedSeizureType,
      notes: formData.notes,
      videoId,
    });

    setIsSubmitting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    if (result.record) {
      toast.success("Seizure event recorded");
      router.push(
        `/app/care-homes/${careHomeId}/patients/${patientId}/seizure-records/${result.record.id}`,
      );
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        href={`/app/care-homes/${careHomeId}/patients/${patientId}`}
        className="inline-flex items-center text-sm font-semibold text-primary hover:underline"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to resident
      </Link>

      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Record event</h1>
        <p className="text-muted-foreground">Step {step} of 3</p>
      </div>

      {step === 1 && (
        <Card className="rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Scissors className="w-5 h-5 text-primary" />
              Pick and trim video
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <VideoTrimmer onTrimComplete={handleTrimComplete} />
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setTrimmedFile(null);
                  setStep(2);
                }}
                className="rounded-xl"
              >
                Continue without video
              </Button>
              <Button
                onClick={() => setStep(2)}
                disabled={!trimmedFile}
                className="rounded-xl"
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card className="rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="w-5 h-5 text-primary" />
              Event details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="recordedAt">Date & time</Label>
                <Input
                  id="recordedAt"
                  type="datetime-local"
                  value={formData.recordedAt}
                  onChange={(e) => updateField("recordedAt", e.target.value)}
                  className="rounded-xl"
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
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="rounded-xl"
              >
                Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={!resolvedSeizureType}
                className="rounded-xl"
              >
                Review
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card className="rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Check className="w-5 h-5 text-primary" />
              Review and save
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted rounded-xl p-4 space-y-2 text-sm">
              <div>
                <span className="font-semibold">Date & time:</span>{" "}
                {new Date(formData.recordedAt).toLocaleString("en-GB")}
              </div>
              <div>
                <span className="font-semibold">Duration:</span>{" "}
                {formData.durationSeconds
                  ? `${formData.durationSeconds}s`
                  : "—"}
              </div>
              <div>
                <span className="font-semibold">Type:</span>{" "}
                {resolvedSeizureType || "—"}
              </div>
              <div>
                <span className="font-semibold">Notes:</span>{" "}
                {formData.notes || "—"}
              </div>
              <div>
                <span className="font-semibold">Video:</span>{" "}
                {trimmedFile ? trimmedFile.name : "No video attached"}
              </div>
            </div>
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setStep(2)}
                className="rounded-xl"
              >
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || isUploading}
                className="rounded-xl"
              >
                {isUploading
                  ? "Uploading video..."
                  : isSubmitting
                    ? "Saving..."
                    : "Save event"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
