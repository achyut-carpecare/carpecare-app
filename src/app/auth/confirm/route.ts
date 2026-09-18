import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/features/auth/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}/auth/reset-password`);
    }
  }

  return NextResponse.redirect(
    `${origin}/auth/forgot-password?error=invalid_link`,
  );
}
