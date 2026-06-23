import { eq } from "drizzle-orm";
import { schema, type DB } from "..";
import type { DBInsertTables, DBTables } from "../types";

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
