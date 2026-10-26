// Disabled: requireAuth() only checks "is signed in", never that the caller
// belongs to this care home, so any authenticated user could GET/PATCH/DELETE
// any resident's record by ID (PHI exposure/write). Server Actions
// (src/app/app/care-homes/[careHomeId]/patients/lib/actions.ts) cover this
// functionality with proper membership checks. Re-enable only with an
// equivalent care-home membership check added.
export {};
//
// import { NextResponse, type NextRequest } from "next/server";
// import { requireAuth, notFound } from "@/features/auth/api";
// import { db } from "@/features/database";
// import {
//   deletePatientById,
//   getPatientById,
//   updatePatientById,
// } from "@/features/database/queries";
//
// export async function GET(
//   request: NextRequest,
//   ctx: RouteContext<"/api/care-homes/[careHomeId]/patients/[patientId]">,
// ) {
//   const auth = await requireAuth();
//   if (auth.response) return auth.response;
//
//   const { careHomeId, patientId } = await ctx.params;
//   const patient = await getPatientById(db, patientId, { careHomeId });
//   if (!patient) return notFound();
//   return NextResponse.json(patient);
// }
//
// export async function PATCH(
//   request: NextRequest,
//   ctx: RouteContext<"/api/care-homes/[careHomeId]/patients/[patientId]">,
// ) {
//   const auth = await requireAuth();
//   if (auth.response) return auth.response;
//
//   const { careHomeId, patientId } = await ctx.params;
//   const body = await request.json();
//   const patient = await updatePatientById(db, patientId, body, { careHomeId });
//   if (!patient) return notFound();
//   return NextResponse.json(patient);
// }
//
// export async function DELETE(
//   request: NextRequest,
//   ctx: RouteContext<"/api/care-homes/[careHomeId]/patients/[patientId]">,
// ) {
//   const auth = await requireAuth();
//   if (auth.response) return auth.response;
//
//   const { careHomeId, patientId } = await ctx.params;
//   const patient = await deletePatientById(db, patientId, { careHomeId });
//   if (!patient) return notFound();
//   return NextResponse.json(patient);
// }
