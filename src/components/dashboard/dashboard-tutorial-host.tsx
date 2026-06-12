"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { getTutorialForPath } from "@/lib/tutorials/registry";
import { isTutorialComplete, markTutorialComplete } from "@/lib/tutorials/storage";
import { SectionTutorial } from "./section-tutorial";

type DashboardTutorialHostProps = {
  userId: string;
  wantsTutorial: boolean;
  children: ReactNode;
};

export function DashboardTutorialHost({
  userId,
  wantsTutorial,
  children,
}: DashboardTutorialHostProps) {
  const pathname = usePathname();
  const config = getTutorialForPath(pathname);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!wantsTutorial || !config) {
      setActive(false);
      return;
    }

    setActive(!isTutorialComplete(userId, config.id));
  }, [wantsTutorial, config, userId, pathname]);

  function handleDismiss() {
    if (!config) return;
    markTutorialComplete(userId, config.id);
    setActive(false);
  }

  return (
    <>
      {children}
      {active && config && (
        <SectionTutorial config={config} onComplete={handleDismiss} onSkip={handleDismiss} />
      )}
    </>
  );
}
