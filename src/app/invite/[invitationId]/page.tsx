import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/features/auth/server";
import { signOut } from "@/features/auth/actions";
import { db } from "@/features/database";
import {
  getCareHomeInvitationById,
  acceptInvitationById,
  getOrganisationInvitationById,
  acceptOrganisationInvitationById,
} from "@/features/database/queries";
import { compareTokenHash } from "@/features/email";

interface InvitePageProps {
  params: Promise<{ invitationId: string }>;
  searchParams: Promise<{ token?: string }>;
}

function buildRegisterUrl(
  kind: "care_home" | "organisation",
  invitationId: string,
  linkToken: string,
) {
  const param = kind === "care_home" ? "invite" : "orgInvite";
  return `/auth/register?${param}=${invitationId}&token=${linkToken}`;
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

  const careHomeInvitation = await getCareHomeInvitationById(db, invitationId);
  const organisationInvitation = careHomeInvitation
    ? null
    : await getOrganisationInvitationById(db, invitationId);
  const invitation = careHomeInvitation ?? organisationInvitation;

  if (!invitation) {
    notFound();
  }

  const kind: "care_home" | "organisation" = careHomeInvitation
    ? "care_home"
    : "organisation";

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
            This invitation has expired. Please ask whoever invited you to send
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

  const registerUrl = buildRegisterUrl(kind, invitationId, linkToken);

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
            <form action={signOut} className="inline">
              <input type="hidden" name="redirect" value={inviteUrl} />
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

  if (kind === "care_home") {
    const result = await acceptInvitationById(
      db,
      invitationId,
      linkToken,
      user.id,
    );

    if ("error" in result) {
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

  const result = await acceptOrganisationInvitationById(
    db,
    invitationId,
    linkToken,
    user.id,
  );

  if ("error" in result) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold">Could not accept invitation</h1>
          <p className="text-muted-foreground">{result.error}</p>
        </div>
      </div>
    );
  }

  redirect(`/app/organisations/${result.organisationId}`);
}
