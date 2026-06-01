import { prisma } from "@/lib/prisma";
import { normalizePhone } from "@/lib/validations/auth";

export async function findUserByLogin(input: {
  loginMethod: "email" | "phone";
  email?: string;
  countryCode?: string;
  phone?: string;
}) {
  if (input.loginMethod === "email") {
    return prisma.user.findUnique({
      where: { email: input.email!.toLowerCase() },
    });
  }

  return prisma.user.findUnique({
    where: {
      countryCode_phone: {
        countryCode: input.countryCode!,
        phone: normalizePhone(input.phone!),
      },
    },
  });
}
