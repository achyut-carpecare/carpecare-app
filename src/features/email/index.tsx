import { render } from "@react-email/components";
import { transporter, DEFAULT_FROM } from "./transporter";
import { ShareLinkEmail } from "./templates/share-link";
import { ShareOtpEmail } from "./templates/share-otp";
import { InvitationEmail } from "./templates/invite-link";
import { PlatformInviteEmail } from "./templates/platform-invite";

export * from "./lib/crypto";

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

  const info = await transporter.sendMail({
    from: DEFAULT_FROM,
    to,
    subject: "A seizure record has been shared with you",
    html,
  });

  console.log("Share link email sent:", info.messageId, "to:", to);
  return info;
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

  const info = await transporter.sendMail({
    from: DEFAULT_FROM,
    to,
    subject: "Your verification code",
    html,
  });

  console.log("Share OTP email sent:", info.messageId, "to:", to);
  return info;
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

  const info = await transporter.sendMail({
    from: DEFAULT_FROM,
    to,
    subject: `You're invited to join ${careHomeName} on Carpe Care`,
    html,
  });

  console.log("Invitation email sent:", info.messageId, "to:", to);
  return info;
}

export async function sendPlatformInviteEmail({
  to,
  inviterName,
  setPasswordUrl,
}: {
  to: string;
  inviterName: string;
  setPasswordUrl: string;
}) {
  const html = await render(
    PlatformInviteEmail({ inviterName, setPasswordUrl }),
  );

  const info = await transporter.sendMail({
    from: DEFAULT_FROM,
    to,
    subject: "You're invited to join Carpe Care",
    html,
  });

  console.log("Platform invite email sent:", info.messageId, "to:", to);
  return info;
}
