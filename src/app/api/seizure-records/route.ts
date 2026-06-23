import { NextResponse } from "next/server";
import { db } from "@/features/database";
import {
  createSeizureRecord,
  getSeizureRecords,
} from "@/features/database/queries";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const offset = Number(searchParams.get("offset") ?? 0);
  const limit = Number(searchParams.get("limit") ?? 100);

  const records = await getSeizureRecords(db, { offset, limit });
  return NextResponse.json(records);
}

export async function POST(request: Request) {
  const body = await request.json();
  const record = await createSeizureRecord(db, body);
  return NextResponse.json(record, { status: 201 });
}
