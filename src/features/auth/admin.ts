"use server";

import { createClient } from "@supabase/supabase-js";

export async function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}

export async function getAuthUserEmailsByIds(userIds: string[]) {
  if (userIds.length === 0) return new Map<string, string | undefined>();

  const adminClient = await createAdminClient();
  const { data, error } = await adminClient.auth.admin.listUsers();

  if (error) {
    console.error("Failed to list auth users:", error);
    return new Map<string, string | undefined>();
  }

  const users = data?.users ?? [];
  const emailById = new Map<string, string | undefined>();

  for (const userId of userIds) {
    const user = users.find((u) => u.id === userId);
    emailById.set(userId, user?.email);
  }

  return emailById;
}
