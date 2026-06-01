"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { DASHBOARD_NAV } from "./dashboard-nav";
import { ArrowLeftIcon, DashboardIcon } from "./dashboard-icons";

export type DashboardUser = {
  displayName: string;
  contact: string;
  initials: string;
};

type DashboardSidebarProps = {
  user: DashboardUser;
};

export function DashboardSidebar({ user }: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  function isActive(href: string) {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  }

  return (
    <aside className="dashboard-sidebar">
      <div className="dashboard-sidebar-top">
        <Link href="/" className="dashboard-back-link">
          <ArrowLeftIcon className="h-4 w-4" />
          Back to home
        </Link>

        <nav className="dashboard-nav" aria-label="Dashboard">
          {DASHBOARD_NAV.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={`dashboard-nav-link ${isActive(item.href) ? "dashboard-nav-link-active" : ""}`}
            >
              <DashboardIcon name={item.icon} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>

      <div className="dashboard-sidebar-bottom">
        <button type="button" className="dashboard-team-button">
          Create a team
        </button>

        <div className="dashboard-user-card">
          <span className="dashboard-user-avatar" aria-hidden>
            {user.initials}
          </span>
          <div className="dashboard-user-meta">
            <span className="dashboard-user-name">{user.displayName}</span>
            <span className="dashboard-user-plan">{user.contact}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          className="dashboard-sign-out"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
