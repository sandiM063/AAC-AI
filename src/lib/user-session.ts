import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";

export async function getCurrentUser() {
  const userId = await getSessionUserId();
  if (!userId) return null;

  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      countryCode: true,
      phone: true,
      profession: true,
      professionSelectedAt: true,
    },
  });
}

export function userNeedsProfession(user: { profession: string | null }) {
  return !user.profession;
}
