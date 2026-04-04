"use client";

import type { ReactNode } from "react";

/** Khung flex cho /[shop]; banner trial nằm ở root (<TrialBannerOutlet />). */
export default function ShopLayoutChrome({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        width: "100%",
      }}
    >
      {children}
    </div>
  );
}
