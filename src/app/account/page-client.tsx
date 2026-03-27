"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
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

export default function AccountClient() {
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
      setError("Không có phiên đăng nhập hợp lệ.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Mật khẩu mới phải từ 6 ký tự.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }
    setSavingPassword(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      setMessage("Đổi mật khẩu thành công. Vui lòng đăng nhập lại.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
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
      // Use default Firebase reset flow to avoid domain authorization mismatch.
      await sendPasswordResetEmail(auth, email);
      setMessage("Đã gửi email đặt lại mật khẩu.");
    } catch (error: unknown) {
      const raw = error instanceof Error ? error.message : String(error || "");
      const lower = raw.toLowerCase();
      if (
        lower.includes("auth/unauthorized-continue-uri") ||
        lower.includes("auth/invalid-continue-uri")
      ) {
        setError(
          "Domain chưa được phép trong Firebase Authentication. Vui lòng thêm domain website vào Authorized domains.",
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
            style={{
              border: "1px solid #cbd5e1",
              borderRadius: 8,
              padding: "10px 12px",
              fontSize: 14,
            }}
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Xác nhận mật khẩu mới"
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
            {savingPassword ? "Đang lưu..." : "Lưu mật khẩu mới"}
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
