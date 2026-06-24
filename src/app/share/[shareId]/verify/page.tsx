"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { sendShareOtpAction, verifyShareOtpAction } from "../actions";

interface VerifyPageProps {
  params: Promise<{ shareId: string }>;
}

export default function VerifyPage({ params }: VerifyPageProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const shareId = params.then((p) => p.shareId);
  const linkToken = searchParams.get("token") ?? "";

  const [otp, setOtp] = useState("");
  const [sent, setSent] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSendCode() {
    setIsSending(true);
    setError(null);
    setMessage(null);

    const id = await shareId;
    const result = await sendShareOtpAction({ shareId: id, linkToken });
    setIsSending(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (result.cooldown) {
      setMessage("Please wait before requesting another code.");
    } else {
      setMessage("A verification code has been sent to your email.");
    }
    setSent(true);
  }

  async function handleResend() {
    setIsResending(true);
    setError(null);
    setMessage(null);

    const id = await shareId;
    const result = await sendShareOtpAction({ shareId: id, linkToken });
    setIsResending(false);

    if (result.error) {
      setError(result.error);
    } else {
      setMessage("A new verification code has been sent to your email.");
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const id = await shareId;
      const result = await verifyShareOtpAction({ shareId: id, otp });

      if (result.error) {
        console.error("verifyShareOtpAction returned error:", result.error);
        setError(result.error);
        setIsSubmitting(false);
        return;
      }

      router.push(`/share/${id}`);
    } catch (err) {
      console.error("verifyShareOtpAction threw:", err);
      setError("Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  }

  if (!sent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full rounded-2xl">
          <CardHeader className="text-center">
            <CardTitle>Verify your email</CardTitle>
            <CardDescription>
              A care home has shared a seizure record with you. To protect this
              health information, we will send a one-time verification code to
              the recipient email address.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <p className="text-sm text-red-600 text-center">{error}</p>
            )}
            {message && (
              <p className="text-sm text-green-600 text-center">{message}</p>
            )}
            <Button
              onClick={handleSendCode}
              disabled={isSending}
              className="w-full rounded-xl"
            >
              {isSending ? "Sending..." : "Send verification code"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="max-w-md w-full rounded-2xl">
        <CardHeader className="text-center">
          <CardTitle>Enter verification code</CardTitle>
          <CardDescription>
            Enter the 6-digit code we sent to the recipient email address.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp">Verification code</Label>
              <Input
                id="otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                maxLength={6}
                className="text-center text-2xl tracking-[0.25em] rounded-xl"
                required
              />
            </div>
            {error && (
              <p className="text-sm text-red-600 text-center">{error}</p>
            )}
            {message && (
              <p className="text-sm text-green-600 text-center">{message}</p>
            )}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl"
            >
              {isSubmitting ? "Verifying..." : "Unlock record"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isResending}
              onClick={handleResend}
              className="w-full rounded-xl"
            >
              {isResending ? "Sending..." : "Resend code"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
