import { randomBytes, createHash, timingSafeEqual } from "crypto";

export function generateToken(length = 32): string {
  return randomBytes(length).toString("hex");
}

export function generateOtp(length = 6): string {
  const min = 10 ** (length - 1);
  const max = 10 ** length - 1;
  return Math.floor(Math.random() * (max - min + 1) + min).toString();
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function compareTokenHash(token: string, hash: string): boolean {
  const generatedHash = hashToken(token);
  try {
    return timingSafeEqual(
      Buffer.from(generatedHash, "hex"),
      Buffer.from(hash, "hex"),
    );
  } catch {
    return false;
  }
}
