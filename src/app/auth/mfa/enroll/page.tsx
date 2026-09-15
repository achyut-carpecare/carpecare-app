"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/features/auth/client";
import { signOut } from "@/features/auth/actions";
import { generateRecoveryCodesAction } from "@/features/auth/mfa-actions";
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

const CODE_LENGTH = 6;

export default function MfaEnrollPage() {
  const router = useRouter();
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const hasStarted = useRef(false);

  useEffect(() => {
    // Guards against React's dev-mode double-invoke of effects, which would
    // otherwise fire two concurrent enroll() calls and collide on Supabase's
    // per-user factor name uniqueness constraint.
    if (hasStarted.current) return;
    hasStarted.current = true;

    let cancelled = false;

    async function unenrollAbandoned(
      supabase: ReturnType<typeof createClient>,
    ) {
      const { data: factorsData } = await supabase.auth.mfa.listFactors();
      // Supabase's `totp` array only ever contains verified factors -
      // unverified ones only show up in `all`.
      const abandoned = factorsData?.all.filter(
        (f) => f.factor_type === "totp" && f.status === "unverified",
      );
      for (const factor of abandoned ?? []) {
        await supabase.auth.mfa.unenroll({ factorId: factor.id });
      }
    }

    async function init() {
      const supabase = createClient();

      await unenrollAbandoned(supabase);

      let { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: "totp",
      });

      if (enrollError) {
        // Most likely a leftover unverified factor we didn't just create
        // (e.g. an interrupted session from earlier). Clean up and retry
        // once before giving up.
        await unenrollAbandoned(supabase);
        ({ data, error: enrollError } = await supabase.auth.mfa.enroll({
          factorType: "totp",
        }));
      }

      if (cancelled) return;

      if (enrollError || !data) {
        setError(enrollError?.message ?? "Failed to start MFA enrollment");
        setLoading(false);
        return;
      }

      setFactorId(data.id);
      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setLoading(false);
    }

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!factorId) return;

    setSubmitting(true);
    setError("");

    const supabase = createClient();

    const { data: challenge, error: challengeError } =
      await supabase.auth.mfa.challenge({ factorId });

    if (challengeError) {
      setError(challengeError.message);
      setSubmitting(false);
      return;
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code,
    });

    if (verifyError) {
      setError(verifyError.message);
      setSubmitting(false);
      return;
    }

    const result = await generateRecoveryCodesAction();
    if (result.error || !result.codes) {
      setError(
        result.error ??
          "Two-factor login is set up, but we couldn't generate backup codes. Continue to the app and contact an admin.",
      );
      setSubmitting(false);
      return;
    }

    setBackupCodes(result.codes);
    setSubmitting(false);
  }

  function handleContinue() {
    router.push("/app");
  }

  if (backupCodes) {
    return (
      <div className="min-h-full flex items-center justify-center p-6">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Save your backup codes</CardTitle>
            <CardDescription>
              If you ever lose access to your authenticator app, you can use one
              of these codes to sign in instead. Each code works once. Store
              them somewhere safe - this is the only time they&apos;ll be shown.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2 font-mono text-sm bg-muted rounded-xl p-4">
              {backupCodes.map((backupCode) => (
                <div key={backupCode} className="text-center">
                  {backupCode}
                </div>
              ))}
            </div>

            <Button onClick={handleContinue} className="w-full">
              I&apos;ve saved these - continue to Carpe Care
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-full flex items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Set up two-factor login</CardTitle>
          <CardDescription>
            A verification code is now required every time you sign in. Scan
            this QR code with an authenticator app (Google Authenticator, Authy,
            1Password, etc.) to get started.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="text-sm text-muted-foreground text-center py-8">
              Preparing your setup code...
            </div>
          ) : qrCode ? (
            <>
              <div className="flex justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrCode}
                  alt="Scan this QR code with your authenticator app"
                  className="w-48 h-48 border border-border rounded-xl bg-white p-2"
                />
              </div>

              {secret && (
                <p className="text-xs text-muted-foreground text-center break-all">
                  Can&apos;t scan? Enter this code manually: <br />
                  <span className="font-mono">{secret}</span>
                </p>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code">6-digit code</Label>
                  <Input
                    id="code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={CODE_LENGTH}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    required
                  />
                </div>

                {error && (
                  <p className="text-sm text-destructive text-center">
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={submitting || code.length !== CODE_LENGTH}
                >
                  {submitting ? "Verifying..." : "Verify and continue"}
                </Button>
              </form>
            </>
          ) : (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

          <form action={signOut} className="text-center">
            <input type="hidden" name="redirect" value="/auth/login" />
            <button
              type="submit"
              className="text-sm text-muted-foreground hover:underline"
            >
              Sign out
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
