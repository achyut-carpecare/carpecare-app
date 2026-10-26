import { Button, Heading, Section, Text } from "@react-email/components";
import { BaseEmail, emailStyles } from "./base";

interface ShareNotificationEmailProps {
  careHomeName: string;
  staffName: string;
  patientName: string;
  recipientEmail: string;
  expiresAt: string;
  recordId: string;
  recordUrl: string;
}

export function ShareNotificationEmail({
  careHomeName,
  staffName,
  patientName,
  recipientEmail,
  expiresAt,
  recordId,
  recordUrl,
}: ShareNotificationEmailProps) {
  const preview = `${staffName} shared a seizure record for ${patientName} with ${recipientEmail}.`;

  return (
    <BaseEmail preview={preview}>
      <Heading as="h1" style={emailStyles.h1}>
        A team member shared a record
      </Heading>
      <Text style={emailStyles.text}>
        {staffName} at {careHomeName} sent a share link for {patientName}
        &apos;s seizure record to <strong>{recipientEmail}</strong>. It expires
        on {expiresAt}.
      </Text>
      <Text style={{ ...emailStyles.text, margin: "0 0 16px 0" }}>
        Reference ID:{" "}
        <span style={{ fontFamily: "monospace", fontSize: "14px" }}>
          {recordId}
        </span>
      </Text>
      <Section style={emailStyles.buttonContainer}>
        <Button href={recordUrl} style={emailStyles.button}>
          View record
        </Button>
      </Section>
      <Text style={emailStyles.footer}>
        You&apos;re receiving this because you&apos;re an admin at{" "}
        {careHomeName}. Staff can share records directly - this is just a
        heads-up, not an approval request.
      </Text>
    </BaseEmail>
  );
}
