import { z } from "zod";
import { COUNTRY_CODES } from "@/lib/country-codes";
import { OTP_LENGTH } from "@/lib/otp";

const passwordSchema = z
  .string()
  .min(1, "Password is required")
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password is too long");

const dialCodes = COUNTRY_CODES.map((c) => c.dialCode);

export const loginSchema = z
  .object({
    loginMethod: z.enum(["email", "phone"]),
    email: z.string().trim().optional(),
    countryCode: z.string().trim().optional(),
    phone: z.string().trim().optional(),
    password: passwordSchema,
  })
  .superRefine((data, ctx) => {
    if (data.loginMethod === "email") {
      const emailResult = z
        .string()
        .min(1, "Email is required")
        .email("Enter a valid email address")
        .safeParse(data.email);

      if (!emailResult.success) {
        ctx.addIssue({
          code: "custom",
          path: ["email"],
          message: emailResult.error.issues[0]?.message ?? "Invalid email",
        });
      }
      return;
    }

    if (!data.countryCode || !dialCodes.includes(data.countryCode)) {
      ctx.addIssue({
        code: "custom",
        path: ["countryCode"],
        message: "Select a country code",
      });
    }

    const phoneDigits = (data.phone ?? "").replace(/\D/g, "");
    if (phoneDigits.length < 7 || phoneDigits.length > 15) {
      ctx.addIssue({
        code: "custom",
        path: ["phone"],
        message: "Enter a valid phone number (7–15 digits)",
      });
    }
  });

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(1, "First name is required")
      .max(50, "First name is too long"),
    lastName: z
      .string()
      .trim()
      .min(1, "Last name is required")
      .max(50, "Last name is too long"),
    verificationMethod: z.enum(["email", "phone"]),
    email: z.string().trim().optional(),
    countryCode: z.string().trim().optional(),
    phone: z.string().trim().optional(),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Passwords do not match",
      });
    }

    if (data.verificationMethod === "email") {
      const emailResult = z
        .string()
        .min(1, "Email is required")
        .email("Enter a valid email address")
        .safeParse(data.email);

      if (!emailResult.success) {
        ctx.addIssue({
          code: "custom",
          path: ["email"],
          message: emailResult.error.issues[0]?.message ?? "Invalid email",
        });
      }
      return;
    }

    if (!data.countryCode || !dialCodes.includes(data.countryCode)) {
      ctx.addIssue({
        code: "custom",
        path: ["countryCode"],
        message: "Select a country code",
      });
    }

    const phoneDigits = (data.phone ?? "").replace(/\D/g, "");
    if (phoneDigits.length < 7 || phoneDigits.length > 15) {
      ctx.addIssue({
        code: "custom",
        path: ["phone"],
        message: "Enter a valid phone number (7–15 digits)",
      });
    }
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const verifyOtpSchema = z.object({
  pendingId: z.string().min(1, "Invalid verification session"),
  code: z
    .string()
    .trim()
    .length(OTP_LENGTH, `Enter the ${OTP_LENGTH}-digit code`)
    .regex(
      new RegExp(`^\\d{${OTP_LENGTH}}$`),
      `Code must be ${OTP_LENGTH} digits`,
    ),
});

export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;

export const resendOtpSchema = z.object({
  pendingId: z.string().min(1, "Invalid verification session"),
});

export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function fieldErrors(
  issues: z.ZodIssue[],
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "_form");
    if (!errors[key]) {
      errors[key] = issue.message;
    }
  }
  return errors;
}
