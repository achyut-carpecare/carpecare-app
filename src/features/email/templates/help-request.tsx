import { Heading, Text } from "@react-email/components";
import { BaseEmail, emailStyles } from "./base";

interface HelpRequestEmailProps {
  fromName: string;
  fromEmail: string;
  message: string;
}

export function HelpRequestEmail({
  fromName,
  fromEmail,
  message,
}: HelpRequestEmailProps) {
  const preview = `New help request from ${fromName}`;

  return (
    <BaseEmail preview={preview} footer="Sent from the Carpe Care help form.">
      <Heading as="h1" style={emailStyles.h1}>
        New help request
      </Heading>
      <Text style={emailStyles.text}>
        From: {fromName} ({fromEmail})
      </Text>
      <Text style={{ ...emailStyles.text, whiteSpace: "pre-wrap" as const }}>
        {message}
      </Text>
    </BaseEmail>
  );
}
