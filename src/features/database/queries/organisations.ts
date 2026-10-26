import { and, eq } from "drizzle-orm";
import { schema, type DB } from "..";
import type { DBInsertTables, DBTables, DBUpdateTables } from "../types";

export async function getOrganisations(
  db: DB,
  {
    offset,
    limit,
  }: {
    offset?: number;
    limit?: number;
  } = {},
): Promise<DBTables["organisations"][]> {
  return await db
    .select()
    .from(schema.organisations)
    .limit(limit ?? 100)
    .offset(offset ?? 0);
}

export async function getOrganisationById(
  db: DB,
  id: string,
): Promise<DBTables["organisations"] | undefined> {
  const [organisation] = await db
    .select()
    .from(schema.organisations)
    .where(eq(schema.organisations.id, id));
  return organisation;
}

export async function createOrganisation(
  db: DB,
  data: DBInsertTables["organisations"],
): Promise<DBTables["organisations"]> {
  const [organisation] = await db
    .insert(schema.organisations)
    .values(data)
    .returning();
  return organisation;
}

export async function updateOrganisationById(
  db: DB,
  id: string,
  data: DBUpdateTables["organisations"],
): Promise<DBTables["organisations"] | undefined> {
  const [updated] = await db
    .update(schema.organisations)
    .set(data)
    .where(eq(schema.organisations.id, id))
    .returning();
  return updated;
}

export async function deleteOrganisationById(
  db: DB,
  id: string,
): Promise<DBTables["organisations"] | undefined> {
  const [deleted] = await db
    .delete(schema.organisations)
    .where(eq(schema.organisations.id, id))
    .returning();
  return deleted;
}

export async function getOrganisationMembers(
  db: DB,
  organisationId: string,
): Promise<DBTables["organisationMembers"][]> {
  return await db
    .select()
    .from(schema.organisationMembers)
    .where(eq(schema.organisationMembers.organisationId, organisationId));
}

export async function getOrganisationMembersWithProfiles(
  db: DB,
  organisationId: string,
): Promise<
  {
    member: DBTables["organisationMembers"];
    profile: DBTables["userProfiles"];
  }[]
> {
  return await db
    .select({
      member: schema.organisationMembers,
      profile: schema.userProfiles,
    })
    .from(schema.organisationMembers)
    .innerJoin(
      schema.userProfiles,
      eq(schema.organisationMembers.userId, schema.userProfiles.id),
    )
    .where(eq(schema.organisationMembers.organisationId, organisationId))
    .orderBy(schema.userProfiles.lastName, schema.userProfiles.firstName);
}

export async function getOrganisationMemberById(
  db: DB,
  id: string,
): Promise<DBTables["organisationMembers"] | undefined> {
  const [member] = await db
    .select()
    .from(schema.organisationMembers)
    .where(eq(schema.organisationMembers.id, id));
  return member;
}

export async function getOrganisationMemberByUserIdAndOrganisationId(
  db: DB,
  userId: string,
  organisationId: string,
): Promise<DBTables["organisationMembers"] | undefined> {
  const [member] = await db
    .select()
    .from(schema.organisationMembers)
    .where(
      and(
        eq(schema.organisationMembers.userId, userId),
        eq(schema.organisationMembers.organisationId, organisationId),
      ),
    );
  return member;
}

export async function getOrganisationsForUser(
  db: DB,
  userId: string,
): Promise<DBTables["organisations"][]> {
  const rows = await db
    .select({ organisation: schema.organisations })
    .from(schema.organisationMembers)
    .innerJoin(
      schema.organisations,
      eq(schema.organisationMembers.organisationId, schema.organisations.id),
    )
    .where(eq(schema.organisationMembers.userId, userId));
  return rows.map((r) => r.organisation);
}

export async function createOrganisationMember(
  db: DB,
  data: DBInsertTables["organisationMembers"],
): Promise<DBTables["organisationMembers"]> {
  const [member] = await db
    .insert(schema.organisationMembers)
    .values(data)
    .returning();
  return member;
}

export async function deleteOrganisationMemberById(
  db: DB,
  id: string,
): Promise<DBTables["organisationMembers"] | undefined> {
  const [deleted] = await db
    .delete(schema.organisationMembers)
    .where(eq(schema.organisationMembers.id, id))
    .returning();
  return deleted;
}

/**
 * Candidate pool for promoting someone to Org Admin: anyone who's already
 * an Admin at a care home within this organisation, excluding people who
 * already hold an org-level grant.
 */
export async function getCareHomeAdminsForOrganisation(
  db: DB,
  organisationId: string,
): Promise<DBTables["userProfiles"][]> {
  const existingMembers = await getOrganisationMembers(db, organisationId);
  const existingUserIds = new Set(existingMembers.map((m) => m.userId));

  const rows = await db
    .selectDistinct({ profile: schema.userProfiles })
    .from(schema.careHomeMembers)
    .innerJoin(
      schema.careHome,
      eq(schema.careHomeMembers.careHomeId, schema.careHome.id),
    )
    .innerJoin(
      schema.userProfiles,
      eq(schema.careHomeMembers.userId, schema.userProfiles.id),
    )
    .where(
      and(
        eq(schema.careHome.organisationId, organisationId),
        eq(schema.careHomeMembers.role, "admin"),
      ),
    );

  return rows
    .map((r) => r.profile)
    .filter((profile) => !existingUserIds.has(profile.id));
}

export async function getCareHomesForOrganisation(
  db: DB,
  organisationId: string,
): Promise<DBTables["careHome"][]> {
  return await db
    .select()
    .from(schema.careHome)
    .where(eq(schema.careHome.organisationId, organisationId));
}
