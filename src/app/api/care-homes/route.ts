import { NextResponse } from "next/server";
import { db } from "@/features/database";
import { createCareHome, getCareHomes } from "@/features/database/queries";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const offset = Number(searchParams.get("offset") ?? 0);
  const limit = Number(searchParams.get("limit") ?? 100);

  const careHomes = await getCareHomes(db, { offset, limit });
  return NextResponse.json(careHomes);
}

export async function POST(request: Request) {
  const body = await request.json();
  const careHome = await createCareHome(db, body);
  return NextResponse.json(careHome, { status: 201 });
}
