import { Button, Heading, Section, Text } from "@react-email/components";
import { BaseEmail, emailStyles } from "./base";

interface PlatformInviteEmailProps {
  inviterName: string;
  registerUrl: string;
}

export function PlatformInviteEmail({
  inviterName,
  registerUrl,
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
        {inviterName} has invited you to join Carpe Care as a system
        administrator. Click the button below to create your account and set
        your password.
      </Text>
      <Section style={emailStyles.buttonContainer}>
        <Button href={registerUrl} style={emailStyles.button}>
          Create account
        </Button>
      </Section>
      <Text style={emailStyles.text}>
        This link expires in 7 days. If you were not expecting this email, you
        can safely ignore it.
      </Text>
    </BaseEmail>
  );
}
