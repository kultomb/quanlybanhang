"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useRef, useState, type RefObject } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/backend/client";
import LoginTurnstile from "@/components/LoginTurnstile";
import { fetchUserProfileClient } from "@/lib/user-profile-client";
import {
  forceLogoutMissingShop,
  hasValidShopSlug,
  paymentAllowsAppAccess,
  postSessionCookieWithRetries,
} from "@/lib/client-auth";
import { isEffectiveTrialAccount, syncTrialUiSessionFlag } from "@/lib/trial-shop";

function shopAppPath(slug: string, registrationTrial: boolean | null) {
  const trial = isEffectiveTrialAccount(registrationTrial, slug);
  return trial ? `/${slug}?trial=1` : `/${slug}`;
}

function toPaymentRequiredPath(shopSlug?: string) {
  const shop = String(shopSlug || "").trim();
  return shop ? `/payment-required?shop=${encodeURIComponent(shop)}` : "/payment-required";
}

function getAuthErrorMessage(err: unknown): string {
  const raw = err instanceof Error ? err.message : "";
  const codeMatch = raw.match(/auth\/[a-z-]+/i);
  const code = (codeMatch?.[0] || "").toLowerCase();

  switch (code) {
    case "auth/invalid-email":
      return "Email không hợp lệ.";
    case "auth/missing-password":
      return "Vui lòng nhập mật khẩu.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Email hoặc mật khẩu không đúng.";
    case "auth/too-many-requests":
      return "Bạn thử sai quá nhiều lần. Vui lòng đợi một lúc rồi thử lại.";
    case "auth/network-request-failed":
      return "Lỗi kết nối mạng. Vui lòng kiểm tra Internet và thử lại.";
    default:
      return "Đăng nhập thất bại. Vui lòng thử lại.";
  }
}

