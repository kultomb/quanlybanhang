"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import {
  EmailAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  updatePassword,
} from "firebase/auth";
import { get, ref } from "firebase/database";
import { auth, rtdb } from "@/lib/backend/client";
import { revokeAllFirebaseSessionsThenSignOut } from "@/lib/client-auth";
import { buildPasswordResetActionCodeSettings } from "@/lib/password-reset-email";
import { SIGNUP_PASSWORD_HINT, validateSignupPassword } from "@/lib/password-policy";
import { getSiteBrandName, getSiteDomainHint } from "@/lib/site-brand";

export default function AccountClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [shop, setShop] = useState(searchParams.get("shop") || "");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setEmail("");
        setLoading(false);
        return;
      }
      setEmail(user.email || "");
      const snap = await get(ref(rtdb, `users/${user.uid}/shopSlug`));
      if (snap.exists()) setShop(String(snap.val() || ""));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  async function handleChangePassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setMessage("");
    const user = auth.currentUser;
    if (!user || !user.email) {
      setError("Bạn chưa đăng nhập hoặc phiên đã hết hạn. Vui lòng đăng nhập lại.");
      return;
    }
    const pwCheck = validateSignupPassword(newPassword, user.email);
    if (!pwCheck.ok) {
      setError(pwCheck.message);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }
    setSavingPassword(true);
    setError("");
    setMessage("");
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage("Đổi mật khẩu thành công.");
      await new Promise((r) => window.setTimeout(r, 2000));
      await revokeAllFirebaseSessionsThenSignOut();
      router.replace("/login?reason=password-changed");
    } catch {
      setError("Mật khẩu cũ không đúng hoặc không thể đổi mật khẩu.");
    } finally {
      setSavingPassword(false);
    }
  }

  async function handleForgotPassword() {
    setError("");
    setMessage("");
    if (!email) {
      setError("Không tìm thấy email tài khoản.");
      return;
    }
    try {
      const actionSettings = buildPasswordResetActionCodeSettings();
      if (actionSettings) {
        await sendPasswordResetEmail(auth, email, actionSettings);
      } else {
        await sendPasswordResetEmail(auth, email);
      }
      setMessage(
        `Đã gửi email đặt lại mật khẩu từ ${getSiteBrandName()} (${getSiteDomainHint()}). Kiểm tra hộp thư; nếu không thấy, mở cả mục Thư rác / Spam.`,
      );
    } catch (error: unknown) {
      const raw = error instanceof Error ? error.message : String(error || "");
      const lower = raw.toLowerCase();
      if (
        lower.includes("auth/unauthorized-continue-uri") ||
        lower.includes("auth/invalid-continue-uri")
      ) {
        setError(
          "Không gửi được email do cấu hình địa chỉ trang web. Vui lòng liên hệ hỗ trợ hoặc người phụ trách kỹ thuật.",
        );
      } else {
        setError("Không gửi được email đặt lại mật khẩu.");
      }
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#f4f6fb",
        padding: 16,
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: 560,
          background: "white",
          border: "1px solid #d1fae5",
          borderRadius: 14,
          padding: 22,
          boxShadow: "0 10px 26px rgba(2,6,23,0.08)",
          display: "grid",
          gap: 14,
        }}
      >
        <h1 style={{ margin: 0, color: "#065f46" }}>Tài khoản</h1>

        <div style={{ display: "grid", gap: 6, color: "#0f172a" }}>
          <div>
            <strong>Shop:</strong> {loading ? "Đang tải..." : shop || "-"}
          </div>
          <div>
            <strong>Email:</strong> {loading ? "Đang tải..." : email || "-"}
          </div>
        </div>

        <form onSubmit={handleChangePassword} style={{ display: "grid", gap: 10 }}>
          <h3 style={{ margin: "6px 0 0 0", color: "#0f172a" }}>Đổi mật khẩu</h3>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Mật khẩu cũ"
            autoComplete="current-password"
            style={{
              border: "1px solid #cbd5e1",
              borderRadius: 8,
              padding: "10px 12px",
              fontSize: 14,
            }}
          />
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Mật khẩu mới"
            autoComplete="new-password"
            minLength={8}
            maxLength={128}
            style={{
              border: "1px solid #cbd5e1",
              borderRadius: 8,
              padding: "10px 12px",
              fontSize: 14,
            }}
          />
          <span style={{ fontSize: 12, color: "#64748b", lineHeight: 1.45 }}>{SIGNUP_PASSWORD_HINT}</span>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Xác nhận mật khẩu mới"
            autoComplete="new-password"
            minLength={8}
            maxLength={128}
            style={{
              border: "1px solid #cbd5e1",
              borderRadius: 8,
              padding: "10px 12px",
              fontSize: 14,
            }}
          />
          <button
            type="submit"
            disabled={savingPassword}
            style={{
              border: "none",
              borderRadius: 8,
              background: savingPassword ? "#94a3b8" : "#059669",
              color: "#fff",
              fontWeight: 700,
              padding: "10px 12px",
              cursor: savingPassword ? "not-allowed" : "pointer",
            }}
          >
            {savingPassword ? "Đang xử lý…" : "Lưu mật khẩu mới"}
          </button>
        </form>

        <button
          type="button"
          onClick={handleForgotPassword}
          style={{
            justifySelf: "start",
            border: "none",
            background: "transparent",
            color: "#047857",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            padding: 0,
          }}
        >
          Quên mật khẩu? Gửi email đặt lại
        </button>

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
        {message ? (
          <div
            style={{
              background: "#ecfdf5",
              color: "#166534",
              border: "1px solid #86efac",
              borderRadius: 8,
              padding: "10px 12px",
              fontSize: 13,
              whiteSpace: "pre-line",
            }}
          >
            {message}
          </div>
        ) : null}

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {shop ? (
            <Link href={`/${shop}`} style={{ color: "#065f46", fontWeight: 700 }}>
              Quay lại gian hàng
            </Link>
          ) : null}
          <Link href="/app" style={{ color: "#065f46", fontWeight: 700 }}>
            Vào ứng dụng
          </Link>
        </div>
      </section>
    </main>
  );
}
