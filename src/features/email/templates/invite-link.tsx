import { Button, Heading, Section, Text } from "@react-email/components";
import { BaseEmail, emailStyles } from "./base";

interface InvitationEmailProps {
  careHomeName: string;
  inviterName: string;
  role: string;
  inviteUrl: string;
  expiresAt: string;
}

export function InvitationEmail({
  careHomeName,
  inviterName,
  role,
  inviteUrl,
  expiresAt,
}: InvitationEmailProps) {
  const preview = `${inviterName} has invited you to join ${careHomeName} on Carpe Care.`;
  const roleLabel = role === "admin" ? "care home admin" : "team member";

  return (
    <BaseEmail
      preview={preview}
      footer={`Sent by Carpe Care · You're receiving this because you were invited to join ${careHomeName}.`}
    >
      <Heading as="h1" style={emailStyles.h1}>
        You&apos;re invited to join {careHomeName}
      </Heading>
      <Text style={emailStyles.text}>
        {inviterName} has invited you to join {careHomeName} as a {roleLabel}.
        Click the button below to accept the invitation.
      </Text>
      <Section style={emailStyles.buttonContainer}>
        <Button href={inviteUrl} style={emailStyles.button}>
          Accept invitation
        </Button>
      </Section>
      <Text style={emailStyles.text}>
        This invitation expires on {expiresAt}. Click the button above to create
        your account and join the care home.
      </Text>
      <Text style={emailStyles.footer}>
        If you were not expecting this email, you can safely ignore it.
      </Text>
    </BaseEmail>
  );
}
