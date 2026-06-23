import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/features/auth/api";
import { db } from "@/features/database";
import { getSeizureRecords } from "@/features/database/queries";

export async function GET(
  request: NextRequest,
  ctx: RouteContext<"/api/care-homes/[careHomeId]/seizure-records">,
) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  const { careHomeId } = await ctx.params;
  const { searchParams } = new URL(request.url);
  const offset = Number(searchParams.get("offset") ?? 0);
  const limit = Number(searchParams.get("limit") ?? 100);

  const records = await getSeizureRecords(db, {
    careHomeId,
    offset,
    limit,
  });
  return NextResponse.json(records);
}
