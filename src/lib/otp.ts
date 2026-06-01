import bcrypt from "bcryptjs";
import { randomInt } from "crypto";

export const OTP_TTL_SECONDS = 60;
export const OTP_LENGTH = 5;

export function generateOtpCode(): string {
  return String(randomInt(10 ** (OTP_LENGTH - 1), 10 ** OTP_LENGTH));
}

export async function hashOtp(code: string): Promise<string> {
  return bcrypt.hash(code, 10);
}

export async function verifyOtp(
  code: string,
  otpHash: string,
): Promise<boolean> {
  return bcrypt.compare(code, otpHash);
}

export function getOtpExpiryDate(): Date {
  return new Date(Date.now() + OTP_TTL_SECONDS * 1000);
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${"*".repeat(Math.max(local.length - 2, 1))}@${domain}`;
}

export function maskPhone(countryCode: string, phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const lastThree = digits.slice(-3);
  return `${countryCode} XXXXXXX${lastThree}`;
}
