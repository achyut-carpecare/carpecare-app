import { NextResponse, type NextRequest } from "next/server";
import { requireAuth, notFound } from "@/features/auth/api";
import { db } from "@/features/database";
import {
  deleteSeizureRecordById,
  getSeizureRecordById,
  updateSeizureRecordById,
} from "@/features/database/queries";

export async function GET(
  request: NextRequest,
  ctx: RouteContext<"/api/care-homes/[careHomeId]/patients/[patientId]/seizure-records/[seizureRecordId]">,
) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  const { careHomeId, patientId, seizureRecordId } = await ctx.params;
  const record = await getSeizureRecordById(db, seizureRecordId, {
    careHomeId,
    patientId,
  });
  if (!record) return notFound();
  return NextResponse.json(record);
}

export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/care-homes/[careHomeId]/patients/[patientId]/seizure-records/[seizureRecordId]">,
) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  const { careHomeId, patientId, seizureRecordId } = await ctx.params;
  const body = await request.json();
  const record = await updateSeizureRecordById(db, seizureRecordId, body, {
    careHomeId,
    patientId,
  });
  if (!record) return notFound();
  return NextResponse.json(record);
}

export async function DELETE(
  request: NextRequest,
  ctx: RouteContext<"/api/care-homes/[careHomeId]/patients/[patientId]/seizure-records/[seizureRecordId]">,
) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  const { careHomeId, patientId, seizureRecordId } = await ctx.params;
  const record = await deleteSeizureRecordById(db, seizureRecordId, {
    careHomeId,
    patientId,
  });
  if (!record) return notFound();
  return NextResponse.json(record);
}
