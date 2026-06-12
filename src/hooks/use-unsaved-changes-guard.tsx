"use client";

import { UnsavedChangesDialog } from "@/components/dashboard/unsaved-changes-dialog";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type UseUnsavedChangesGuardOptions = {
  hasUnsavedChanges: boolean;
  onSave: () => Promise<boolean>;
  onDiscard: () => void;
};

function isInternalNavigation(href: string) {
  if (!href || href.startsWith("#")) return false;
  if (href.startsWith("mailto:") || href.startsWith("tel:")) return false;

  try {
    const url = new URL(href, window.location.href);
    if (url.origin !== window.location.origin) return false;
    if (url.pathname === window.location.pathname && url.search === window.location.search) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function useUnsavedChangesGuard({
  hasUnsavedChanges,
  onSave,
  onDiscard,
}: UseUnsavedChangesGuardOptions) {
  const router = useRouter();
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const closeDialog = useCallback(() => {
    setDialogOpen(false);
    setPendingHref(null);
  }, []);

  const requestNavigation = useCallback((href: string) => {
    setPendingHref(href);
    setDialogOpen(true);
  }, []);

  useEffect(() => {
    if (!hasUnsavedChanges) return;

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    if (!hasUnsavedChanges) return;

    function handleClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = (event.target as HTMLElement).closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || !isInternalNavigation(href)) return;

      event.preventDefault();
      event.stopPropagation();
      requestNavigation(href);
    }

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [hasUnsavedChanges, requestNavigation]);

  const handleStay = useCallback(() => {
    closeDialog();
  }, [closeDialog]);

  const handleDiscard = useCallback(() => {
    const href = pendingHref;
    onDiscard();
    closeDialog();
    if (href) router.push(href);
  }, [pendingHref, onDiscard, closeDialog, router]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const saved = await onSave();
      if (!saved) return;

      const href = pendingHref;
      closeDialog();
      if (href) router.push(href);
    } finally {
      setIsSaving(false);
    }
  }, [onSave, pendingHref, closeDialog, router]);

  function UnsavedChangesPrompt() {
    return (
      <UnsavedChangesDialog
        open={dialogOpen}
        isSaving={isSaving}
        onStay={handleStay}
        onDiscard={handleDiscard}
        onSave={() => void handleSave()}
      />
    );
  }

  return { UnsavedChangesPrompt };
}
