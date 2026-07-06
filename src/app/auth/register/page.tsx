import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/features/auth/server";
import { signOut } from "@/features/auth/actions";
import { db } from "@/features/database";
import { getCareHomeInvitationById } from "@/features/database/queries";
import { compareTokenHash } from "@/features/email";
import { RegisterForm } from "./components/register-form";

interface RegisterPageProps {
  searchParams: Promise<{ invite?: string; token?: string }>;
}

export default async function RegisterPage({
  searchParams,
}: RegisterPageProps) {
  const { invite: invitationId, token: linkToken } = await searchParams;

  if (!invitationId || !linkToken) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold">Invalid invitation link</h1>
          <p className="text-muted-foreground">
            This registration link is missing required information. Please ask
            the care home admin to resend the invitation.
          </p>
        </div>
      </div>
    );
  }

  const invitation = await getCareHomeInvitationById(db, invitationId);

  if (!invitation) {
    notFound();
  }

  if (invitation.status !== "pending") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold">Invitation no longer valid</h1>
          <p className="text-muted-foreground">
            This invitation has already been used, revoked, or expired. Please
            ask the care home admin for a new invitation.
          </p>
        </div>
      </div>
    );
  }

  if (invitation.expiresAt && new Date(invitation.expiresAt) < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold">Invitation expired</h1>
          <p className="text-muted-foreground">
            This invitation has expired. Please ask the care home admin to send
            a new invitation.
          </p>
        </div>
      </div>
    );
  }

  if (
    !invitation.linkTokenHash ||
    !compareTokenHash(linkToken, invitation.linkTokenHash)
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold">Invalid invitation link</h1>
          <p className="text-muted-foreground">
            The security token in this link is invalid. Please ask the care home
            admin to resend the invitation.
          </p>
        </div>
      </div>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user && user.email && user.email !== invitation.invitedEmail) {
    const registerUrl = `/auth/register?invite=${invitationId}&token=${linkToken}`;
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold">Wrong account</h1>
          <p className="text-muted-foreground">
            This invitation was sent to{" "}
            <span className="font-medium">{invitation.invitedEmail}</span>. You
            are signed in as <span className="font-medium">{user.email}</span>.
          </p>
          <p className="text-muted-foreground">
            Please sign out and create an account, or sign in with the invited
            email address.
          </p>
          <div className="flex flex-col gap-2">
            <form action={signOut} className="inline">
              <input type="hidden" name="redirect" value={registerUrl} />
              <button
                type="submit"
                className="text-primary hover:underline font-[inherit] text-[length:inherit]"
              >
                Sign out and create an account
              </button>
            </form>
            <Link
              href={`/auth/login?redirect=${encodeURIComponent(`/invite/${invitationId}?token=${linkToken}`)}`}
              className="text-primary hover:underline"
            >
              Sign in with a different account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (user && user.email === invitation.invitedEmail) {
    redirect(`/invite/${invitationId}?token=${linkToken}`);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <RegisterForm
        invitationId={invitationId}
        linkToken={linkToken}
        email={invitation.invitedEmail}
      />
    </div>
  );
}
