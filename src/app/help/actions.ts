"use server";

import { sendHelpRequestEmail } from "@/features/email";

export async function sendHelpMessageAction(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim();
  const message = (formData.get("message") as string)?.trim();

  if (!name) {
    return { error: "Your name is required" };
  }

  if (!email || !email.includes("@")) {
    return { error: "A valid email address is required" };
  }

  if (!message) {
    return { error: "Please enter a message" };
  }

  try {
    await sendHelpRequestEmail({ fromName: name, fromEmail: email, message });
  } catch (error) {
    console.error("Failed to send help request:", error);
    return { error: "Failed to send your message. Please try again." };
  }

  return { success: true };
}
