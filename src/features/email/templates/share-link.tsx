import { Button, Heading, Section, Text } from "@react-email/components";
import { BaseEmail, emailStyles } from "./base";

interface ShareLinkEmailProps {
  careHomeName: string;
  patientName: string;
  shareUrl: string;
  expiresAt: string;
}

export function ShareLinkEmail({
  careHomeName,
  patientName,
  shareUrl,
  expiresAt,
}: ShareLinkEmailProps) {
  const preview = `${careHomeName} has shared a seizure record with you.`;

  return (
    <BaseEmail preview={preview}>
      <Heading as="h1" style={emailStyles.h1}>
        A seizure record has been shared with you
      </Heading>
      <Text style={emailStyles.text}>
        {careHomeName} has shared a read-only seizure record for {patientName}.
        Click the button below to review it securely.
      </Text>
      <Section style={emailStyles.buttonContainer}>
        <Button href={shareUrl} style={emailStyles.button}>
          View seizure record
        </Button>
      </Section>
      <Text style={emailStyles.text}>
        This secure link expires on {expiresAt}. For security, you will be asked
        to enter a one-time code sent to this email address when you first open
        the link.
      </Text>
      <Text style={emailStyles.footer}>
        If you were not expecting this email, you can safely ignore it. The
        sender will be notified that the link was not used.
      </Text>
    </BaseEmail>
  );
}
