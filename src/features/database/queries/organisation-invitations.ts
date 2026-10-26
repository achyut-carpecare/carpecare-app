import { and, eq } from "drizzle-orm";
import { schema, type DB } from "..";
import type {
  DBEnums,
  DBInsertTables,
  DBTables,
  DBUpdateTables,
} from "../types";
import { compareTokenHash } from "@/features/email";

export async function getOrganisationInvitations(
  db: DB,
  organisationId: string,
  {
    status,
    offset,
    limit,
  }: {
    status?: DBEnums["invitationStatus"];
    offset?: number;
    limit?: number;
  } = {},
): Promise<DBTables["organisationInvitations"][]> {
  const conditions = [
    eq(schema.organisationInvitations.organisationId, organisationId),
  ];
  if (status) {
    conditions.push(eq(schema.organisationInvitations.status, status));
  }

  return await db
    .select()
    .from(schema.organisationInvitations)
    .where(and(...conditions))
    .orderBy(schema.organisationInvitations.createdAt)
    .limit(limit ?? 100)
    .offset(offset ?? 0);
}

export async function getOrganisationInvitationById(
  db: DB,
  id: string,
): Promise<DBTables["organisationInvitations"] | undefined> {
  const [invitation] = await db
    .select()
    .from(schema.organisationInvitations)
    .where(eq(schema.organisationInvitations.id, id));
  return invitation;
}

export async function getPendingOrganisationInvitationByEmail(
  db: DB,
  organisationId: string,
  email: string,
): Promise<DBTables["organisationInvitations"] | undefined> {
  const [invitation] = await db
    .select()
    .from(schema.organisationInvitations)
    .where(
      and(
        eq(schema.organisationInvitations.organisationId, organisationId),
        eq(schema.organisationInvitations.invitedEmail, email),
        eq(schema.organisationInvitations.status, "pending"),
      ),
    )
    .limit(1);
  return invitation;
}

export async function createOrganisationInvitation(
  db: DB,
  data: DBInsertTables["organisationInvitations"],
): Promise<DBTables["organisationInvitations"]> {
  const [invitation] = await db
    .insert(schema.organisationInvitations)
    .values(data)
    .returning();
  return invitation;
}

export async function updateOrganisationInvitationById(
  db: DB,
  id: string,
  data: DBUpdateTables["organisationInvitations"],
): Promise<DBTables["organisationInvitations"] | undefined> {
  const [updatedInvitation] = await db
    .update(schema.organisationInvitations)
    .set({ ...data, updatedAt: new Date().toISOString() })
    .where(eq(schema.organisationInvitations.id, id))
    .returning();
  return updatedInvitation;
}

export async function deleteOrganisationInvitationById(
  db: DB,
  id: string,
): Promise<DBTables["organisationInvitations"] | undefined> {
  const [deletedInvitation] = await db
    .delete(schema.organisationInvitations)
    .where(eq(schema.organisationInvitations.id, id))
    .returning();
  return deletedInvitation;
}

export async function acceptOrganisationInvitationById(
  db: DB,
  invitationId: string,
  linkToken: string,
  userId: string,
): Promise<{ success: true; organisationId: string } | { error: string }> {
  const invitation = await getOrganisationInvitationById(db, invitationId);
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
    .from(schema.organisationMembers)
    .where(
      and(
        eq(schema.organisationMembers.userId, userId),
        eq(
          schema.organisationMembers.organisationId,
          invitation.organisationId,
        ),
      ),
    );

  if (existingMembership.length === 0) {
    await db.insert(schema.organisationMembers).values({
      userId,
      organisationId: invitation.organisationId,
    });
  }

  await db
    .update(schema.organisationInvitations)
    .set({
      status: "accepted",
      acceptedAt: new Date().toISOString(),
      acceptedBy: userId,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(schema.organisationInvitations.id, invitationId));

  return { success: true, organisationId: invitation.organisationId };
}
