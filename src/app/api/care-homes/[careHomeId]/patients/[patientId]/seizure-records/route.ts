// Disabled: requireAuth() only checks "is signed in", never that the caller
// belongs to this care home, so any authenticated user could list/create
// seizure records (health data/PHI) for any patient by ID. Server Actions
// (.../seizure-records/new/lib/actions.ts) cover this functionality with
// proper membership checks. Re-enable only with an equivalent care-home
// membership check added.
export {};
//
// import { NextResponse, type NextRequest } from "next/server";
// import { requireAuth } from "@/features/auth/api";
// import { db } from "@/features/database";
// import {
//   createSeizureRecord,
//   getSeizureRecords,
// } from "@/features/database/queries";
//
// export async function GET(
//   request: NextRequest,
//   ctx: RouteContext<"/api/care-homes/[careHomeId]/patients/[patientId]/seizure-records">,
// ) {
//   const auth = await requireAuth();
//   if (auth.response) return auth.response;
//
//   const { careHomeId, patientId } = await ctx.params;
//   const { searchParams } = new URL(request.url);
//   const offset = Number(searchParams.get("offset") ?? 0);
//   const limit = Number(searchParams.get("limit") ?? 100);
//
//   const records = await getSeizureRecords(db, {
//     careHomeId,
//     patientId,
//     offset,
//     limit,
//   });
//   return NextResponse.json(records);
// }
//
// export async function POST(
//   request: NextRequest,
//   ctx: RouteContext<"/api/care-homes/[careHomeId]/patients/[patientId]/seizure-records">,
// ) {
//   const { user, response } = await requireAuth();
//   if (response) return response;
//
//   const { patientId } = await ctx.params;
//   const body = await request.json();
//   const record = await createSeizureRecord(db, {
//     ...body,
//     patientId,
//     recordedBy: user.id,
//   });
//   return NextResponse.json(record, { status: 201 });
// }
