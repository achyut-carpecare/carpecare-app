import { Button, Heading, Section, Text } from "@react-email/components";
import { BaseEmail, emailStyles } from "./base";

interface PlatformInviteEmailProps {
  inviterName: string;
  setPasswordUrl: string;
}

export function PlatformInviteEmail({
  inviterName,
  setPasswordUrl,
}: PlatformInviteEmailProps) {
  const preview = `${inviterName} has invited you to join Carpe Care.`;

  return (
    <BaseEmail
      preview={preview}
      footer="Sent by Carpe Care · You're receiving this because you were invited to create an account."
    >
      <Heading as="h1" style={emailStyles.h1}>
        You&apos;re invited to Carpe Care
      </Heading>
      <Text style={emailStyles.text}>
        {inviterName} has invited you to join Carpe Care. Click the button below
        to set your password and get started.
      </Text>
      <Section style={emailStyles.buttonContainer}>
        <Button href={setPasswordUrl} style={emailStyles.button}>
          Set your password
        </Button>
      </Section>
      <Text style={emailStyles.text}>
        This link expires in 24 hours. If you were not expecting this email, you
        can safely ignore it.
      </Text>
    </BaseEmail>
  );
}
