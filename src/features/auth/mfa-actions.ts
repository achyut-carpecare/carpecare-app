"use server";

import { db } from "@/features/database";
import {
  getUnusedMfaRecoveryCodesByUserId,
  markMfaRecoveryCodeUsed,
  replaceMfaRecoveryCodes,
} from "@/features/database/queries";
import {
  generateBackupCode,
  hashToken,
  compareTokenHash,
} from "@/features/email/lib/crypto";
import { createClient } from "./server";
import { createAdminClient } from "./admin";

const RECOVERY_CODE_COUNT = 10;

async function removeAllFactorsForUser(userId: string) {
  const adminClient = await createAdminClient();
  const { data, error } = await adminClient.auth.admin.mfa.listFactors({
    userId,
  });

  if (error || !data) {
    console.error("Failed to list MFA factors for reset:", error);
    return;
  }

  for (const factor of data.factors) {
    await adminClient.auth.admin.mfa.deleteFactor({
      id: factor.id,
      userId,
    });
  }
}

export async function generateRecoveryCodesAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in" };
  }

  const codes = Array.from({ length: RECOVERY_CODE_COUNT }, () =>
    generateBackupCode(),
  );
  const hashes = codes.map((code) => hashToken(code));

  await replaceMfaRecoveryCodes(db, user.id, hashes);

  return { codes };
}

export async function redeemBackupCodeAction(code: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in" };
  }

  const normalizedCode = code.trim().toUpperCase();
  if (!normalizedCode) {
    return { error: "Enter a backup code" };
  }

  const unusedCodes = await getUnusedMfaRecoveryCodesByUserId(db, user.id);
  const match = unusedCodes.find((row) =>
    compareTokenHash(normalizedCode, row.codeHash),
  );

  if (!match) {
    return { error: "That backup code is invalid or has already been used" };
  }

  await markMfaRecoveryCodeUsed(db, match.id);

  // The user's authenticator is presumed lost - clear their factor so the
  // next sign-in forces enrollment of a fresh one, rather than leaving the
  // account pointed at a device they can no longer use.
  await removeAllFactorsForUser(user.id);

  return { success: true };
}
