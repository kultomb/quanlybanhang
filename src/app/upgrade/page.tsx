"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { get, ref } from "firebase/database";
import { auth, rtdb } from "@/lib/backend/client";
import RequireAuth from "@/components/RequireAuth";
import { postSessionCookieWithRetries } from "@/lib/client-auth";
import {
  getTrialShopPrefix,
  isEffectiveTrialAccount,
  productionSlugFromTrialSlug,
} from "@/lib/trial-shop";

function UpgradeForm() {
  const router = useRouter();
  const trialPrefix = getTrialShopPrefix();
  const [customSlug, setCustomSlug] = useState("");
  const [useCustomName, setUseCustomName] = useState(false);
  const [currentShop, setCurrentShop] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const suggestedSlug = useMemo(
    () => (currentShop ? productionSlugFromTrialSlug(currentShop, trialPrefix) : ""),
    [currentShop, trialPrefix],
  );

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) return;
      get(ref(rtdb, `users/${user.uid}`))
        .then((snap) => {
          const v = (snap.val() || {}) as {
            shopSlug?: string;
            registrationTrial?: unknown;
            paymentStatus?: string;
            upgradeTargetSlug?: string;
          };
          const slug = String(v.shopSlug || "");
          setCurrentShop(slug);
          const reg =
            v.registrationTrial === true || v.registrationTrial === "true"
              ? true
              : v.registrationTrial === false || v.registrationTrial === "false"
                ? false
                : null;
          if (!slug) {
            router.replace("/");
            return;
          }
          if (!isEffectiveTrialAccount(reg, slug, trialPrefix)) {
            router.replace(`/${slug}`);
            return;
          }
          if (v.paymentStatus === "pending_upgrade" && v.upgradeTargetSlug) {
            router.replace(`/payment-required?shop=${encodeURIComponent(slug)}`);
          }
        })
        .catch(() => undefined);
    });
    return () => unsub();
  }, [router, trialPrefix]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (useCustomName && !customSlug.trim()) {
      setError("Vui lòng nhập tên shop chính thức.");
      return;
    }
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        router.replace("/login");
        return;
      }
      const idToken = await user.getIdToken();
      const targetSlug =
        useCustomName && customSlug.trim() ? customSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "") : "";
      const res = await fetch("/api/upgrade/prepare", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ idToken, targetSlug }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        if (data.error === "slug_taken") {
          setError("Tên shop sau nâng cấp đã có người dùng. Bật “Đặt tên khác” và chọn tên khác.");
          setUseCustomName(true);
        } else if (data.error === "slug_too_short_after_strip") {
          setError(
            `Sau khi bỏ “${trialPrefix}-”, tên còn lại ngắn hơn 3 ký tự. Hãy bật “Đặt tên khác” và nhập tên shop chính thức.`,
          );
          setUseCustomName(true);
        } else if (data.error === "no_trial_prefix")
          setError(`Tên shop chính thức không được bắt đầu bằng “${trialPrefix}-”.`);
        else if (data.error === "invalid_slug") setError("Tên chỉ gồm chữ thường, số, dấu gạch; 3–30 ký tự.");
        else if (data.error === "not_trial") setError("Chỉ tài khoản dùng thử mới nâng cấp tại đây.");
        else setError("Không tạo được yêu cầu nâng cấp. Thử lại sau.");
        return;
      }
      const sessionOk = await postSessionCookieWithRetries(idToken, { shopSlug: currentShop });
      if (!sessionOk) {
        setError("Chưa cập nhật được phiên đăng nhập. Thử lại sau vài giây.");
        return;
      }
      router.replace(`/payment-required?shop=${encodeURIComponent(currentShop)}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background:
          "radial-gradient(1200px 600px at 20% -10%, rgba(16,185,129,0.35), transparent 55%), radial-gradient(900px 500px at 90% 110%, rgba(5,150,105,0.28), transparent 55%), linear-gradient(160deg, #ecfdf5 0%, #d1fae5 45%, #a7f3d0 100%)",
        padding: 16,
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: "100%",
          maxWidth: 480,
          background: "rgba(255,255,255,0.95)",
          borderRadius: 16,
          padding: 24,
          border: "1px solid rgba(16,185,129,0.22)",
          boxShadow: "0 16px 40px rgba(5,150,105,0.18)",
          display: "grid",
          gap: 14,
        }}
      >
        <h1 style={{ margin: 0, fontSize: 22, color: "#065f46", textAlign: "center" }}>
          Nâng cấp lên bản chính thức
        </h1>
        <p style={{ margin: 0, color: "#475569", fontSize: 14, lineHeight: 1.55 }}>
          Giữ nguyên <strong>email và mật khẩu</strong>. Sau khi chuyển khoản, hệ thống bỏ tiền tố thử trên tên
          shop và copy dữ liệu POS sang tên mới — giống cách nhiều dịch vụ vẫn làm.
        </p>
        {currentShop ? (
          <div
            style={{
              padding: "12px 14px",
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              borderRadius: 10,
              fontSize: 14,
              color: "#14532d",
            }}
          >
            <div>
              Shop thử: <strong>{currentShop}</strong>
            </div>
            <div style={{ marginTop: 6 }}>
              → Shop chính thức (mặc định): <strong>{suggestedSlug || "…"}</strong>
            </div>
          </div>
        ) : null}

        <label style={{ display: "flex", gap: 10, alignItems: "center", cursor: "pointer", fontSize: 14 }}>
          <input
            type="checkbox"
            checked={useCustomName}
            onChange={(e) => setUseCustomName(e.target.checked)}
          />
          <span>Đặt tên shop chính thức khác (không dùng mặc định bỏ “{trialPrefix}-”)</span>
        </label>

        {useCustomName ? (
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>Tên shop chính thức</span>
            <input
              value={customSlug}
              onChange={(e) => setCustomSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              placeholder="vd: minhhamobile"
              style={{
                border: "1px solid #a7f3d0",
                borderRadius: 10,
                padding: "11px 12px",
                fontSize: 14,
              }}
            />
          </label>
        ) : null}

        {error ? (
          <div
            style={{
              background: "#fef2f2",
              color: "#b91c1c",
              border: "1px solid #fecaca",
              borderRadius: 8,
              padding: "10px 12px",
              fontSize: 13,
            }}
          >
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          style={{
            border: "none",
            borderRadius: 10,
            background: loading ? "#6b7280" : "linear-gradient(135deg, #047857 0%, #10b981 100%)",
            color: "#fff",
            fontWeight: 700,
            padding: "12px 14px",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Đang xử lý..." : "Tiếp tục — thanh toán nâng cấp"}
        </button>

        <div style={{ textAlign: "center" }}>
          <Link href={currentShop ? `/${currentShop}?trial=1` : "/"} style={{ color: "#047857", fontSize: 14 }}>
            ← Quay lại POS
          </Link>
        </div>
      </form>
    </main>
  );
}

export default function UpgradePage() {
  return (
    <RequireAuth>
      <Suspense fallback={null}>
        <UpgradeForm />
      </Suspense>
    </RequireAuth>
  );
}
