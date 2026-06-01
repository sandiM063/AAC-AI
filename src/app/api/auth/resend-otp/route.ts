import { NextResponse } from "next/server";
import { deliverOtp, OtpDeliveryError } from "@/lib/otp-delivery";
import {
  generateOtpCode,
  getOtpExpiryDate,
  hashOtp,
  maskEmail,
  maskPhone,
  OTP_TTL_SECONDS,
} from "@/lib/otp";
import { prisma } from "@/lib/prisma";
import { resendOtpSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = resendOtpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid session" }, { status: 400 });
    }

    const pending = await prisma.pendingRegistration.findUnique({
      where: { id: parsed.data.pendingId },
    });

    if (!pending) {
      return NextResponse.json(
        { error: "Verification session expired. Please register again." },
        { status: 404 },
      );
    }

    const otpCode = generateOtpCode();
    const otpHash = await hashOtp(otpCode);
    const otpExpiresAt = getOtpExpiryDate();

    const isEmail = pending.method === "EMAIL";

    try {
      if (isEmail && pending.email) {
        await deliverOtp(otpCode, {
          method: "email",
          email: pending.email,
          firstName: pending.firstName,
        });
      } else if (pending.countryCode && pending.phone) {
        await deliverOtp(otpCode, {
          method: "phone",
          countryCode: pending.countryCode,
          phone: pending.phone,
          firstName: pending.firstName,
        });
      }
    } catch (deliveryError) {
      const message =
        deliveryError instanceof OtpDeliveryError
          ? deliveryError.message
          : "Could not resend verification code.";

      return NextResponse.json({ error: message }, { status: 503 });
    }

    await prisma.pendingRegistration.update({
      where: { id: pending.id },
      data: { otpHash, otpExpiresAt },
    });

    const destination = isEmail
      ? maskEmail(pending.email!)
      : maskPhone(pending.countryCode!, pending.phone!);

    return NextResponse.json({
      destination,
      expiresAt: otpExpiresAt.toISOString(),
      ttlSeconds: OTP_TTL_SECONDS,
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[AAC] Resend OTP failed:", error);
    }
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
