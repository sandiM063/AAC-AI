import type { ReactNode } from "react";
import type { DashboardUser } from "./dashboard-sidebar";
import { DashboardShellClient } from "./dashboard-shell-client";
import type { StoredProfessionId } from "@/lib/professions";

type DashboardShellProps = {
  user: DashboardUser;
  userId: string;
  professionId: StoredProfessionId | null;
  wantsTutorial: boolean;
  children: ReactNode;
};

export function DashboardShell({
  user,
  userId,
  professionId,
  wantsTutorial,
  children,
}: DashboardShellProps) {
  return (
    <DashboardShellClient
      user={user}
      userId={userId}
      professionId={professionId}
      wantsTutorial={wantsTutorial}
    >
      {children}
    </DashboardShellClient>
  );
}
