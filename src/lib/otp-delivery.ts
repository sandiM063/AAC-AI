import { OTP_TTL_SECONDS } from "@/lib/otp";
import { Resend } from "resend";
import twilio from "twilio";

export class OtpDeliveryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OtpDeliveryError";
  }
}

export type OtpDeliveryTarget =
  | { method: "email"; email: string; firstName: string }
  | {
      method: "phone";
      countryCode: string;
      phone: string;
      firstName: string;
    };

export type OtpDeliveryResult = {
  channel: "email" | "sms";
};

function otpMessage(firstName: string, code: string): string {
  return `Hello ${firstName}, your AAC Communicate verification code is ${code}. It expires in ${OTP_TTL_SECONDS} seconds.`;
}

function toE164(countryCode: string, phone: string): string {
  const dialDigits = countryCode.replace(/\D/g, "");
  const phoneDigits = phone.replace(/\D/g, "");
  return `+${dialDigits}${phoneDigits}`;
}

function toOtpDeliveryError(error: unknown): OtpDeliveryError {
  if (error instanceof OtpDeliveryError) {
    return error;
  }

  if (error && typeof error === "object" && "code" in error) {
    const twilioCode = (error as { code?: number }).code;

    if (twilioCode === 21266) {
      return new OtpDeliveryError(
        "TWILIO_PHONE_NUMBER must be a Twilio-purchased sender number — not the same as the user's personal phone.",
      );
    }

    if (twilioCode === 21608 || twilioCode === 21408) {
      return new OtpDeliveryError(
        "This phone number must be verified in Twilio first (Console → Phone Numbers → Verified Caller IDs).",
      );
    }
  }

  if (error && typeof error === "object" && "message" in error) {
    const message = String((error as { message: unknown }).message);
    if (message) {
      return new OtpDeliveryError(message);
    }
  }

  return new OtpDeliveryError(
    "Could not send verification code. Please try again later.",
  );
}

async function sendEmailOtp(
  email: string,
  code: string,
  firstName: string,
): Promise<OtpDeliveryResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.OTP_EMAIL_FROM;

  if (!apiKey || !from) {
    throw new OtpDeliveryError(
      "Email OTP is not configured. Set RESEND_API_KEY and OTP_EMAIL_FROM in your .env file.",
    );
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: email,
    subject: `${code} is your AAC verification code`,
    text: otpMessage(firstName, code),
  });

  if (error) {
    throw new OtpDeliveryError(error.message);
  }

  return { channel: "email" };
}

async function sendSmsOtp(
  countryCode: string,
  phone: string,
  code: string,
  firstName: string,
): Promise<OtpDeliveryResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    throw new OtpDeliveryError(
      "SMS OTP is not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in your .env file.",
    );
  }

  try {
    const client = twilio(accountSid, authToken);
    await client.messages.create({
      from: fromNumber,
      to: toE164(countryCode, phone),
      body: otpMessage(firstName, code),
    });
  } catch (error) {
    throw toOtpDeliveryError(error);
  }

  return { channel: "sms" };
}

export async function deliverOtp(
  code: string,
  target: OtpDeliveryTarget,
): Promise<OtpDeliveryResult> {
  if (target.method === "email") {
    return sendEmailOtp(target.email, code, target.firstName);
  }

  return sendSmsOtp(
    target.countryCode,
    target.phone,
    code,
    target.firstName,
  );
}

export function isOtpDeliveryConfigured(
  method: "email" | "phone",
): boolean {
  if (method === "email") {
    return Boolean(process.env.RESEND_API_KEY && process.env.OTP_EMAIL_FROM);
  }

  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_PHONE_NUMBER,
  );
}
