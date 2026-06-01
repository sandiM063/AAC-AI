import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { toDashboardUser } from "@/lib/dashboard-user";
import { getCurrentUser, userNeedsProfession } from "@/lib/user-session";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (userNeedsProfession(user)) {
    redirect("/onboarding/profession");
  }

  return (
    <DashboardShell user={toDashboardUser(user)}>{children}</DashboardShell>
  );
}
