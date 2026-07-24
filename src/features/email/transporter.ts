import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

// Validate environment variables
const requiredEnvVars = [
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS",
  "SMTP_FROM",
] as const;

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

export const transporter: Transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  // Dynamically adjust TLS settings based on the SMTP Host
  tls: process.env.SMTP_HOST === "smtp.office365.com"
    ? {
        ciphers: 'SSLv3',
        rejectUnauthorized: false, // Required specifically for Microsoft 365 basic SMTP handshakes
      }
    : {
        rejectUnauthorized: true,  // Keeps AWS SES completely strict and secure
      },
  debug: false,
  logger: false,
});

export const DEFAULT_FROM = {
  name: "Carpe Care",
  address: process.env.SMTP_FROM || process.env.SMTP_USER!,
};

// Verify connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.error("SMTP server is not ready to send emails", error);
  } else if (success) {
    console.log("SMTP server is ready to send emails");
  } else {
    console.error("SMTP server is not ready to send emails");
  }
});
