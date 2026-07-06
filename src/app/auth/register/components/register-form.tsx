"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import { registerWithInvitationAction } from "../actions";

interface RegisterFormProps {
  invitationId: string;
  linkToken: string;
  email: string;
}

const MIN_PASSWORD_LENGTH = 8;

export function RegisterForm({
  invitationId,
  linkToken,
  email,
}: RegisterFormProps) {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    password?: string;
    confirmPassword?: string;
  }>({});

  function validate(): boolean {
    const nextErrors: { password?: string; confirmPassword?: string } = {};

    if (password.length < MIN_PASSWORD_LENGTH) {
      nextErrors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
    }

    if (password !== confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match";
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    const result = await registerWithInvitationAction({
      invitationId,
      linkToken,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      password,
    });

    if ("existingAccount" in result && result.existingAccount) {
      setError(result.error);
      setIsSubmitting(false);
      router.push(
        `/auth/login?redirect=${encodeURIComponent(`/invite/${invitationId}?token=${linkToken}`)}`,
      );
      return;
    }

    if (result.error) {
      setError(result.error);
      setIsSubmitting(false);
      return;
    }
  }

  return (
    <Card className="w-full max-w-md rounded-2xl">
      <CardHeader className="text-center">
        <CardTitle>Create your account</CardTitle>
        <CardDescription>
          You have been invited to join a care home on Carpe Care. Complete the
          form below to get started.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              disabled
              readOnly
              className="rounded-xl"
            />
            <p className="text-xs text-muted-foreground">
              This email is tied to your invitation and cannot be changed.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First name</Label>
              <Input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Jane"
                required
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
                required
                className="rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setFieldErrors((prev) => ({ ...prev, password: undefined }));
              }}
              placeholder="••••••••"
              required
              minLength={MIN_PASSWORD_LENGTH}
              aria-invalid={!!fieldErrors.password}
              className="rounded-xl"
            />
            {fieldErrors.password && (
              <p className="text-xs text-destructive">{fieldErrors.password}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setFieldErrors((prev) => ({
                  ...prev,
                  confirmPassword: undefined,
                }));
              }}
              placeholder="••••••••"
              required
              aria-invalid={!!fieldErrors.confirmPassword}
              className="rounded-xl"
            />
            {fieldErrors.confirmPassword && (
              <p className="text-xs text-destructive">
                {fieldErrors.confirmPassword}
              </p>
            )}
          </div>

          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

          <Button
            type="submit"
            className="w-full rounded-xl"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating account..." : "Create account & join"}
          </Button>

          <p className="text-sm text-center text-muted-foreground">
            Already have an account?{" "}
            <Link
              href={`/auth/login?redirect=${encodeURIComponent(`/invite/${invitationId}?token=${linkToken}`)}`}
              className="text-primary hover:underline"
            >
              Sign in
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
