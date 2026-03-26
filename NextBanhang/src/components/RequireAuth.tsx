"use client";

import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { get, ref } from "firebase/database";
import { ReactNode, useEffect, useState } from "react";
import { rtdb } from "@/lib/firebase";

type RequireAuthProps = {
  children: ReactNode;
};

export default function RequireAuth({ children }: RequireAuthProps) {
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
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
        setAuthed(false);
        setReady(true);
        void syncIdToken();
        redirectToLogin();
        return;
      }
      void (async () => {
        const profileSnap = await get(ref(rtdb, `users/${user.uid}`));
        const profile = (profileSnap.val() || {}) as { shopSlug?: string; paymentStatus?: string };
        const shopSlug = String(profile.shopSlug || "");
        const paymentStatus = profile.paymentStatus === "pending" ? "pending" : "active";

        if (paymentStatus !== "active") {
          const target = `/payment-required?shop=${encodeURIComponent(shopSlug)}`;
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

        setAuthed(true);
        setReady(true);
        void syncIdToken();
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
        const profileSnap = await get(ref(rtdb, `users/${user.uid}`));
        const profile = (profileSnap.val() || {}) as { shopSlug?: string; paymentStatus?: string };
        const shopSlug = String(profile.shopSlug || "");
        const paymentStatus = profile.paymentStatus === "pending" ? "pending" : "active";
        if (paymentStatus !== "active") {
          window.location.href = `/payment-required?shop=${encodeURIComponent(shopSlug)}`;
          return;
        }
        setAuthed(true);
        setReady(true);
      })();
    }, 1200);

    return () => {
      window.clearTimeout(fallbackTimer);
      unsub();
    };
  }, []);

  if (!ready) {
    return null;
  }

  if (!authed) return null;
  return <>{children}</>;
}
