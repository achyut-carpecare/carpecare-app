import { NextResponse } from "next/server";
import { db } from "@/features/database";
import {
  deleteCareHomeById,
  getCareHomeById,
  updateCareHomeById,
} from "@/features/database/queries";

export async function GET(
  request: Request,
  ctx: RouteContext<"/api/care-homes/[id]">,
) {
  const { id } = await ctx.params;
  const careHome = await getCareHomeById(db, id);

  if (!careHome) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(careHome);
}

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/care-homes/[id]">,
) {
  const { id } = await ctx.params;
  const body = await request.json();
  const careHome = await updateCareHomeById(db, id, body);

  if (!careHome) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(careHome);
}

export async function DELETE(
  request: Request,
  ctx: RouteContext<"/api/care-homes/[id]">,
) {
  const { id } = await ctx.params;
  const careHome = await deleteCareHomeById(db, id);

  if (!careHome) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(careHome);
}
