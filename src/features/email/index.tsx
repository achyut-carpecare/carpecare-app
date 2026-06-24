import { render } from "@react-email/components";
import { transporter, DEFAULT_FROM } from "./transporter";
import { ShareLinkEmail } from "./templates/share-link";
import { ShareOtpEmail } from "./templates/share-otp";

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
