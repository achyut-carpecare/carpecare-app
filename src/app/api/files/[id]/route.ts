// Disabled: these handlers had no authentication check, allowing anyone to
// view, modify, or delete any file record. Re-enable only with
// requireAuth()/authorization added.
//
// import { NextResponse } from "next/server";
// import { db } from "@/features/database";
// import {
//   deleteFileById,
//   getFileById,
//   updateFileById,
// } from "@/features/database/queries";
//
// export async function GET(
//   request: Request,
//   ctx: RouteContext<"/api/files/[id]">,
// ) {
//   const { id } = await ctx.params;
//   const file = await getFileById(db, id);
//
//   if (!file) {
//     return NextResponse.json({ error: "Not found" }, { status: 404 });
//   }
//
//   return NextResponse.json(file);
// }
//
// export async function PATCH(
//   request: Request,
//   ctx: RouteContext<"/api/files/[id]">,
// ) {
//   const { id } = await ctx.params;
//   const body = await request.json();
//   const file = await updateFileById(db, id, body);
//
//   if (!file) {
//     return NextResponse.json({ error: "Not found" }, { status: 404 });
//   }
//
//   return NextResponse.json(file);
// }
//
// export async function DELETE(
//   request: Request,
//   ctx: RouteContext<"/api/files/[id]">,
// ) {
//   const { id } = await ctx.params;
//   const file = await deleteFileById(db, id);
//
//   if (!file) {
//     return NextResponse.json({ error: "Not found" }, { status: 404 });
//   }
//
//   return NextResponse.json(file);
// }
