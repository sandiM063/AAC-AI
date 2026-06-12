"use client";

import { forwardRef } from "react";

type EyeGazeCursorProps = {
  visible: boolean;
};

export const EyeGazeCursor = forwardRef<HTMLDivElement, EyeGazeCursorProps>(
  function EyeGazeCursor({ visible }, ref) {
    if (!visible) return null;

    return (
      <div
        ref={ref}
        className="eye-gaze-cursor"
        data-eye-ignore
        aria-hidden
        style={{ display: "none", left: 0, top: 0 }}
      />
    );
  },
);
