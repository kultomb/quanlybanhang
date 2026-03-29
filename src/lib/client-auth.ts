"use client";

import { signOut } from "firebase/auth";
import { auth } from "@/lib/backend/client";

const LOGIN_REDIRECT = "/login?reason=missing-shop";

function clearClientUserState() {
  try {
    sessionStorage.clear();
  } catch {
    // Ignore storage permission errors.
  }

  try {
    const keys = Object.keys(localStorage);
    for (const key of keys) {
      const normalized = key.toLowerCase();
      if (
        normalized.includes("firebase") ||
        normalized.includes("auth") ||
        normalized.includes("shop") ||
        normalized.includes("payment") ||
        normalized.includes("user")
      ) {
        localStorage.removeItem(key);
      }
    }
  } catch {
    // Ignore storage permission errors.
  }
}

export function hasValidShopSlug(value?: string) {
  return Boolean(String(value || "").trim());
}

/** Cho phép vào POS: đã kích hoạt hoặc đang chờ CK nâng cấp từ trial (vẫn dùng shop thử). */
export function paymentAllowsAppAccess(paymentStatus?: string) {
  const s = String(paymentStatus || "").trim();
  return s === "active" || s === "pending_upgrade";
}

export async function forceLogoutMissingShop(redirectUrl = LOGIN_REDIRECT) {
  try {
    await signOut(auth);
  } catch {
    // Continue cleanup even when Firebase sign-out fails.
  }

  await fetch("/api/auth/session", { method: "DELETE" }).catch(() => undefined);
  clearClientUserState();

  if (typeof window === "undefined") return;
  const target = redirectUrl;
  try {
    if (window.top && window.top !== window) {
      window.top.location.href = target;
      return;
    }
  } catch {
    // Ignore cross-frame redirect issues.
  }
  window.location.href = target;
}
