import { ProfessionPicker } from "@/components/onboarding/profession-picker";
import { getCurrentUser, userNeedsProfession } from "@/lib/user-session";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function ProfessionOnboardingPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (!userNeedsProfession(user)) {
    redirect("/dashboard");
  }

  return (
    <div className="profession-page">
      <div className="profession-page-inner">
        <Link href="/" className="profession-brand">
          <span className="profession-brand-mark">AAC</span>
          <span>AAC Communicate</span>
        </Link>

        <ProfessionPicker firstName={user.firstName} />
      </div>
    </div>
  );
}
