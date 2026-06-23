"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/features/database";
import { createPatient, updatePatientById } from "@/features/database/queries";

export async function updatePatientAction({
  careHomeId,
  patientId,
  firstName,
  lastName,
  dateOfBirth,
  nhsNumber,
}: {
  careHomeId: string;
  patientId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nhsNumber?: string;
}) {
  try {
    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();

    if (!trimmedFirstName || !trimmedLastName || !dateOfBirth) {
      return { error: "First name, last name and date of birth are required" };
    }

    const patient = await updatePatientById(
      db,
      patientId,
      {
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
        dateOfBirth,
        nhsNumber: nhsNumber?.trim() || null,
      },
      { careHomeId },
    );

    if (!patient) {
      return { error: "Resident not found" };
    }

    revalidatePath(`/app/care-homes/${careHomeId}/patients`);
    revalidatePath(`/app/care-homes/${careHomeId}/patients/${patientId}`);

    return { success: true, patient };
  } catch (error) {
    console.error("Failed to update patient:", error);
    return { error: "Failed to update resident" };
  }
}

export async function createPatientAction({
  careHomeId,
  firstName,
  lastName,
  dateOfBirth,
  nhsNumber,
}: {
  careHomeId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nhsNumber?: string;
}) {
  try {
    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();

    if (!trimmedFirstName || !trimmedLastName || !dateOfBirth) {
      return { error: "First name, last name and date of birth are required" };
    }

    const patient = await createPatient(db, {
      careHomeId,
      firstName: trimmedFirstName,
      lastName: trimmedLastName,
      dateOfBirth,
      nhsNumber: nhsNumber?.trim() || null,
    });

    revalidatePath(`/app/care-homes/${careHomeId}/patients`);

    return {
      success: true,
      patient,
      redirectTo: `/app/care-homes/${careHomeId}/patients/${patient.id}`,
    };
  } catch (error) {
    console.error("Failed to create patient:", error);
    return { error: "Failed to create resident" };
  }
}
