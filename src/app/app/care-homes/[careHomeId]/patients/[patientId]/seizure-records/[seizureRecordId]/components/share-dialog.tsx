"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";
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
import { createSeizureRecordShareAction } from "../lib/actions";
import { toast } from "@/components/ui/sonner";

interface ShareDialogProps {
  seizureRecordId: string;
}

export function ShareDialog({ seizureRecordId }: ShareDialogProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [expiresInDays, setExpiresInDays] = useState("7");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);

    const result = await createSeizureRecordShareAction({
      seizureRecordId,
      recipientEmail: email,
      expiresInDays: Number(expiresInDays),
    });

    setIsSubmitting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    if (result.share) {
      setSentTo(result.share.recipientEmail ?? email);
      toast.success("Secure link sent to recipient");
    }
  }

  function handleClose() {
    setOpen(false);
    // Reset form state after the dialog animation finishes.
    setTimeout(() => {
      setEmail("");
      setExpiresInDays("7");
      setSentTo(null);
    }, 200);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="rounded-xl">
          <Share2 className="w-4 h-4 mr-2" />
          Share with medic
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Share with medic</DialogTitle>
            <DialogDescription>
              Create a secure, read-only link for this seizure record and email
              it directly to the recipient.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {sentTo ? (
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Check className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-center space-y-1">
                  <p className="font-medium">Secure link sent</p>
                  <p className="text-sm text-muted-foreground">
                    A verification-protected link has been emailed to{" "}
                    <strong>{sentTo}</strong>.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email">Recipient email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="dr.rivera@example.com"
                    className="rounded-xl"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expires">Expires in (days)</Label>
                  <Input
                    id="expires"
                    type="number"
                    min={1}
                    max={30}
                    value={expiresInDays}
                    onChange={(e) => setExpiresInDays(e.target.value)}
                    className="rounded-xl"
                    required
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="rounded-xl"
            >
              {sentTo ? "Close" : "Cancel"}
            </Button>
            {!sentTo && (
              <Button
                type="submit"
                disabled={isSubmitting || !email.trim()}
                className="rounded-xl"
              >
                {isSubmitting ? "Sending..." : "Send secure link"}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
