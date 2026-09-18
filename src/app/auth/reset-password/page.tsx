"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/features/auth/client";
import { updatePasswordAction } from "@/features/auth/actions";
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

const MIN_PASSWORD_LENGTH = 8;
const CODE_LENGTH = 6;

type Phase = "loading" | "mfa" | "backup" | "password";

export default function ResetPasswordPage() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [factorId, setFactorId] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [backupCode, setBackupCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const supabase = createClient();
      const { data, error: factorsError } =
        await supabase.auth.mfa.listFactors();

      if (cancelled) return;

      if (factorsError) {
        setError(factorsError.message);
        setPhase("password");
        return;
      }

      const verified = data?.totp.find((f) => f.status === "verified");

      if (!verified) {
        setPhase("password");
        return;
      }

      const { data: challenge, error: challengeError } =
        await supabase.auth.mfa.challenge({ factorId: verified.id });

      if (cancelled) return;

      if (challengeError) {
        setError(challengeError.message);
        setPhase("password");
        return;
      }

      setFactorId(verified.id);
      setChallengeId(challenge.id);
      setPhase("mfa");
    }

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleMfaSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!factorId || !challengeId) return;

    setPending(true);
    setError("");

    const supabase = createClient();
    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId,
      code: mfaCode,
    });

    setPending(false);

    if (verifyError) {
      setError(verifyError.message);
      return;
    }

    setPhase("password");
  }

  async function handleBackupSubmit(event: React.FormEvent) {
    event.preventDefault();

    setPending(true);
    setError("");

    const result = await redeemBackupCodeAction(backupCode);

    setPending(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    // The factor was removed server-side, so MFA no longer blocks the
    // password update. They'll be walked through fresh enrollment next
    // time they sign in.
    setPhase("password");
  }

  async function handlePasswordSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setPending(true);
    const formData = new FormData();
    formData.set("password", password);

    const result = await updatePasswordAction(formData);
    if (result?.error) {
      setError(result.error);
      setPending(false);
    }
    // On success, the server action redirects.
  }

  if (phase === "loading") {
    return (
      <div className="min-h-full flex items-center justify-center p-6">
        <Card className="w-full max-w-sm">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Preparing...
          </CardContent>
        </Card>
      </div>
    );
  }

  if (phase === "mfa") {
    return (
      <div className="min-h-full flex items-center justify-center p-6">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Verify it&apos;s you</CardTitle>
            <CardDescription>
              Enter the 6-digit code from your authenticator app before setting
              a new password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleMfaSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mfaCode">6-digit code</Label>
                <Input
                  id="mfaCode"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={CODE_LENGTH}
                  value={mfaCode}
                  onChange={(e) =>
                    setMfaCode(e.target.value.replace(/\D/g, ""))
                  }
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
                disabled={pending || mfaCode.length !== CODE_LENGTH}
              >
                {pending ? "Verifying..." : "Verify"}
              </Button>

              <button
                type="button"
                onClick={() => {
                  setPhase("backup");
                  setError("");
                }}
                className="block w-full text-center text-sm text-muted-foreground hover:underline"
              >
                Use a backup code instead
              </button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (phase === "backup") {
    return (
      <div className="min-h-full flex items-center justify-center p-6">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Use a backup code</CardTitle>
            <CardDescription>
              Enter one of the backup codes you saved when you set up two-factor
              login.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleBackupSubmit} className="space-y-4">
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
                disabled={pending || !backupCode.trim()}
              >
                {pending ? "Verifying..." : "Verify"}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Using a backup code will remove your current authenticator and
                ask you to set up a new one after you sign in.
              </p>

              <button
                type="button"
                onClick={() => {
                  setPhase("mfa");
                  setError("");
                }}
                className="block w-full text-center text-sm text-muted-foreground hover:underline"
              >
                Back to authenticator code
              </button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-full flex items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Set a new password</CardTitle>
          <CardDescription>
            Choose a new password for your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={MIN_PASSWORD_LENGTH}
                autoComplete="new-password"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="new-password"
              />
            </div>

            {error && (
              <p className="text-sm text-destructive text-center">
                {error}{" "}
                {error.includes("expired") && (
                  <Link href="/auth/forgot-password" className="underline">
                    Request a new link
                  </Link>
                )}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Saving..." : "Save new password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
