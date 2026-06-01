import type { ReactNode } from "react";
import { DashboardSidebar, type DashboardUser } from "./dashboard-sidebar";

type DashboardShellProps = {
  user: DashboardUser;
  children: ReactNode;
};

export function DashboardShell({ user, children }: DashboardShellProps) {
  return (
    <div className="dashboard-layout">
      <DashboardSidebar user={user} />
      <div className="dashboard-main">{children}</div>
    </div>
  );
}
