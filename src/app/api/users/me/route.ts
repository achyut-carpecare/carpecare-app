import { NextResponse } from "next/server";
import { requireAuth } from "@/features/auth/api";

export async function GET() {
  const { user, response } = await requireAuth();
  if (response) return response;

  return NextResponse.json({ user });
}
