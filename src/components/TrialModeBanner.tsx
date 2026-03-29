"use client";

import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { get, ref } from "firebase/database";
import { useEffect, useState } from "react";
import { auth, rtdb } from "@/lib/backend/client";
import { getTrialShopPrefix, isEffectiveTrialAccount, syncTrialUiSessionFlag } from "@/lib/trial-shop";

type TrialModeBannerProps = {
  /** Slug trong URL — chỉ hiện banner khi khớp shop của user (tránh nhầm). */
  shopSlug: string;
};

export default function TrialModeBanner({ shopSlug }: TrialModeBannerProps) {
  const [visible, setVisible] = useState(false);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);

  useEffect(() => {
    let unsub = () => {};
    try {
      const quick = sessionStorage.getItem("ha_ui_trial");
      if (quick === "1") setVisible(true);
    } catch (_) {}

    unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setVisible(false);
        setExpiresAt(null);
        return;
      }
      get(ref(rtdb, `users/${user.uid}`))
        .then((snap) => {
          const v = (snap.val() || {}) as {
            shopSlug?: string;
            registrationTrial?: unknown;
            trialExpiresAt?: unknown;
          };
          const userSlug = String(v.shopSlug || "").trim();
          if (!userSlug || userSlug !== shopSlug) {
            setVisible(false);
            setExpiresAt(null);
            return;
          }
          const reg =
            v.registrationTrial === true ? true : v.registrationTrial === false ? false : null;
          const trial = isEffectiveTrialAccount(reg, userSlug, getTrialShopPrefix());
          syncTrialUiSessionFlag({ shopSlug: userSlug, registrationTrial: reg });
          setVisible(trial);
          const te = v.trialExpiresAt;
          const n = typeof te === "number" ? te : Number(te);
          setExpiresAt(Number.isFinite(n) && n > 0 ? n : null);
        })
        .catch(() => setVisible(false));
    });
    return () => unsub();
  }, [shopSlug]);

  if (!visible) return null;

  const daysLeft =
    expiresAt != null && expiresAt > Date.now()
      ? Math.max(0, Math.ceil((expiresAt - Date.now()) / (24 * 60 * 60 * 1000)))
      : null;

  return (
    <div
      role="status"
      style={{
        flexShrink: 0,
        width: "100%",
        padding: "8px 14px",
        fontSize: 13,
        fontWeight: 600,
        textAlign: "center",
        color: "#78350f",
        background: "linear-gradient(90deg, #fef3c7 0%, #fde68a 50%, #fef3c7 100%)",
        borderBottom: "1px solid #f59e0b",
        boxSizing: "border-box",
        pointerEvents: "none",
      }}
    >
      <span style={{ pointerEvents: "auto" }}>
        🧪 Đang ở chế độ dùng thử — dữ liệu có thể bị xóa hoặc hết hạn; không dùng cho vận hành thật.
        {daysLeft != null ? ` · Còn khoảng ${daysLeft} ngày.` : null}
        {" · "}
        <Link
          href="/upgrade"
          style={{
            color: "#92400e",
            fontWeight: 800,
            textDecoration: "underline",
            textUnderlineOffset: 2,
          }}
        >
          Nâng cấp tài khoản
        </Link>
      </span>
    </div>
  );
}
