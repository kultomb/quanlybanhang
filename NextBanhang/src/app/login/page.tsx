"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword } from "firebase/auth";
import { get, ref } from "firebase/database";
import { auth, rtdb } from "@/lib/firebase";

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

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function resolveUserProfile(uid: string) {
    const snap = await get(ref(rtdb, `users/${uid}`));
    if (!snap.exists()) {
      return { shopSlug: "", paymentStatus: "pending" as const };
    }
    const value = (snap.val() || {}) as { shopSlug?: string; paymentStatus?: string };
    return {
      shopSlug: String(value.shopSlug || ""),
      paymentStatus: value.paymentStatus === "pending" ? "pending" : "active",
    };
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      const profile = await resolveUserProfile(user.uid);
      if (profile.paymentStatus !== "active") {
        router.replace(`/payment-required?shop=${encodeURIComponent(profile.shopSlug || "")}`);
        return;
      }
      if (profile.shopSlug) router.replace(`/${profile.shopSlug}`);
      else router.replace("/app");
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

    try {
      const cred = await signInWithEmailAndPassword(auth, emailTrimmed, password);
      const idToken = await cred.user.getIdToken();
      await fetch("/api/auth/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ idToken }),
      }).catch(() => undefined);
      const profile = await resolveUserProfile(cred.user.uid);
      if (profile.paymentStatus !== "active") {
        router.replace(`/payment-required?shop=${encodeURIComponent(profile.shopSlug || "")}`);
        return;
      }
      if (profile.shopSlug) router.replace(`/${profile.shopSlug}`);
      else router.replace("/app");
    } catch (err: unknown) {
      setError(getAuthErrorMessage(err));
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
          <h1 style={{ margin: 0, fontSize: 26, color: "#065f46" }}>Đăng nhập quản trị</h1>
        </div>
        <p style={{ margin: 0, color: "#4b5563", fontSize: 14, textAlign: "center" }}>
          Đăng nhập để vào hệ thống bán hàng.
        </p>

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

        <div style={{ textAlign: "center", fontSize: 14, color: "#4b5563" }}>
          Chưa có tài khoản?
          {" "}
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
      </form>
    </main>
  );
}
