"use client";

import { useCallback, useState } from "react";

export function useReadonlyUntilFocus() {
  const [readonly, setReadonly] = useState(true);

  const unlock = useCallback(() => {
    setReadonly(false);
  }, []);

  return { readonly, unlock };
}
