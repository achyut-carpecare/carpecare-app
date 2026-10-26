import { Button, Heading, Section, Text } from "@react-email/components";
import { BaseEmail, emailStyles } from "./base";

interface OrganisationInviteEmailProps {
  organisationName: string;
  inviterName: string;
  inviteUrl: string;
  expiresAt: string;
}

export function OrganisationInviteEmail({
  organisationName,
  inviterName,
  inviteUrl,
  expiresAt,
}: OrganisationInviteEmailProps) {
  const preview = `${inviterName} has invited you to help run ${organisationName} on Carpe Care.`;

  return (
    <BaseEmail
      preview={preview}
      footer={`Sent by Carpe Care · You're receiving this because you were invited to join ${organisationName}.`}
    >
      <Heading as="h1" style={emailStyles.h1}>
        You&apos;re invited to join {organisationName}
      </Heading>
      <Text style={emailStyles.text}>
        {inviterName} has invited you to help run {organisationName} on Carpe
        Care as an Organisation Admin. That gives you admin access across every
        establishment in the organisation. Click the button below to accept the
        invitation.
      </Text>
      <Section style={emailStyles.buttonContainer}>
        <Button href={inviteUrl} style={emailStyles.button}>
          Accept invitation
        </Button>
      </Section>
      <Text style={emailStyles.text}>
        This invitation expires on {expiresAt}. Click the button above to create
        your account and join the organisation.
      </Text>
      <Text style={emailStyles.footer}>
        If you were not expecting this email, you can safely ignore it.
      </Text>
    </BaseEmail>
  );
}