function resetTurnstile(ref: RefObject<LoginTurnstileHandle | null>) {
  ref.current?.reset();
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const submittingRef = useRef(false);
  const turnstileRef = useRef<LoginTurnstileHandle | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstileSiteKey = (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "").trim();

  useEffect(() => {
    const reason = String(searchParams.get("reason") || "");
    if (reason === "missing-shop") {
      setNotice(
        "Cửa hàng gắn với tài khoản không còn trên hệ thống. Bạn đã được đăng xuất để bảo vệ dữ liệu.",
      );
      return;
    }
    setNotice("");
  }, [searchParams]);

  async function resolveUserProfile(uid: string) {
    return fetchUserProfileClient(uid);
  }

  useEffect(() => {
    let forcingLogout = false;
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user || submittingRef.current) return;
      const profile = await resolveUserProfile(user.uid);
      if (!hasValidShopSlug(profile.shopSlug)) {
        if (forcingLogout) return;
        forcingLogout = true;
        await forceLogoutMissingShop();
        return;
      }
      syncTrialUiSessionFlag({
        shopSlug: profile.shopSlug,
        registrationTrial: profile.registrationTrial,
      });
      if (!paymentAllowsAppAccess(profile.paymentStatus)) {
        router.replace(toPaymentRequiredPath(profile.shopSlug));
        return;
      }
      if (profile.shopSlug) router.replace(shopAppPath(profile.shopSlug, profile.registrationTrial));
      else router.replace("/account");
    });
    return () => unsub();
  }, [router]);

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const emailTrimmed = email.trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      setError("Email không đúng định dạng (ví dụ: ten@domain.com).");
      setLoading(false);
      return;
    }

    if (turnstileSiteKey && !turnstileToken.trim()) {
      setError("Vui lòng hoàn tất xác minh bảo vệ đăng nhập.");
      setLoading(false);
      return;
    }

    submittingRef.current = true;
    try {
      const preCtrl = new AbortController();
      const preTimer = window.setTimeout(() => preCtrl.abort(), 15000);
      let preRes: Response;
      try {
        preRes = await fetch("/api/auth/login-precheck", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            email: emailTrimmed,
            turnstileToken: turnstileSiteKey ? turnstileToken : "",
          }),
          signal: preCtrl.signal,
        });
      } finally {
        window.clearTimeout(preTimer);
      }

      const preJson = (await preRes.json().catch(() => ({}))) as {
        error?: string;
        retryAfterSec?: number;
      };

      if (preRes.status === 429) {
        const sec = typeof preJson.retryAfterSec === "number" ? preJson.retryAfterSec : 60;
        setError(`Đăng nhập tạm khóa do thử quá nhiều lần. Thử lại sau khoảng ${sec} giây.`);
        resetTurnstile(turnstileRef);
        return;
      }
      if (!preRes.ok) {
        resetTurnstile(turnstileRef);
        if (preJson.error === "captcha_failed") {
          setError(
            "Mã xác minh đã hết hạn hoặc đã dùng. Vui lòng hoàn tất ô xác minh lại rồi đăng nhập.",
          );
        } else if (preJson.error === "invalid_email") {
          setError("Email không hợp lệ.");
        } else if (preJson.error === "server_error" || preRes.status >= 500) {
          setError("Máy chủ tạm thời không kiểm tra được đăng nhập. Thử lại sau vài giây.");
        } else {
          setError("Không thể xác minh bước đăng nhập. Thử lại sau giây lát.");
        }
        return;
      }

      const cred = await signInWithEmailAndPassword(auth, emailTrimmed, password);
      const profile = await resolveUserProfile(cred.user.uid);
      if (!hasValidShopSlug(profile.shopSlug)) {
        await forceLogoutMissingShop();
        resetTurnstile(turnstileRef);
        setError("Cửa hàng không còn trên hệ thống. Bạn đã được đăng xuất.");
        return;
      }
      const idToken = await cred.user.getIdToken();
      const sessionOk = await postSessionCookieWithRetries(idToken, {
        shopSlug: profile.shopSlug,
      });
      if (!sessionOk) {
        resetTurnstile(turnstileRef);
        setError("Chưa đăng nhập xong. Kiểm tra mạng rồi thử bấm Đăng nhập lại.");
        return;
      }
      syncTrialUiSessionFlag({
        shopSlug: profile.shopSlug,
        registrationTrial: profile.registrationTrial,
      });
      if (!paymentAllowsAppAccess(profile.paymentStatus)) {
        router.replace(toPaymentRequiredPath(profile.shopSlug));
        return;
      }
      if (profile.shopSlug) router.replace(shopAppPath(profile.shopSlug, profile.registrationTrial));
      else router.replace("/account");
    } catch (err: unknown) {
      resetTurnstile(turnstileRef);
      if (err instanceof Error && err.name === "AbortError") {
        setError("Hết thời gian chờ máy chủ. Kiểm tra mạng và thử lại.");
      } else {
        setError(getAuthErrorMessage(err));
      }
    } finally {
      submittingRef.current = false;
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
        onSubmit={handleLogin}
        style={{
          width: "100%",
          maxWidth: 420,
          background: "rgba(255,255,255,0.94)",
          backdropFilter: "blur(6px)",
          borderRadius: 16,
          padding: 24,
          border: "1px solid rgba(16,185,129,0.22)",
          boxShadow: "0 16px 40px rgba(5,150,105,0.18)",
          display: "grid",
          gap: 14,
        }}
      >
        <div style={{ display: "grid", gap: 6, justifyItems: "center", textAlign: "center" }}>
          <h1 style={{ margin: 0, fontSize: 26, color: "#065f46" }}>Đăng nhập</h1>
        </div>
        <p style={{ margin: 0, color: "#4b5563", fontSize: 14, textAlign: "center" }}>
          Đăng nhập để vào hệ thống bán hàng.
        </p>

        {notice ? (
          <div
            style={{
              background:
                "linear-gradient(180deg, rgba(239,246,255,0.95) 0%, rgba(219,234,254,0.95) 100%)",
              border: "1px solid #93c5fd",
              color: "#1d4ed8",
              borderRadius: 12,
              padding: "11px 12px",
              fontSize: 13,
              lineHeight: 1.45,
              boxShadow: "0 8px 18px rgba(37,99,235,0.12)",
            }}
          >
            <div style={{ fontWeight: 800, marginBottom: 4 }}>Thông báo hệ thống</div>
            <div>{notice}</div>
          </div>
        ) : null}

        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Email</span>
          <input
            type="text"
            inputMode="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              border: "1px solid #a7f3d0",
              borderRadius: 10,
              padding: "11px 12px",
              fontSize: 14,
              outline: "none",
            }}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Mật khẩu</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              border: "1px solid #a7f3d0",
              borderRadius: 10,
              padding: "11px 12px",
              fontSize: 14,
              outline: "none",
            }}
          />
        </label>

        {turnstileSiteKey ? (
          <LoginTurnstile ref={turnstileRef} siteKey={turnstileSiteKey} onToken={setTurnstileToken} />
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
            background: loading
              ? "#6b7280"
              : "linear-gradient(135deg, #047857 0%, #059669 50%, #10b981 100%)",
            color: "#fff",
            fontWeight: 700,
            padding: "12px 14px",
            cursor: loading ? "not-allowed" : "pointer",
            boxShadow: loading ? "none" : "0 10px 22px rgba(5,150,105,0.28)",
          }}
        >
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>

        <div style={{ textAlign: "center", fontSize: 14, color: "#4b5563", display: "grid", gap: 10 }}>
          <div>
            Chưa có tài khoản?{" "}
            <Link
              href="/register"
              style={{
                color: "#065f46",
                fontWeight: 800,
                textDecoration: "none",
                background: "#ecfdf5",
                border: "1px solid #a7f3d0",
                borderRadius: 999,
                padding: "4px 10px",
                display: "inline-block",
              }}
            >
              Đăng ký
            </Link>
          </div>
          <div>
            <Link href="/" style={{ color: "#6b7280", fontSize: 13 }}>
              ← Trang chủ
            </Link>
            {" · "}
            <Link href="/trial" style={{ color: "#6b7280", fontSize: 13 }}>
              Dùng thử
            </Link>
          </div>
        </div>
      </form>
    </main>
  );
}

function LoginSuspenseFallback() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "linear-gradient(160deg, #ecfdf5 0%, #d1fae5 100%)",
        color: "#4b5563",
        fontSize: 15,
      }}
    >
      Đang tải trang đăng nhập…
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginSuspenseFallback />}>
      <LoginContent />
    </Suspense>
  );
}
