import { and, eq, isNull } from "drizzle-orm";
import { schema, type DB } from "..";
import type { DBTables } from "../types";

export async function getUnusedMfaRecoveryCodesByUserId(
  db: DB,
  userId: string,
): Promise<DBTables["mfaRecoveryCodes"][]> {
  return await db
    .select()
    .from(schema.mfaRecoveryCodes)
    .where(
      and(
        eq(schema.mfaRecoveryCodes.userId, userId),
        isNull(schema.mfaRecoveryCodes.usedAt),
      ),
    );
}

export async function markMfaRecoveryCodeUsed(
  db: DB,
  id: string,
): Promise<void> {
  await db
    .update(schema.mfaRecoveryCodes)
    .set({ usedAt: new Date().toISOString() })
    .where(eq(schema.mfaRecoveryCodes.id, id));
}

export async function replaceMfaRecoveryCodes(
  db: DB,
  userId: string,
  codeHashes: string[],
): Promise<void> {
  await db.transaction(async (tx) => {
    await tx
      .delete(schema.mfaRecoveryCodes)
      .where(eq(schema.mfaRecoveryCodes.userId, userId));

    if (codeHashes.length > 0) {
      await tx.insert(schema.mfaRecoveryCodes).values(
        codeHashes.map((codeHash) => ({
          userId,
          codeHash,
        })),
      );
    }
  });
}
