// Disabled: these handlers had no authentication check. PATCH in particular
// accepted an arbitrary body written straight to the row, including
// isSystemAdmin - an unauthenticated full privilege escalation. Re-enable
// only with requireAuth()/authorization added, and never allow isSystemAdmin
// to be set from a client-supplied body.
export {};
//
// import { NextResponse } from "next/server";
// import { db } from "@/features/database";
// import {
//   deleteUserProfileById,
//   getUserProfileById,
//   updateUserProfileById,
// } from "@/features/database/queries";
//
// export async function GET(
//   request: Request,
//   ctx: RouteContext<"/api/user-profiles/[id]">,
// ) {
//   const { id } = await ctx.params;
//   const profile = await getUserProfileById(db, id);
//
//   if (!profile) {
//     return NextResponse.json({ error: "Not found" }, { status: 404 });
//   }
//
//   return NextResponse.json(profile);
// }
//
// export async function PATCH(
//   request: Request,
//   ctx: RouteContext<"/api/user-profiles/[id]">,
// ) {
//   const { id } = await ctx.params;
//   const body = await request.json();
//   const profile = await updateUserProfileById(db, id, body);
//
//   if (!profile) {
//     return NextResponse.json({ error: "Not found" }, { status: 404 });
//   }
//
//   return NextResponse.json(profile);
// }
//
// export async function DELETE(
//   request: Request,
//   ctx: RouteContext<"/api/user-profiles/[id]">,
// ) {
//   const { id } = await ctx.params;
//   const profile = await deleteUserProfileById(db, id);
//
//   if (!profile) {
//     return NextResponse.json({ error: "Not found" }, { status: 404 });
//   }
//
//   return NextResponse.json(profile);
// }
