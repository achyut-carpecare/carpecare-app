import { NextResponse, type NextRequest } from "next/server";
import { requireAuth, notFound } from "@/features/auth/api";
import { db } from "@/features/database";
import {
  deleteSeizureRecordShareById,
  getSeizureRecordIdsForPatient,
  getSeizureRecordShareById,
  updateSeizureRecordShareById,
} from "@/features/database/queries";

export async function GET(
  request: NextRequest,
  ctx: RouteContext<"/api/care-homes/[careHomeId]/patients/[patientId]/seizure-records/[seizureRecordId]/shares/[shareId]">,
) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  const { patientId, shareId } = await ctx.params;
  const ids = await getSeizureRecordIdsForPatient(db, patientId);
  const share = await getSeizureRecordShareById(db, shareId, {
    seizureRecordIds: ids,
  });
  if (!share) return notFound();
  return NextResponse.json(share);
}

export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/care-homes/[careHomeId]/patients/[patientId]/seizure-records/[seizureRecordId]/shares/[shareId]">,
) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  const { patientId, shareId } = await ctx.params;
  const ids = await getSeizureRecordIdsForPatient(db, patientId);
  const existing = await getSeizureRecordShareById(db, shareId, {
    seizureRecordIds: ids,
  });
  if (!existing) return notFound();

  const body = await request.json();
  const share = await updateSeizureRecordShareById(db, shareId, body);
  return NextResponse.json(share);
}

export async function DELETE(
  request: NextRequest,
  ctx: RouteContext<"/api/care-homes/[careHomeId]/patients/[patientId]/seizure-records/[seizureRecordId]/shares/[shareId]">,
) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  const { patientId, shareId } = await ctx.params;
  const ids = await getSeizureRecordIdsForPatient(db, patientId);
  const existing = await getSeizureRecordShareById(db, shareId, {
    seizureRecordIds: ids,
  });
  if (!existing) return notFound();

  const share = await deleteSeizureRecordShareById(db, shareId);
  return NextResponse.json(share);
}
