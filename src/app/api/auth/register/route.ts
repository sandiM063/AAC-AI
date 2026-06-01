import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { deliverOtp, OtpDeliveryError } from "@/lib/otp-delivery";
import {
  generateOtpCode,
  getOtpExpiryDate,
  hashOtp,
  maskEmail,
  maskPhone,
} from "@/lib/otp";
import { prisma } from "@/lib/prisma";
import {
  fieldErrors,
  normalizePhone,
  registerSchema,
} from "@/lib/validations/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", fieldErrors: fieldErrors(parsed.error.issues) },
        { status: 400 },
      );
    }

    const data = parsed.data;
    const isEmail = data.verificationMethod === "email";
    const email = isEmail ? data.email!.toLowerCase() : null;
    const countryCode = isEmail ? null : data.countryCode!;
    const phone = isEmail ? null : normalizePhone(data.phone!);

    if (isEmail && email) {
      const existingEmail = await prisma.user.findUnique({ where: { email } });
      if (existingEmail) {
        return NextResponse.json(
          { fieldErrors: { email: "An account with this email already exists" } },
          { status: 409 },
        );
      }
    } else if (countryCode && phone) {
      const existingPhone = await prisma.user.findUnique({
        where: { countryCode_phone: { countryCode, phone } },
      });
      if (existingPhone) {
        return NextResponse.json(
          { fieldErrors: { phone: "An account with this phone number already exists" } },
          { status: 409 },
        );
      }
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const otpCode = generateOtpCode();
    const otpHash = await hashOtp(otpCode);
    const otpExpiresAt = getOtpExpiryDate();

    const pending = await prisma.pendingRegistration.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email,
        countryCode,
        phone,
        password: passwordHash,
        method: data.verificationMethod.toUpperCase(),
        otpHash,
        otpExpiresAt,
      },
    });

    try {
      if (isEmail && email) {
        await deliverOtp(otpCode, {
          method: "email",
          email,
          firstName: data.firstName,
        });
      } else if (countryCode && phone) {
        await deliverOtp(otpCode, {
          method: "phone",
          countryCode,
          phone,
          firstName: data.firstName,
        });
      }
    } catch (deliveryError) {
      await prisma.pendingRegistration.delete({ where: { id: pending.id } });

      const message =
        deliveryError instanceof OtpDeliveryError
          ? deliveryError.message
          : "Could not send verification code. Please try again later.";

      return NextResponse.json({ error: message }, { status: 503 });
    }

    const destination = isEmail
      ? maskEmail(email!)
      : maskPhone(countryCode!, phone!);

    return NextResponse.json({
      pendingId: pending.id,
      firstName: data.firstName,
      method: data.verificationMethod,
      destination,
      expiresAt: otpExpiresAt.toISOString(),
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[AAC] Register failed:", error);
    }
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
