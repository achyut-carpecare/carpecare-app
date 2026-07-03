import { and, eq } from "drizzle-orm";
import { schema, type DB } from "..";
import type {
  DBEnums,
  DBInsertTables,
  DBTables,
  DBUpdateTables,
} from "../types";
import { compareTokenHash } from "@/features/email";

export async function getCareHomeInvitations(
  db: DB,
  careHomeId: string,
  {
    status,
    offset,
    limit,
  }: {
    status?: DBEnums["invitationStatus"];
    offset?: number;
    limit?: number;
  } = {},
): Promise<DBTables["careHomeInvitations"][]> {
  const conditions = [eq(schema.careHomeInvitations.careHomeId, careHomeId)];
  if (status) {
    conditions.push(eq(schema.careHomeInvitations.status, status));
  }

  return await db
    .select()
    .from(schema.careHomeInvitations)
    .where(and(...conditions))
    .orderBy(schema.careHomeInvitations.createdAt)
    .limit(limit ?? 100)
    .offset(offset ?? 0);
}

export async function getCareHomeInvitationById(
  db: DB,
  id: string,
): Promise<DBTables["careHomeInvitations"] | undefined> {
  const [invitation] = await db
    .select()
    .from(schema.careHomeInvitations)
    .where(eq(schema.careHomeInvitations.id, id));
  return invitation;
}

export async function getPendingCareHomeInvitationByEmail(
  db: DB,
  careHomeId: string,
  email: string,
): Promise<DBTables["careHomeInvitations"] | undefined> {
  const [invitation] = await db
    .select()
    .from(schema.careHomeInvitations)
    .where(
      and(
        eq(schema.careHomeInvitations.careHomeId, careHomeId),
        eq(schema.careHomeInvitations.invitedEmail, email),
        eq(schema.careHomeInvitations.status, "pending"),
      ),
    )
    .limit(1);
  return invitation;
}

export async function createCareHomeInvitation(
  db: DB,
  data: DBInsertTables["careHomeInvitations"],
): Promise<DBTables["careHomeInvitations"]> {
  const [invitation] = await db
    .insert(schema.careHomeInvitations)
    .values(data)
    .returning();
  return invitation;
}

export async function updateCareHomeInvitationById(
  db: DB,
  id: string,
  data: DBUpdateTables["careHomeInvitations"],
): Promise<DBTables["careHomeInvitations"] | undefined> {
  const [updatedInvitation] = await db
    .update(schema.careHomeInvitations)
    .set({ ...data, updatedAt: new Date().toISOString() })
    .where(eq(schema.careHomeInvitations.id, id))
    .returning();
  return updatedInvitation;
}

export async function deleteCareHomeInvitationById(
  db: DB,
  id: string,
): Promise<DBTables["careHomeInvitations"] | undefined> {
  const [deletedInvitation] = await db
    .delete(schema.careHomeInvitations)
    .where(eq(schema.careHomeInvitations.id, id))
    .returning();
  return deletedInvitation;
}

export async function acceptInvitationById(
  db: DB,
  invitationId: string,
  linkToken: string,
  userId: string,
): Promise<{ success: true; careHomeId: string } | { error: string }> {
  const invitation = await getCareHomeInvitationById(db, invitationId);
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

  const existingMembership = await db
    .select()
    .from(schema.careHomeMembers)
    .where(
      and(
        eq(schema.careHomeMembers.userId, userId),
        eq(schema.careHomeMembers.careHomeId, invitation.careHomeId),
      ),
    );

  if (existingMembership.length === 0) {
    await db.insert(schema.careHomeMembers).values({
      userId,
      careHomeId: invitation.careHomeId,
      role: invitation.role,
    });
  }

  await db
    .update(schema.careHomeInvitations)
    .set({
      status: "accepted",
      acceptedAt: new Date().toISOString(),
      acceptedBy: userId,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(schema.careHomeInvitations.id, invitationId));

  return { success: true, careHomeId: invitation.careHomeId };
}
