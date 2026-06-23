import { NextResponse } from "next/server";
import { db } from "@/features/database";
import { createPatient, getPatients } from "@/features/database/queries";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const offset = Number(searchParams.get("offset") ?? 0);
  const limit = Number(searchParams.get("limit") ?? 100);

  const patients = await getPatients(db, { offset, limit });
  return NextResponse.json(patients);
}

export async function POST(request: Request) {
  const body = await request.json();
  const patient = await createPatient(db, body);
  return NextResponse.json(patient, { status: 201 });
}
