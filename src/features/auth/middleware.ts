import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

async function isMfaEnabledForUser(userId: string): Promise<boolean> {
  // Service-role, fetch-based client (no raw TCP connection, safe in
  // middleware/edge) used only to read the mfa_enabled escape-hatch flag.
  // If an admin flips this to false directly in the database for a locked-out
  // user, they can sign in with just their password again.
  const adminClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const { data, error } = await adminClient
    .from("user_profiles")
    .select("mfa_enabled")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) {
    // Fail closed: if we can't confirm the flag, still require MFA.
    return true;
  }

  return data.mfa_enabled !== false;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
          Object.entries(headers).forEach(([key, value]) =>
            supabaseResponse.headers.set(key, value),
          );
        },
      },
    },
  );

  // Do not run code between createServerClient and
  // supabase.auth.getClaims(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: If you remove getClaims() and you use server-side rendering
  // with the Supabase client, your users may be randomly logged out.
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  const isPublicPath =
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/auth") ||
    request.nextUrl.pathname.startsWith("/invite") ||
    request.nextUrl.pathname.startsWith("/home") ||
    request.nextUrl.pathname.startsWith("/share") ||
    request.nextUrl.pathname === "/";

  if (!user && !isPublicPath) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  // MFA is mandatory for every account. "/auth/*" (which includes
  // "/auth/mfa/enroll" and "/auth/mfa/verify") is already treated as public
  // above, so these checks never redirect-loop against the MFA pages
  // themselves.
  if (user && !isPublicPath) {
    const mfaRequired = await isMfaEnabledForUser(user.sub);
    const { data: aal } =
      await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

    if (mfaRequired && aal) {
      if (aal.nextLevel === "aal1") {
        // No verified MFA factor enrolled yet - force enrollment.
        const url = request.nextUrl.clone();
        url.pathname = "/auth/mfa/enroll";
        return NextResponse.redirect(url);
      }

      if (aal.currentLevel !== aal.nextLevel) {
        // A verified factor exists but this session hasn't completed the
        // second-factor challenge yet.
        const url = request.nextUrl.clone();
        url.pathname = "/auth/mfa/verify";
        return NextResponse.redirect(url);
      }
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}
