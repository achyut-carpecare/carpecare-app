import { NextResponse } from "next/server";
import { db } from "@/features/database";
import {
  deleteSeizureRecordShareById,
  getSeizureRecordShareById,
  updateSeizureRecordShareById,
} from "@/features/database/queries";

export async function GET(
  request: Request,
  ctx: RouteContext<"/api/seizure-records/[id]/shares/[shareId]">,
) {
  const { id: seizureRecordId, shareId } = await ctx.params;
  const share = await getSeizureRecordShareById(db, shareId);

  if (!share || share.seizureRecordId !== seizureRecordId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(share);
}

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/seizure-records/[id]/shares/[shareId]">,
) {
  const { id: seizureRecordId, shareId } = await ctx.params;
  const body = await request.json();

  const existing = await getSeizureRecordShareById(db, shareId);
  if (!existing || existing.seizureRecordId !== seizureRecordId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const share = await updateSeizureRecordShareById(db, shareId, body);
  return NextResponse.json(share);
}

export async function DELETE(
  request: Request,
  ctx: RouteContext<"/api/seizure-records/[id]/shares/[shareId]">,
) {
  const { id: seizureRecordId, shareId } = await ctx.params;

  const existing = await getSeizureRecordShareById(db, shareId);
  if (!existing || existing.seizureRecordId !== seizureRecordId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const share = await deleteSeizureRecordShareById(db, shareId);
  return NextResponse.json(share);
}
