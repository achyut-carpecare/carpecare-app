"use server";

import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/features/database";
import { schema } from "@/features/database";
import {
  generateOtp,
  hashToken,
  compareTokenHash,
  sendShareOtpEmail,
} from "@/features/email";
import { getSeizureRecordShareById } from "@/features/database/queries";
import {
  OTP_MAX_ATTEMPTS,
  OTP_EXPIRY_MINUTES,
  OTP_COOLDOWN_SECONDS,
} from "@/features/email/lib/constants";

const SHARE_SESSION_COOKIE = "share_session";

function getShareSessionCookieName(shareId: string) {
  return `${SHARE_SESSION_COOKIE}_${shareId}`;
}

export async function sendShareOtpAction({
  shareId,
  linkToken,
}: {
  shareId: string;
  linkToken: string;
}) {
  try {
    const share = await getSeizureRecordShareById(db, shareId);
    if (!share) {
      return { error: "Share not found" };
    }

    if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
      return { error: "Share link has expired" };
    }

    if (
      !share.linkTokenHash ||
      !compareTokenHash(linkToken, share.linkTokenHash)
    ) {
      return { error: "Invalid share link" };
    }

    const lastSent = share.lastOtpSentAt
      ? new Date(`${share.lastOtpSentAt}Z`)
      : null;
    if (
      lastSent &&
      (Date.now() - lastSent.getTime()) / 1000 < OTP_COOLDOWN_SECONDS
    ) {
      return { success: true, cooldown: true };
    }

    const rawOtp = generateOtp();
    const otpHash = hashToken(rawOtp);

    await db
      .update(schema.seizureRecordShares)
      .set({
        otpHash,
        otpAttempts: 0,
        lastOtpSentAt: new Date().toISOString(),
      })
      .where(eq(schema.seizureRecordShares.id, shareId));

    const recordWithDetails = await db
      .select({ careHome: schema.careHome })
      .from(schema.seizureRecordShares)
      .innerJoin(
        schema.seizureRecords,
        eq(
          schema.seizureRecordShares.seizureRecordId,
          schema.seizureRecords.id,
        ),
      )
      .innerJoin(
        schema.patients,
        eq(schema.seizureRecords.patientId, schema.patients.id),
      )
      .innerJoin(
        schema.careHome,
        eq(schema.patients.careHomeId, schema.careHome.id),
      )
      .where(eq(schema.seizureRecordShares.id, shareId))
      .limit(1)
      .then((rows) => rows[0]);

    await sendShareOtpEmail({
      to: share.recipientEmail ?? "",
      careHomeName: recordWithDetails?.careHome.name ?? "Carpe Care",
      otp: rawOtp,
      expiresInMinutes: OTP_EXPIRY_MINUTES,
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to send share OTP:", error);
    return { error: "Failed to send verification code" };
  }
}

export async function verifyShareOtpAction({
  shareId,
  otp,
}: {
  shareId: string;
  otp: string;
}) {
  try {
    const trimmedOtp = otp.trim();
    if (!trimmedOtp) {
      return { error: "Verification code is required" };
    }

    const share = await getSeizureRecordShareById(db, shareId);
    if (!share) {
      return { error: "Share not found" };
    }

    if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
      return { error: "Share link has expired" };
    }

    if ((share.otpAttempts ?? 0) >= OTP_MAX_ATTEMPTS) {
      return { error: "Too many failed attempts. Please request a new link." };
    }

    if (!share.otpHash) {
      return {
        error: "No verification code found. Please open the share link first.",
      };
    }

    const otpSentAt = share.lastOtpSentAt
      ? new Date(`${share.lastOtpSentAt}Z`)
      : null;
    if (
      otpSentAt &&
      Date.now() - otpSentAt.getTime() >= OTP_EXPIRY_MINUTES * 60 * 1000
    ) {
      return { error: "Verification code has expired. Please resend." };
    }

    const isValid = compareTokenHash(trimmedOtp, share.otpHash);
    console.log("verifyShareOtpAction:", {
      shareId,
      otpLength: trimmedOtp.length,
      hasOtpHash: !!share.otpHash,
      attempts: share.otpAttempts,
      otpAgeMs: otpSentAt ? Date.now() - otpSentAt.getTime() : null,
      isValid,
    });

    const attempts = (share.otpAttempts ?? 0) + 1;

    if (!isValid) {
      await db
        .update(schema.seizureRecordShares)
        .set({ otpAttempts: attempts })
        .where(eq(schema.seizureRecordShares.id, shareId));

      return {
        error: `Invalid code. ${OTP_MAX_ATTEMPTS - attempts} attempts remaining.`,
      };
    }

    await db
      .update(schema.seizureRecordShares)
      .set({
        otpHash: null,
        otpAttempts: 0,
        accessedAt: new Date().toISOString(),
      })
      .where(eq(schema.seizureRecordShares.id, shareId));

    const cookieName = getShareSessionCookieName(shareId);
    const cookieStore = await cookies();
    const shareExpiry = share.expiresAt
      ? new Date(share.expiresAt)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    cookieStore.set(cookieName, "verified", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      expires: shareExpiry,
      path: `/share/${shareId}`,
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to verify share OTP:", error);
    return { error: "Failed to verify code" };
  }
}

export async function isShareSessionValid(shareId: string): Promise<boolean> {
  const cookieStore = await cookies();
  const cookieName = getShareSessionCookieName(shareId);
  return cookieStore.get(cookieName)?.value === "verified";
}
