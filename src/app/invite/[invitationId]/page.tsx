import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/features/auth/server";
import { signOut } from "@/features/auth/actions";
import { db } from "@/features/database";
import {
  getCareHomeInvitationById,
  acceptInvitationById,
} from "@/features/database/queries";
import { compareTokenHash } from "@/features/email";

interface InvitePageProps {
  params: Promise<{ invitationId: string }>;
  searchParams: Promise<{ token?: string }>;
}

function buildRegisterUrl(invitationId: string, linkToken: string) {
  return `/auth/register?invite=${invitationId}&token=${linkToken}`;
}

export default async function InvitePage({
  params,
  searchParams,
}: InvitePageProps) {
  const { invitationId } = await params;
  const { token: linkToken } = await searchParams;

  if (!linkToken) {
    notFound();
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
            This invitation has already been used, revoked, or expired.
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
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const registerUrl = buildRegisterUrl(invitationId, linkToken);

  if (!user) {
    redirect(registerUrl);
  }

  if (user.email !== invitation.invitedEmail) {
    const inviteUrl = `/invite/${invitationId}?token=${linkToken}`;
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold">Invitation for another account</h1>
          <p className="text-muted-foreground">
            This invitation was sent to{" "}
            <span className="font-medium">{invitation.invitedEmail}</span>. You
            are signed in as{" "}
            <span className="font-medium">{user.email ?? "this account"}</span>.
          </p>
          <p className="text-muted-foreground">
            Please sign in with the invited email address, or sign out and
            create an account.
          </p>
          <div className="flex flex-col gap-2">
            <Link
              href={`/auth/login?redirect=${encodeURIComponent(inviteUrl)}`}
              className="text-primary hover:underline"
            >
              Sign in with the invited email
            </Link>
            <form action={signOut.bind(null, inviteUrl)} className="inline">
              <button
                type="submit"
                className="text-primary hover:underline font-[inherit] text-[length:inherit]"
              >
                Sign out and create an account
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const result = await acceptInvitationById(
    db,
    invitationId,
    linkToken,
    user.id,
  );

  if (result.error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold">Could not accept invitation</h1>
          <p className="text-muted-foreground">{result.error}</p>
        </div>
      </div>
    );
  }

  redirect(`/app/care-homes/${result.careHomeId}`);
}
