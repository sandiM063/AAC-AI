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
      theme: true,
      language: true,
      aacExperience: true,
      wantsTutorial: true,
      onboardingCompletedAt: true,
      profileImageUpdatedAt: true,
      createdAt: true,
    },
  });
}

export function userNeedsOnboarding(user: {
  onboardingCompletedAt: Date | null;
}) {
  return !user.onboardingCompletedAt;
}

/** @deprecated Use userNeedsOnboarding */
export function userNeedsProfession(user: { profession: string | null }) {
  return !user.profession;
}
