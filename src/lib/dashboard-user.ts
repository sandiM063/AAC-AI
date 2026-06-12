import { getAvatarUrl } from "@/lib/profile-image-url";
import { getProfessionLabel } from "@/lib/professions";

export type DashboardUserRecord = {
  firstName: string;
  lastName: string;
  email: string | null;
  countryCode: string | null;
  phone: string | null;
  profession: string | null;
  profileImageUpdatedAt?: Date | null;
};

export function toDashboardUser(user: DashboardUserRecord) {
  const displayName = `${user.firstName} ${user.lastName}`.trim();
  const professionLabel = getProfessionLabel(user.profession);
  const contact =
    professionLabel ??
    user.email ??
    (user.countryCode && user.phone
      ? `${user.countryCode} ${user.phone}`
      : "AAC account");

  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`
    .toUpperCase()
    .slice(0, 2);

  return {
    displayName,
    contact,
    initials,
    professionId: user.profession,
    avatarUrl: getAvatarUrl(user.profileImageUpdatedAt),
  };
}
