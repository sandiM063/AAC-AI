import { getCurrentUser, userNeedsProfession } from "@/lib/user-session";
import { redirect } from "next/navigation";

export default async function Home() {
  const user = await getCurrentUser();

  if (user) {
    if (userNeedsProfession(user)) {
      redirect("/onboarding/profession");
    }
    redirect("/dashboard");
  }

  redirect("/login");
}
