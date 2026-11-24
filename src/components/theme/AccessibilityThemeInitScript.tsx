"use client";

import { ACCESSIBILITY_THEME_INIT_SCRIPT } from "../../lib/theme/accessible-palettes";

export function AccessibilityThemeInitScript() {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: ACCESSIBILITY_THEME_INIT_SCRIPT }}
    />
  );
}
