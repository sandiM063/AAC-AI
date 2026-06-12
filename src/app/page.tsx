import { LandingPage } from "@/components/landing/landing-page";
import { getCurrentUser, userNeedsOnboarding } from "@/lib/user-session";
import { redirect } from "next/navigation";

export default async function Home() {
  const user = await getCurrentUser();

  if (user) {
    if (userNeedsOnboarding(user)) {
      redirect("/onboarding");
    }
    redirect("/dashboard");
  }

  return <LandingPage />;
}
