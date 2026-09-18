import { render } from "@react-email/components";
import { resend, DEFAULT_FROM } from "./transporter";
import { ShareLinkEmail } from "./templates/share-link";
import { ShareOtpEmail } from "./templates/share-otp";
import { InvitationEmail } from "./templates/invite-link";
import { PlatformInviteEmail } from "./templates/platform-invite";
import { HelpRequestEmail } from "./templates/help-request";

export * from "./lib/crypto";

const SUPPORT_EMAIL = "contact@carpecare.co.uk";

async function sendEmail({
  to,
  subject,
  html,
  replyTo,
}: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}) {
  const { data, error } = await resend.emails.send({
    from: DEFAULT_FROM,
    to: [to],
    subject,
    html,
    ...(replyTo ? { replyTo } : {}),
  });

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }

  return data;
}

export async function sendShareLinkEmail({
  to,
  careHomeName,
  patientName,
  shareUrl,
  expiresAt,
}: {
  to: string;
  careHomeName: string;
  patientName: string;
  shareUrl: string;
  expiresAt: string;
}) {
  const html = await render(
    ShareLinkEmail({ careHomeName, patientName, shareUrl, expiresAt }),
  );

  const data = await sendEmail({
    to,
    subject: "A seizure record has been shared with you",
    html,
  });

  console.log("Share link email sent:", data?.id, "to:", to);
  return data;
}

export async function sendShareOtpEmail({
  to,
  careHomeName,
  otp,
  expiresInMinutes,
}: {
  to: string;
  careHomeName: string;
  otp: string;
  expiresInMinutes: number;
}) {
  const html = await render(
    ShareOtpEmail({ careHomeName, otp, expiresInMinutes }),
  );

  const data = await sendEmail({
    to,
    subject: "Your verification code",
    html,
  });

  console.log("Share OTP email sent:", data?.id, "to:", to);
  return data;
}

export async function sendInvitationEmail({
  to,
  careHomeName,
  inviterName,
  role,
  inviteUrl,
  expiresAt,
}: {
  to: string;
  careHomeName: string;
  inviterName: string;
  role: string;
  inviteUrl: string;
  expiresAt: string;
}) {
  const html = await render(
    InvitationEmail({ careHomeName, inviterName, role, inviteUrl, expiresAt }),
  );

  const data = await sendEmail({
    to,
    subject: `You're invited to join ${careHomeName} on Carpe Care`,
    html,
  });

  console.log("Invitation email sent:", data?.id, "to:", to);
  return data;
}

export async function sendHelpRequestEmail({
  fromName,
  fromEmail,
  message,
}: {
  fromName: string;
  fromEmail: string;
  message: string;
}) {
  const html = await render(HelpRequestEmail({ fromName, fromEmail, message }));

  const data = await sendEmail({
    to: SUPPORT_EMAIL,
    subject: `New help request from ${fromName}`,
    html,
    replyTo: fromEmail,
  });

  console.log("Help request email sent:", data?.id, "from:", fromEmail);
  return data;
}

export async function sendPlatformInviteEmail({
  to,
  inviterName,
  registerUrl,
}: {
  to: string;
  inviterName: string;
  registerUrl: string;
}) {
  const html = await render(PlatformInviteEmail({ inviterName, registerUrl }));

  const data = await sendEmail({
    to,
    subject: "You're invited to join Carpe Care",
    html,
  });

  console.log("Platform invite email sent:", data?.id, "to:", to);
  return data;
}
