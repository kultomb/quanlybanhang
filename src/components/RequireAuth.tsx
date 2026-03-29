"use client";

import { auth } from "@/lib/backend/client";
import { onAuthStateChanged } from "firebase/auth";
import { ReactNode, useEffect, useState } from "react";
import { fetchUserProfileClient } from "@/lib/user-profile-client";
import {
  forceLogoutMissingShop,
  hasValidShopSlug,
  normalizeShopSlugClient,
  paymentAllowsAppAccess,
  postSessionCookieWithRetries,
} from "@/lib/client-auth";
import { isEffectiveTrialAccount, syncTrialUiSessionFlag } from "@/lib/trial-shop";

function toPaymentRequiredPath(shopSlug?: string) {
  const shop = String(shopSlug || "").trim();
  return shop ? `/payment-required?shop=${encodeURIComponent(shop)}` : "/payment-required";
}

type RequireAuthProps = {
  children?: ReactNode;
  /**
   * Route /[shop]: render với `shopSlug` từ hồ sơ Firebase — không dùng segment URL (tránh hiển thị slug rác
   * trong khi `/api/rtdb` vẫn map đúng kho).
   */
  renderShop?: (ctx: { shopSlug: string }) => ReactNode;
  /**
   * Khi có (route /[shop]), bắt buộc khớp với shopSlug trong hồ sơ — tránh mở POS tại /src, /12345…
   * vẫn dùng cookie/iframe của shop khác.
   */
  pathShopFromUrl?: string;
};

function redirectIfUrlShopMismatch(
  pathShopFromUrl: string | undefined,
  profileSlug: string,
  reg: boolean | null,
): boolean {
  if (pathShopFromUrl === undefined) return false;
  const seg = String(pathShopFromUrl).trim();
  if (!seg) return false;
  if (normalizeShopSlugClient(seg) === normalizeShopSlugClient(profileSlug)) return false;
  const trialQs = isEffectiveTrialAccount(reg, profileSlug) ? "?trial=1" : "";
  const target = `/${encodeURIComponent(profileSlug)}${trialQs}`;
  try {
    if (window.top && window.top !== window) {
      window.top.location.replace(target);
      return true;
    }
  } catch {
    // Ignore.
  }
  window.location.replace(target);
  return true;
}

export default function RequireAuth({ children, renderShop, pathShopFromUrl }: RequireAuthProps) {
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [resolvedShopSlug, setResolvedShopSlug] = useState<string | null>(null);

  useEffect(() => {
    let disposed = false;
    let forcingLogout = false;
    const redirectToLogin = () => {
      try {
        if (window.top && window.top !== window) {
          window.top.location.href = "/login";
          return;
        }
      } catch {
        // Ignore cross-frame redirect issues.
      }
      window.location.href = "/login";
    };

    const clearServerSession = async () => {
      try {
        await fetch("/api/auth/session", { method: "DELETE" });
      } catch {
        // Ignore.
      }
    };

    const syncIdTokenToCookie = async (shopSlug: string): Promise<boolean> => {
      try {
        const user = auth.currentUser;
        if (!user) return false;
        const slug = String(shopSlug || "").trim();
        let token = await user.getIdToken();
        let ok = await postSessionCookieWithRetries(token, slug ? { shopSlug: slug } : undefined);
        if (!ok) {
          token = await user.getIdToken(true);
          ok = await postSessionCookieWithRetries(token, slug ? { shopSlug: slug } : undefined);
        }
        return ok;
      } catch {
        return false;
      }
    };

    let settled = false;
    const unsub = onAuthStateChanged(auth, (user) => {
      settled = true;
      if (!user) {
        window.setTimeout(() => {
          if (disposed) return;
          const restoredUser = auth.currentUser;
          if (restoredUser) return;
          setAuthed(false);
          setReady(true);
          void clearServerSession();
          redirectToLogin();
        }, 350);
        return;
      }
      void (async () => {
        try {
          const profile = await fetchUserProfileClient(user.uid);
          const shopSlug = String(profile.shopSlug || "");
          const reg = profile.registrationTrial;

          if (!hasValidShopSlug(shopSlug)) {
            if (forcingLogout) return;
            forcingLogout = true;
            await forceLogoutMissingShop();
            return;
          }

          syncTrialUiSessionFlag({ shopSlug, registrationTrial: reg });

          await syncIdTokenToCookie(shopSlug);

          if (redirectIfUrlShopMismatch(pathShopFromUrl, shopSlug, reg)) {
            return;
          }

          if (!paymentAllowsAppAccess(profile.paymentStatus)) {
            const target = toPaymentRequiredPath(shopSlug);
            try {
              if (window.top && window.top !== window) {
                window.top.location.href = target;
                return;
              }
            } catch {
              // Ignore cross-frame redirect issues.
            }
            window.location.href = target;
            return;
          }

          setResolvedShopSlug(shopSlug);
          setAuthed(true);
          setReady(true);
        } catch {
          // Avoid blank screen when profile fetch fails (rules/env mismatch, transient network).
          setAuthed(false);
          setReady(true);
          redirectToLogin();
        }
      })();
    });

    // Fail-safe: never keep "checking login" forever.
    const fallbackTimer = window.setTimeout(() => {
      if (settled) return;
      const user = auth.currentUser;
      if (!user) {
        setAuthed(false);
        setReady(true);
        redirectToLogin();
        return;
      }
      void (async () => {
        try {
          const profile = await fetchUserProfileClient(user.uid);
          const shopSlug = String(profile.shopSlug || "");
          const reg = profile.registrationTrial;
          if (!hasValidShopSlug(shopSlug)) {
            if (forcingLogout) return;
            forcingLogout = true;
            await forceLogoutMissingShop();
            return;
          }
          syncTrialUiSessionFlag({ shopSlug, registrationTrial: reg });
          await syncIdTokenToCookie(shopSlug);
          if (redirectIfUrlShopMismatch(pathShopFromUrl, shopSlug, reg)) {
            return;
          }
          if (!paymentAllowsAppAccess(profile.paymentStatus)) {
            window.location.href = toPaymentRequiredPath(shopSlug);
            return;
          }
          setResolvedShopSlug(shopSlug);
          setAuthed(true);
          setReady(true);
        } catch {
          setAuthed(false);
          setReady(true);
          redirectToLogin();
        }
      })();
    }, 1200);

    return () => {
      disposed = true;
      window.clearTimeout(fallbackTimer);
      unsub();
    };
  }, [pathShopFromUrl]);

  if (!ready) {
    return (
      <div
        style={{
          minHeight: "40vh",
          display: "grid",
          placeItems: "center",
          padding: 24,
          color: "#6b7280",
          fontSize: 15,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        Đang kiểm tra phiên đăng nhập…
      </div>
    );
  }
  if (!authed) {
    return (
      <div
        style={{
          minHeight: "40vh",
          display: "grid",
          placeItems: "center",
          padding: 24,
          color: "#6b7280",
          fontSize: 15,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        Đang chuyển hướng…
      </div>
    );
  }
  if (renderShop) {
    if (!resolvedShopSlug) {
      return (
        <div
          style={{
            minHeight: "40vh",
            display: "grid",
            placeItems: "center",
            padding: 24,
            color: "#6b7280",
            fontSize: 15,
            fontFamily: "system-ui, sans-serif",
          }}
        >
          Đang tải cửa hàng…
        </div>
      );
    }
    return <>{renderShop({ shopSlug: resolvedShopSlug })}</>;
  }
  return <>{children}</>;
}
