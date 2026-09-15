"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/features/auth/client";
import { signOut } from "@/features/auth/actions";
import { redeemBackupCodeAction } from "@/features/auth/mfa-actions";
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

export default function MfaVerifyPage() {
  const router = useRouter();
  const [factorId, setFactorId] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"totp" | "backup">("totp");
  const [backupCode, setBackupCode] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const supabase = createClient();

      const { data, error: factorsError } =
        await supabase.auth.mfa.listFactors();

      if (cancelled) return;

      if (factorsError) {
        setError(factorsError.message);
        setLoading(false);
        return;
      }

      const verified = data?.totp.find((f) => f.status === "verified");

      if (!verified) {
        router.replace("/auth/mfa/enroll");
        return;
      }

      setFactorId(verified.id);

      const { data: challenge, error: challengeError } =
        await supabase.auth.mfa.challenge({ factorId: verified.id });

      if (cancelled) return;

      if (challengeError) {
        setError(challengeError.message);
        setLoading(false);
        return;
      }

      setChallengeId(challenge.id);
      setLoading(false);
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!factorId || !challengeId) return;

    setSubmitting(true);
    setError("");

    const supabase = createClient();
    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId,
      code,
    });

    if (verifyError) {
      setError(verifyError.message);
      setSubmitting(false);
      return;
    }

    router.push("/app");
  }

  async function handleBackupCodeSubmit(event: React.FormEvent) {
    event.preventDefault();

    setSubmitting(true);
    setError("");

    const result = await redeemBackupCodeAction(backupCode);

    if (result.error) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    // The matching TOTP factor was removed server-side, so the next load of
    // /app will route through middleware straight to fresh enrollment.
    router.push("/app");
  }

  return (
    <div className="min-h-full flex items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Verify it&apos;s you</CardTitle>
          <CardDescription>
            {mode === "totp"
              ? "Enter the 6-digit code from your authenticator app to finish signing in."
              : "Enter one of the backup codes you saved when you set up two-factor login."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="text-sm text-muted-foreground text-center py-8">
              Preparing verification...
            </div>
          ) : mode === "totp" ? (
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
                  autoFocus
                  required
                />
              </div>

              {error && (
                <p className="text-sm text-destructive text-center">{error}</p>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={submitting || code.length !== CODE_LENGTH}
              >
                {submitting ? "Verifying..." : "Verify"}
              </Button>

              <button
                type="button"
                onClick={() => {
                  setMode("backup");
                  setError("");
                }}
                className="block w-full text-center text-sm text-muted-foreground hover:underline"
              >
                Use a backup code instead
              </button>
            </form>
          ) : (
            <form onSubmit={handleBackupCodeSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="backupCode">Backup code</Label>
                <Input
                  id="backupCode"
                  type="text"
                  autoComplete="one-time-code"
                  value={backupCode}
                  onChange={(e) => setBackupCode(e.target.value)}
                  placeholder="XXXXX-XXXXX"
                  autoFocus
                  required
                />
              </div>

              {error && (
                <p className="text-sm text-destructive text-center">{error}</p>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={submitting || !backupCode.trim()}
              >
                {submitting ? "Verifying..." : "Verify"}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Using a backup code will remove your current authenticator and
                ask you to set up a new one.
              </p>

              <button
                type="button"
                onClick={() => {
                  setMode("totp");
                  setError("");
                }}
                className="block w-full text-center text-sm text-muted-foreground hover:underline"
              >
                Back to authenticator code
              </button>
            </form>
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
