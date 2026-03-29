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

/** Chuẩn hóa segment shop trên URL để so khớp với shopSlug trong hồ sơ (chữ thường, đã decode). */
export function normalizeShopPathSegment(raw: string): string {
  const s = String(raw ?? "").trim();
  if (!s) return "";
  try {
    return decodeURIComponent(s).trim().toLowerCase();
  } catch {
    return s.toLowerCase();
  }
}

/** Cho phép vào POS: đã kích hoạt hoặc đang chờ CK nâng cấp từ trial (vẫn dùng shop thử). */
export function paymentAllowsAppAccess(paymentStatus?: string) {
  const s = String(paymentStatus || "").trim();
  return s === "active" || s === "pending_upgrade";
}

/**
 * Ghi cookie phiên HttpOnly cho `/api/rtdb` và `/legacy`. Mạng chập chờn hoặc race sau đăng nhập
 * có thể làm lần POST đầu thất bại — gọi lại vài lần giảm tình trạng đổi trình duyệt/máy vẫn lỗi tải dữ liệu.
 */
export async function postSessionCookieWithRetries(
  idToken: string,
  options?: { shopSlug?: string },
): Promise<boolean> {
  const trimmed = String(idToken || "").trim();
  if (!trimmed) return false;
  const shop = String(options?.shopSlug || "").trim();
  const body = JSON.stringify(
    shop ? { idToken: trimmed, shopSlug: shop } : { idToken: trimmed },
  );
  const maxAttempts = 3;
  const baseMs = 100;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const ctrl = new AbortController();
      const timer = window.setTimeout(() => ctrl.abort(), 20000);
      try {
        const res = await fetch("/api/auth/session", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body,
          signal: ctrl.signal,
        });
        if (res.ok) return true;
      } finally {
        window.clearTimeout(timer);
      }
    } catch {
      // Mạng / abort — thử lại.
    }
    if (attempt < maxAttempts - 1) {
      await new Promise((r) => setTimeout(r, baseMs * (attempt + 1)));
    }
  }
  return false;
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
