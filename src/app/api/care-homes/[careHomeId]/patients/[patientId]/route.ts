import { NextResponse, type NextRequest } from "next/server";
import { requireAuth, notFound } from "@/features/auth/api";
import { db } from "@/features/database";
import {
  deletePatientById,
  getPatientById,
  updatePatientById,
} from "@/features/database/queries";

export async function GET(
  request: NextRequest,
  ctx: RouteContext<"/api/care-homes/[careHomeId]/patients/[patientId]">,
) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  const { careHomeId, patientId } = await ctx.params;
  const patient = await getPatientById(db, patientId, { careHomeId });
  if (!patient) return notFound();
  return NextResponse.json(patient);
}

export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/care-homes/[careHomeId]/patients/[patientId]">,
) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  const { careHomeId, patientId } = await ctx.params;
  const body = await request.json();
  const patient = await updatePatientById(db, patientId, body, { careHomeId });
  if (!patient) return notFound();
  return NextResponse.json(patient);
}

export async function DELETE(
  request: NextRequest,
  ctx: RouteContext<"/api/care-homes/[careHomeId]/patients/[patientId]">,
) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  const { careHomeId, patientId } = await ctx.params;
  const patient = await deletePatientById(db, patientId, { careHomeId });
  if (!patient) return notFound();
  return NextResponse.json(patient);
}
