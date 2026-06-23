import { NextResponse } from "next/server";
import { db } from "@/features/database";
import {
  createUserProfile,
  getUserProfiles,
} from "@/features/database/queries";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const offset = Number(searchParams.get("offset") ?? 0);
  const limit = Number(searchParams.get("limit") ?? 100);

  const profiles = await getUserProfiles(db, { offset, limit });
  return NextResponse.json(profiles);
}

export async function POST(request: Request) {
  const body = await request.json();
  const profile = await createUserProfile(db, body);
  return NextResponse.json(profile, { status: 201 });
}
