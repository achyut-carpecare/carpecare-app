import { NextResponse } from "next/server";
import { createClient } from "./server";

export type AuthUser = { id: string; email?: string };

export async function requireAuth(): Promise<
  | { user: AuthUser; response?: undefined }
  | { user?: undefined; response: Response }
> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { user: { id: user.id, email: user.email } };
}

export function forbidden(message = "Forbidden") {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function notFound(message = "Not found") {
  return NextResponse.json({ error: message }, { status: 404 });
}
