import { redirect } from "next/navigation";
import { createClient } from "@/features/auth/server";
import { LoginForm } from "./components/login-form";

interface LoginPageProps {
  searchParams: Promise<{ redirect?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { redirect: redirectTo } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const safeRedirect =
      redirectTo?.startsWith("/") && !redirectTo.startsWith("//")
        ? redirectTo
        : "/app";
    redirect(safeRedirect);
  }

  return (
    <div className="min-h-full flex items-center justify-center p-6">
      <LoginForm />
    </div>
  );
}
