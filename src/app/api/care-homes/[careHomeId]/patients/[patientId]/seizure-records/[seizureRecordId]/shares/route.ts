import { NextResponse, type NextRequest } from "next/server";
import { requireAuth, forbidden } from "@/features/auth/api";
import { db } from "@/features/database";
import {
  createSeizureRecordShare,
  getSeizureRecordIdsForPatient,
  getSeizureRecordShares,
} from "@/features/database/queries";

export async function GET(
  request: NextRequest,
  ctx: RouteContext<"/api/care-homes/[careHomeId]/patients/[patientId]/seizure-records/[seizureRecordId]/shares">,
) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  const { patientId } = await ctx.params;
  const { searchParams } = new URL(request.url);
  const offset = Number(searchParams.get("offset") ?? 0);
  const limit = Number(searchParams.get("limit") ?? 100);

  const ids = await getSeizureRecordIdsForPatient(db, patientId);
  const shares = await getSeizureRecordShares(db, {
    seizureRecordIds: ids,
    offset,
    limit,
  });
  return NextResponse.json(shares);
}

export async function POST(
  request: NextRequest,
  ctx: RouteContext<"/api/care-homes/[careHomeId]/patients/[patientId]/seizure-records/[seizureRecordId]/shares">,
) {
  const { user, response } = await requireAuth();
  if (response) return response;

  const { patientId, seizureRecordId } = await ctx.params;
  const ids = await getSeizureRecordIdsForPatient(db, patientId);
  if (!ids.includes(seizureRecordId)) {
    return forbidden("Seizure record does not belong to this patient");
  }

  const body = await request.json();
  const share = await createSeizureRecordShare(db, {
    ...body,
    seizureRecordId,
    sharedBy: user.id,
  });
  return NextResponse.json(share, { status: 201 });
}
