import { and, eq } from "drizzle-orm";
import { db, schema, type DB } from "..";
import type {
  DBEnums,
  DBInsertTables,
  DBTables,
  DBUpdateTables,
} from "../types";
import { compareTokenHash } from "@/features/email";

// Allow query helpers to run inside a transaction as well as on the main DB.
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function getPlatformInvitations(
  dbOrTx: DB | Tx,
  {
    status,
    offset,
    limit,
  }: {
    status?: DBEnums["invitationStatus"];
    offset?: number;
    limit?: number;
  } = {},
): Promise<DBTables["platformInvitations"][]> {
  const conditions = [];
  if (status) {
    conditions.push(eq(schema.platformInvitations.status, status));
  }

  return await dbOrTx
    .select()
    .from(schema.platformInvitations)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(schema.platformInvitations.createdAt)
    .limit(limit ?? 100)
    .offset(offset ?? 0);
}

export async function getPlatformInvitationById(
  dbOrTx: DB | Tx,
  id: string,
): Promise<DBTables["platformInvitations"] | undefined> {
  const [invitation] = await dbOrTx
    .select()
    .from(schema.platformInvitations)
    .where(eq(schema.platformInvitations.id, id));
  return invitation;
}

export async function getPendingPlatformInvitationByEmail(
  dbOrTx: DB | Tx,
  email: string,
): Promise<DBTables["platformInvitations"] | undefined> {
  const [invitation] = await dbOrTx
    .select()
    .from(schema.platformInvitations)
    .where(
      and(
        eq(schema.platformInvitations.invitedEmail, email),
        eq(schema.platformInvitations.status, "pending"),
      ),
    )
    .limit(1);
  return invitation;
}

export async function createPlatformInvitation(
  dbOrTx: DB | Tx,
  data: DBInsertTables["platformInvitations"],
): Promise<DBTables["platformInvitations"]> {
  const [invitation] = await dbOrTx
    .insert(schema.platformInvitations)
    .values(data)
    .returning();
  return invitation;
}

export async function updatePlatformInvitationById(
  dbOrTx: DB | Tx,
  id: string,
  data: DBUpdateTables["platformInvitations"],
): Promise<DBTables["platformInvitations"] | undefined> {
  const [updatedInvitation] = await dbOrTx
    .update(schema.platformInvitations)
    .set({ ...data, updatedAt: new Date().toISOString() })
    .where(eq(schema.platformInvitations.id, id))
    .returning();
  return updatedInvitation;
}

export async function deletePlatformInvitationById(
  dbOrTx: DB | Tx,
  id: string,
): Promise<DBTables["platformInvitations"] | undefined> {
  const [deletedInvitation] = await dbOrTx
    .delete(schema.platformInvitations)
    .where(eq(schema.platformInvitations.id, id))
    .returning();
  return deletedInvitation;
}

export async function acceptPlatformInvitationById(
  dbOrTx: DB | Tx,
  invitationId: string,
  linkToken: string,
  userId: string,
): Promise<{ success: true } | { error: string }> {
  const invitation = await getPlatformInvitationById(dbOrTx, invitationId);
  if (!invitation) {
    return { error: "Invitation not found" };
  }

  if (invitation.status !== "pending") {
    return { error: "This invitation is no longer valid" };
  }

  if (invitation.expiresAt && new Date(invitation.expiresAt) < new Date()) {
    return { error: "This invitation has expired" };
  }

  if (
    !invitation.linkTokenHash ||
    !compareTokenHash(linkToken, invitation.linkTokenHash)
  ) {
    return { error: "Invalid invitation link" };
  }

  await dbOrTx
    .update(schema.platformInvitations)
    .set({
      status: "accepted",
      acceptedAt: new Date().toISOString(),
      acceptedBy: userId,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(schema.platformInvitations.id, invitationId));

  return { success: true };
}
