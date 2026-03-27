"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { auth } from "@/lib/firebase";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";

export default function ResetPasswordClient() {
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode");
  const oobCode = searchParams.get("oobCode");
  const isValidLink = mode === "resetPassword" && !!oobCode;

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const title = useMemo(
    () => (isValidLink ? "Đặt lại mật khẩu" : "Liên kết không hợp lệ"),
    [isValidLink],
  );

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!oobCode) {
      setError("Thiếu mã xác thực đặt lại mật khẩu.");
      return;
    }
    if (password.length < 6) {
      setError("Mật khẩu phải từ 6 ký tự.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setLoading(true);
    try {
      await verifyPasswordResetCode(auth, oobCode);
      await confirmPasswordReset(auth, oobCode, password);
      setMessage("Đổi mật khẩu thành công. Bạn có thể đăng nhập lại.");
      setPassword("");
      setConfirmPassword("");
    } catch {
      setError("Link đổi mật khẩu không hợp lệ hoặc đã hết hạn.");
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
        background: "#f4f6fb",
        padding: 16,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 440,
          background: "#fff",
          borderRadius: 12,
          padding: 24,
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
          display: "grid",
          gap: 14,
        }}
      >
        <h1 style={{ margin: 0, fontSize: 24 }}>{title}</h1>

        {!isValidLink ? (
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
            Link không đúng định dạng. Vui lòng mở lại link từ email hệ thống.
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>Mật khẩu mới</span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tối thiểu 6 ký tự"
                style={{
                  border: "1px solid #cbd5e1",
                  borderRadius: 8,
                  padding: "10px 12px",
                  fontSize: 14,
                }}
              />
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>Xác nhận mật khẩu</span>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                style={{
                  border: "1px solid #cbd5e1",
                  borderRadius: 8,
                  padding: "10px 12px",
                  fontSize: 14,
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

            <button
              type="submit"
              disabled={loading}
              style={{
                border: "none",
                borderRadius: 8,
                background: loading ? "#94a3b8" : "#059669",
                color: "#fff",
                fontWeight: 700,
                padding: "11px 14px",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
            </button>
          </form>
        )}

        <Link href="/login" style={{ textAlign: "center", fontSize: 14 }}>
          Quay lại đăng nhập
        </Link>
      </div>
    </main>
  );
}
