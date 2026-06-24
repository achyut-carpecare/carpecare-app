import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";

/** Carpe Care brand — aligned with globals.css / site theme */
export const brand = {
  primary: "#2563eb",
  primaryForeground: "#ffffff",
  secondary: "#0f172a",
  muted: "#6b7280",
  border: "#e5e7eb",
  borderLight: "#bfdbfe",
  background: "#ffffff",
  backgroundOuter: "#f8fafc",
} as const;

interface BaseEmailProps {
  preview: string;
  children: ReactNode;
}

export function BaseEmail({ preview, children }: BaseEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={headerSection}>
            <Text style={headerBrand}>Carpe Care</Text>
          </Section>
          <Section style={contentSection}>{children}</Section>
          <Section style={footerSection}>
            <Text style={footerText}>
              Sent by Carpe Care · You&apos;re receiving this because a care
              home shared a seizure record with you.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: brand.backgroundOuter,
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
  padding: "24px 0",
};

const container = {
  backgroundColor: brand.background,
  margin: "0 auto",
  maxWidth: "600px",
  borderRadius: "12px",
  overflow: "hidden" as const,
  boxShadow: "0 1px 3px rgba(20, 33, 56, 0.08)",
};

const headerSection = {
  padding: "20px 24px",
  backgroundColor: brand.primary,
  borderBottom: `2px solid ${brand.borderLight}`,
};

const headerBrand = {
  margin: 0,
  fontSize: "20px",
  fontWeight: "bold" as const,
  color: brand.primaryForeground,
  letterSpacing: "0.02em",
};

const contentSection = {
  padding: "32px 24px",
};

const footerSection = {
  padding: "16px 24px",
  backgroundColor: "#f9fafb",
  borderTop: `1px solid ${brand.border}`,
};

const footerText = {
  margin: 0,
  fontSize: "12px",
  color: brand.muted,
  lineHeight: "18px",
};

// Export shared styles for consistency (all emails use these)
export const emailStyles = {
  h1: {
    color: brand.secondary,
    fontSize: "24px",
    fontWeight: "bold" as const,
    margin: "0 0 16px 0",
    padding: "0",
  },
  h2: {
    color: brand.secondary,
    fontSize: "18px",
    fontWeight: "600" as const,
    margin: "20px 0 10px 0",
  },
  text: {
    color: brand.secondary,
    fontSize: "16px",
    lineHeight: "26px",
    margin: "16px 0",
  },
  button: {
    backgroundColor: brand.primary,
    borderRadius: "9999px",
    color: brand.primaryForeground,
    fontSize: "16px",
    fontWeight: "600" as const,
    textDecoration: "none",
    textAlign: "center" as const,
    display: "block",
    padding: "12px 24px",
  },
  buttonContainer: {
    padding: "24px 0",
  },
  link: {
    color: brand.primary,
    fontSize: "14px",
    textDecoration: "underline",
    wordBreak: "break-all" as const,
  },
  footer: {
    color: brand.muted,
    fontSize: "12px",
    lineHeight: "18px",
    marginTop: "32px",
    paddingTop: "24px",
    borderTop: `1px solid ${brand.border}`,
  },
  divider: {
    borderTop: `1px solid ${brand.border}`,
    margin: "24px 0",
  },
} as const;
