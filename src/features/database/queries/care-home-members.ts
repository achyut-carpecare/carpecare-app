import { and, eq } from "drizzle-orm";
import { schema, type DB } from "..";
import type { DBEnums, DBInsertTables, DBTables } from "../types";

export async function getCareHomeMembers(
  db: DB,
  careHomeId: string,
  {
    offset,
    limit,
  }: {
    offset?: number;
    limit?: number;
  } = {},
): Promise<DBTables["careHomeMembers"][]> {
  return await db
    .select()
    .from(schema.careHomeMembers)
    .where(eq(schema.careHomeMembers.careHomeId, careHomeId))
    .limit(limit ?? 100)
    .offset(offset ?? 0);
}

export async function getCareHomeMembersWithProfiles(
  db: DB,
  careHomeId: string,
): Promise<
  {
    member: DBTables["careHomeMembers"];
    profile: DBTables["userProfiles"];
  }[]
> {
  return await db
    .select({
      member: schema.careHomeMembers,
      profile: schema.userProfiles,
    })
    .from(schema.careHomeMembers)
    .innerJoin(
      schema.userProfiles,
      eq(schema.careHomeMembers.userId, schema.userProfiles.id),
    )
    .where(eq(schema.careHomeMembers.careHomeId, careHomeId))
    .orderBy(schema.userProfiles.lastName, schema.userProfiles.firstName);
}

export async function getCareHomeMemberByUserIdAndCareHomeId(
  db: DB,
  userId: string,
  careHomeId: string,
): Promise<DBTables["careHomeMembers"] | undefined> {
  const [member] = await db
    .select()
    .from(schema.careHomeMembers)
    .where(
      and(
        eq(schema.careHomeMembers.userId, userId),
        eq(schema.careHomeMembers.careHomeId, careHomeId),
      ),
    );
  return member;
}

export async function getCareHomeMemberById(
  db: DB,
  id: string,
): Promise<DBTables["careHomeMembers"] | undefined> {
  const [member] = await db
    .select()
    .from(schema.careHomeMembers)
    .where(eq(schema.careHomeMembers.id, id));
  return member;
}

export async function updateCareHomeMemberRole(
  db: DB,
  id: string,
  role: DBEnums["careHomeRole"],
): Promise<DBTables["careHomeMembers"] | undefined> {
  const [updatedMember] = await db
    .update(schema.careHomeMembers)
    .set({ role, updatedAt: new Date().toISOString() })
    .where(eq(schema.careHomeMembers.id, id))
    .returning();
  return updatedMember;
}

export async function getCareHomeIdForUser(
  db: DB,
  userId: string,
): Promise<string | undefined> {
  const [member] = await db
    .select({ careHomeId: schema.careHomeMembers.careHomeId })
    .from(schema.careHomeMembers)
    .where(eq(schema.careHomeMembers.userId, userId))
    .limit(1);
  return member?.careHomeId;
}

export async function getCareHomeForUser(
  db: DB,
  userId: string,
): Promise<DBTables["careHome"] | undefined> {
  const [result] = await db
    .select({
      careHome: schema.careHome,
    })
    .from(schema.careHomeMembers)
    .innerJoin(
      schema.careHome,
      eq(schema.careHomeMembers.careHomeId, schema.careHome.id),
    )
    .where(eq(schema.careHomeMembers.userId, userId))
    .limit(1);
  return result?.careHome;
}

export async function createCareHomeMember(
  db: DB,
  data: DBInsertTables["careHomeMembers"],
): Promise<DBTables["careHomeMembers"]> {
  const [member] = await db
    .insert(schema.careHomeMembers)
    .values(data)
    .returning();
  return member;
}

export async function deleteCareHomeMemberById(
  db: DB,
  id: string,
): Promise<DBTables["careHomeMembers"] | undefined> {
  const [deletedMember] = await db
    .delete(schema.careHomeMembers)
    .where(eq(schema.careHomeMembers.id, id))
    .returning();
  return deletedMember;
}
