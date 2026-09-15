// Disabled: these handlers had no authentication check, allowing anyone to
// list and create file records. Re-enable only with
// requireAuth()/authorization added.
export {};
//
// import { NextResponse } from "next/server";
// import { db } from "@/features/database";
// import { createFile, getFiles } from "@/features/database/queries";
//
// export async function GET(request: Request) {
//   const { searchParams } = new URL(request.url);
//   const offset = Number(searchParams.get("offset") ?? 0);
//   const limit = Number(searchParams.get("limit") ?? 100);
//
//   const files = await getFiles(db, { offset, limit });
//   return NextResponse.json(files);
// }
//
// export async function POST(request: Request) {
//   const body = await request.json();
//   const file = await createFile(db, body);
//   return NextResponse.json(file, { status: 201 });
// }
