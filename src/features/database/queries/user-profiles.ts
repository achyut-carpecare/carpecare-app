import { eq } from "drizzle-orm";
import { schema, type DB } from "..";
import type { DBInsertTables, DBTables, DBUpdateTables } from "../types";

export async function getUserProfiles(
  db: DB,
  {
    offset,
    limit,
  }: {
    offset?: number;
    limit?: number;
  } = {},
): Promise<DBTables["userProfiles"][]> {
  return await db
    .select()
    .from(schema.userProfiles)
    .limit(limit ?? 100)
    .offset(offset ?? 0);
}

export async function getUserProfileById(
  db: DB,
  id: string,
): Promise<DBTables["userProfiles"] | undefined> {
  const [user] = await db
    .select()
    .from(schema.userProfiles)
    .where(eq(schema.userProfiles.id, id));
  return user;
}

export async function createUserProfile(
  db: DB,
  data: DBInsertTables["userProfiles"],
): Promise<DBTables["userProfiles"]> {
  const [profile] = await db
    .insert(schema.userProfiles)
    .values(data)
    .returning();
  return profile;
}

export async function updateUserProfileById(
  db: DB,
  id: string,
  data: DBUpdateTables["userProfiles"],
): Promise<DBTables["userProfiles"] | undefined> {
  const [updatedProfile] = await db
    .update(schema.userProfiles)
    .set(data)
    .where(eq(schema.userProfiles.id, id))
    .returning();
  return updatedProfile;
}

export async function deleteUserProfileById(
  db: DB,
  id: string,
): Promise<DBTables["userProfiles"] | undefined> {
  const [deletedProfile] = await db
    .delete(schema.userProfiles)
    .where(eq(schema.userProfiles.id, id))
    .returning();
  return deletedProfile;
}
