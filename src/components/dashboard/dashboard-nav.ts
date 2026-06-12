export type DashboardNavItem = {
  id: string;
  href: string;
  icon: string;
};

export const DASHBOARD_NAV: DashboardNavItem[] = [
  { id: "overview", href: "/dashboard", icon: "overview" },
  { id: "communication", href: "/dashboard/communication", icon: "communication" },
  { id: "boards", href: "/dashboard/boards", icon: "boards" },
  { id: "assistant", href: "/dashboard/assistant", icon: "assistant" },
  { id: "settings", href: "/dashboard/settings", icon: "settings" },
  { id: "profile", href: "/dashboard/profile", icon: "profile" },
  { id: "help", href: "/dashboard/help", icon: "help" },
];
