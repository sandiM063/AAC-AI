"use client";

import { useTranslation } from "@/components/i18n/language-provider";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DASHBOARD_NAV } from "./dashboard-nav";
import { ArrowLeftIcon, DashboardIcon } from "./dashboard-icons";
import { ProfileAvatar } from "./profile-avatar";

export type DashboardUser = {
  displayName: string;
  contact: string;
  initials: string;
  avatarUrl: string | null;
};

type DashboardSidebarProps = {
  id?: string;
  user: DashboardUser;
  onNavigate?: () => void;
  onClose?: () => void;
};

export function DashboardSidebar({ id, user, onNavigate, onClose }: DashboardSidebarProps) {
  const { t } = useTranslation();
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  }

  return (
    <aside id={id} className="dashboard-sidebar">
      <div className="dashboard-sidebar-header-row">
        <span className="dashboard-sidebar-title">Menu</span>
        {onClose && (
          <button
            type="button"
            className="dashboard-sidebar-close"
            aria-label="Close menu"
            onClick={onClose}
          >
            ×
          </button>
        )}
      </div>

      <div className="dashboard-sidebar-top">
        <Link href="/" className="dashboard-back-link" onClick={onNavigate}>
          <ArrowLeftIcon className="h-4 w-4" />
          {t("common.backToHome")}
        </Link>

        <nav className="dashboard-nav" aria-label="Dashboard">
          {DASHBOARD_NAV.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              onClick={onNavigate}
              data-tutorial={`nav-${item.id}`}
              data-eye-action
              className={`dashboard-nav-link ${isActive(item.href) ? "dashboard-nav-link-active" : ""}`}
            >
              <DashboardIcon name={item.icon} />
              <span>{t(`nav.${item.id}`)}</span>
            </Link>
          ))}
        </nav>
      </div>

      <div className="dashboard-sidebar-bottom">
        <button type="button" className="dashboard-team-button">
          {t("common.createTeam")}
        </button>

        <div className="dashboard-user-card">
          <ProfileAvatar
            initials={user.initials}
            imageUrl={user.avatarUrl}
            size="sidebar"
          />
          <div className="dashboard-user-meta">
            <span className="dashboard-user-name">{user.displayName}</span>
            <span className="dashboard-user-plan">{user.contact}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
