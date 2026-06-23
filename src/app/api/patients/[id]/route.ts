import { NextResponse } from "next/server";
import { db } from "@/features/database";
import {
  deletePatientById,
  getPatientById,
  updatePatientById,
} from "@/features/database/queries";

export async function GET(
  request: Request,
  ctx: RouteContext<"/api/patients/[id]">,
) {
  const { id } = await ctx.params;
  const patient = await getPatientById(db, id);

  if (!patient) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(patient);
}

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/patients/[id]">,
) {
  const { id } = await ctx.params;
  const body = await request.json();
  const patient = await updatePatientById(db, id, body);

  if (!patient) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(patient);
}

export async function DELETE(
  request: Request,
  ctx: RouteContext<"/api/patients/[id]">,
) {
  const { id } = await ctx.params;
  const patient = await deletePatientById(db, id);

  if (!patient) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(patient);
}
