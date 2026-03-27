"use client";

import { auth } from "@/lib/backend/client";
import { onAuthStateChanged } from "firebase/auth";
import { get, ref } from "firebase/database";
import { ReactNode, useEffect, useState } from "react";
import { rtdb } from "@/lib/backend/client";
import { forceLogoutMissingShop, hasValidShopSlug } from "@/lib/client-auth";

function toPaymentRequiredPath(shopSlug?: string) {
  const shop = String(shopSlug || "").trim();
  return shop ? `/payment-required?shop=${encodeURIComponent(shop)}` : "/payment-required";
}

type RequireAuthProps = {
  children: ReactNode;
};

export default function RequireAuth({ children }: RequireAuthProps) {
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);

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

    const syncIdToken = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          await fetch("/api/auth/session", { method: "DELETE" });
          return;
        }
        const token = await user.getIdToken();
        await fetch("/api/auth/session", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ idToken: token }),
        });
      } catch {
        // Ignore token sync errors; auth guard still controls access.
      }
    };

    // Fast path: if Firebase already restored session in memory, render immediately.
    const cachedUser = auth.currentUser;
    if (cachedUser) {
      void syncIdToken();
    }

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
          void syncIdToken();
          redirectToLogin();
        }, 350);
        return;
      }
      void (async () => {
        try {
          const profileSnap = await get(ref(rtdb, `users/${user.uid}`));
          const profile = (profileSnap.val() || {}) as { shopSlug?: string; paymentStatus?: string };
          const shopSlug = String(profile.shopSlug || "");
          const paymentStatus = profile.paymentStatus === "active" ? "active" : "pending";

          if (!hasValidShopSlug(shopSlug)) {
            if (forcingLogout) return;
            forcingLogout = true;
            await forceLogoutMissingShop();
            return;
          }

          if (paymentStatus !== "active") {
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

          await syncIdToken();
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
          const profileSnap = await get(ref(rtdb, `users/${user.uid}`));
          const profile = (profileSnap.val() || {}) as { shopSlug?: string; paymentStatus?: string };
          const shopSlug = String(profile.shopSlug || "");
          const paymentStatus = profile.paymentStatus === "active" ? "active" : "pending";
          if (!hasValidShopSlug(shopSlug)) {
            if (forcingLogout) return;
            forcingLogout = true;
            await forceLogoutMissingShop();
            return;
          }
          if (paymentStatus !== "active") {
            window.location.href = toPaymentRequiredPath(shopSlug);
            return;
          }
          await syncIdToken();
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
  }, []);

  if (!ready) return null;
  if (!authed) return null;
  return <>{children}</>;
}
