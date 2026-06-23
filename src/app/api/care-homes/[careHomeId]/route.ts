import { NextResponse } from "next/server";
import { requireAuth, notFound } from "@/features/auth/api";
import { db } from "@/features/database";
import {
  deleteCareHomeById,
  getCareHomeById,
  updateCareHomeById,
} from "@/features/database/queries";

export async function GET(
  request: Request,
  ctx: RouteContext<"/api/care-homes/[careHomeId]">,
) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  const { careHomeId } = await ctx.params;
  const careHome = await getCareHomeById(db, careHomeId);
  if (!careHome) return notFound();
  return NextResponse.json(careHome);
}

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/care-homes/[careHomeId]">,
) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  const { careHomeId } = await ctx.params;
  const body = await request.json();
  const careHome = await updateCareHomeById(db, careHomeId, body);
  if (!careHome) return notFound();
  return NextResponse.json(careHome);
}

export async function DELETE(
  request: Request,
  ctx: RouteContext<"/api/care-homes/[careHomeId]">,
) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  const { careHomeId } = await ctx.params;
  const careHome = await deleteCareHomeById(db, careHomeId);
  if (!careHome) return notFound();
  return NextResponse.json(careHome);
}
