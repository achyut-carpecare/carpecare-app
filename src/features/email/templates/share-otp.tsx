import { Heading, Section, Text } from "@react-email/components";
import { BaseEmail, emailStyles } from "./base";

interface ShareOtpEmailProps {
  careHomeName: string;
  otp: string;
  expiresInMinutes: number;
}

export function ShareOtpEmail({
  careHomeName,
  otp,
  expiresInMinutes,
}: ShareOtpEmailProps) {
  const preview = `Your verification code to view the seizure record from ${careHomeName}.`;

  return (
    <BaseEmail preview={preview}>
      <Heading as="h1" style={emailStyles.h1}>
        Verify your email
      </Heading>
      <Text style={emailStyles.text}>
        Use the code below to unlock the seizure record shared by {careHomeName}
        . This code will expire in {expiresInMinutes} minutes.
      </Text>
      <Section style={{ padding: "24px 0", textAlign: "center" }}>
        <Text
          style={{
            fontSize: "32px",
            fontWeight: "bold",
            letterSpacing: "0.15em",
            color: emailStyles.h1.color,
          }}
        >
          {otp}
        </Text>
      </Section>
      <Text style={emailStyles.footer}>
        If you did not request this code, you can safely ignore this email.
      </Text>
    </BaseEmail>
  );
}
