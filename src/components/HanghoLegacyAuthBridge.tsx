"use client";

import { useLayoutEffect } from "react";
import { auth } from "@/lib/backend/client";

declare global {
  interface Window {
    /** POS iframe (cùng origin) gọi để gửi Bearer tới /api/rtdb khi cookie HttpOnly không kèm theo (vd. Edge). */
    __hanghoGetIdToken?: () => Promise<string | null>;
  }
}

export default function HanghoLegacyAuthBridge() {
  useLayoutEffect(() => {
    window.__hanghoGetIdToken = async () => {
      const u = auth.currentUser;
      if (!u) return null;
      try {
        return await u.getIdToken();
      } catch {
        return null;
      }
    };
    return () => {
      delete window.__hanghoGetIdToken;
    };
  }, []);
  return null;
}
