import { NextResponse } from "next/server";
import { db } from "@/features/database";
import {
  createSeizureRecordShare,
  getSeizureRecordShares,
} from "@/features/database/queries";

export async function GET(
  request: Request,
  ctx: RouteContext<"/api/seizure-records/[id]/shares">,
) {
  const { id: seizureRecordId } = await ctx.params;
  const { searchParams } = new URL(request.url);
  const offset = Number(searchParams.get("offset") ?? 0);
  const limit = Number(searchParams.get("limit") ?? 100);

  const shares = await getSeizureRecordShares(db, { offset, limit });
  const filtered = shares.filter(
    (share) => share.seizureRecordId === seizureRecordId,
  );

  return NextResponse.json(filtered);
}

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/seizure-records/[id]/shares">,
) {
  const { id: seizureRecordId } = await ctx.params;
  const body = await request.json();
  const share = await createSeizureRecordShare(db, {
    ...body,
    seizureRecordId,
  });
  return NextResponse.json(share, { status: 201 });
}
