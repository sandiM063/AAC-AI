export type DashboardNavItem = {
  id: string;
  label: string;
  href: string;
  icon: string;
};

export const DASHBOARD_NAV: DashboardNavItem[] = [
  { id: "overview", label: "Overview", href: "/dashboard", icon: "overview" },
  {
    id: "communication",
    label: "Communication",
    href: "/dashboard/communication",
    icon: "communication",
  },
  { id: "boards", label: "Boards", href: "/dashboard/boards", icon: "boards" },
  {
    id: "assistant",
    label: "AI Assistant",
    href: "/dashboard/assistant",
    icon: "assistant",
  },
  { id: "settings", label: "Settings", href: "/dashboard/settings", icon: "settings" },
  { id: "profile", label: "Profile", href: "/dashboard/profile", icon: "profile" },
  { id: "help", label: "Help & Support", href: "/dashboard/help", icon: "help" },
];
