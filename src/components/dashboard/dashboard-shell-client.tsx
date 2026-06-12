"use client";

import type { ReactNode } from "react";
import { useEffect, useLayoutEffect, useState } from "react";
import { EyeControlProvider } from "@/components/eye-control/eye-control-provider";
import { isEyeControlFeatureEnabled } from "@/lib/eye-control/feature-flag";
import { applyProfessionPresetsIfNeeded } from "@/lib/presets/profession-presets";
import type { StoredProfessionId } from "@/lib/professions";
import { DashboardTutorialHost } from "./dashboard-tutorial-host";
import { DashboardSidebar, type DashboardUser } from "./dashboard-sidebar";

type DashboardShellClientProps = {
  user: DashboardUser;
  userId: string;
  professionId: StoredProfessionId | null;
  wantsTutorial: boolean;
  children: ReactNode;
};

export function DashboardShellClient({
  user,
  userId,
  professionId,
  wantsTutorial,
  children,
}: DashboardShellClientProps) {
  const [navOpen, setNavOpen] = useState(false);

  useLayoutEffect(() => {
    applyProfessionPresetsIfNeeded(userId, professionId);
  }, [userId, professionId]);

  useEffect(() => {
    function handleTutorialNav() {
      setNavOpen(true);
    }

    window.addEventListener("tutorial-highlight-nav", handleTutorialNav);
    return () => window.removeEventListener("tutorial-highlight-nav", handleTutorialNav);
  }, []);

  useEffect(() => {
    if (!navOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setNavOpen(false);
    }

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [navOpen]);

  return (
    <div className={`dashboard-layout ${navOpen ? "dashboard-layout-nav-open" : ""}`}>
      <header className="dashboard-mobile-bar">
        <button
          type="button"
          className="dashboard-menu-toggle"
          aria-expanded={navOpen}
          aria-controls="dashboard-sidebar"
          onClick={() => setNavOpen((open) => !open)}
        >
          <span className="dashboard-menu-toggle-icon" aria-hidden />
          <span className="dashboard-menu-toggle-label">
            {navOpen ? "Close menu" : "Open menu"}
          </span>
        </button>
        <span className="dashboard-mobile-bar-title">AAC Communicate</span>
      </header>

      <button
        type="button"
        className="dashboard-sidebar-backdrop"
        aria-hidden={!navOpen}
        tabIndex={navOpen ? 0 : -1}
        onClick={() => setNavOpen(false)}
      />

      <DashboardSidebar
        id="dashboard-sidebar"
        user={user}
        onNavigate={() => setNavOpen(false)}
        onClose={() => setNavOpen(false)}
      />

      <div className="dashboard-main">
        {isEyeControlFeatureEnabled() ? (
          <EyeControlProvider userId={userId}>
            <DashboardTutorialHost userId={userId} wantsTutorial={wantsTutorial}>
              {children}
            </DashboardTutorialHost>
          </EyeControlProvider>
        ) : (
          <DashboardTutorialHost userId={userId} wantsTutorial={wantsTutorial}>
            {children}
          </DashboardTutorialHost>
        )}
      </div>
    </div>
  );
}
