import { Resend } from "resend";

const requiredEnvVars = ["RESEND_API_KEY", "EMAIL_FROM"] as const;

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

export const resend = new Resend(process.env.RESEND_API_KEY);

export const DEFAULT_FROM = `Carpe Care <${process.env.EMAIL_FROM}>`;
