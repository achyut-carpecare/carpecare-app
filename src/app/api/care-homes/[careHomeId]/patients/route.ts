import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/features/auth/api";
import { db } from "@/features/database";
import { createPatient, getPatients } from "@/features/database/queries";

export async function GET(
  request: NextRequest,
  ctx: RouteContext<"/api/care-homes/[careHomeId]/patients">,
) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  const { careHomeId } = await ctx.params;
  const { searchParams } = new URL(request.url);
  const offset = Number(searchParams.get("offset") ?? 0);
  const limit = Number(searchParams.get("limit") ?? 100);

  const patients = await getPatients(db, { careHomeId, offset, limit });
  return NextResponse.json(patients);
}

export async function POST(
  request: NextRequest,
  ctx: RouteContext<"/api/care-homes/[careHomeId]/patients">,
) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  const { careHomeId } = await ctx.params;
  const body = await request.json();
  const patient = await createPatient(db, {
    ...body,
    careHomeId,
  });
  return NextResponse.json(patient, { status: 201 });
}
