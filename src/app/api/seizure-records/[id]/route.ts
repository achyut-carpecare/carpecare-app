import { NextResponse } from "next/server";
import { db } from "@/features/database";
import {
  deleteSeizureRecordById,
  getSeizureRecordById,
  updateSeizureRecordById,
} from "@/features/database/queries";

export async function GET(
  request: Request,
  ctx: RouteContext<"/api/seizure-records/[id]">,
) {
  const { id } = await ctx.params;
  const record = await getSeizureRecordById(db, id);

  if (!record) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(record);
}

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/seizure-records/[id]">,
) {
  const { id } = await ctx.params;
  const body = await request.json();
  const record = await updateSeizureRecordById(db, id, body);

  if (!record) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(record);
}

export async function DELETE(
  request: Request,
  ctx: RouteContext<"/api/seizure-records/[id]">,
) {
  const { id } = await ctx.params;
  const record = await deleteSeizureRecordById(db, id);

  if (!record) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(record);
}
