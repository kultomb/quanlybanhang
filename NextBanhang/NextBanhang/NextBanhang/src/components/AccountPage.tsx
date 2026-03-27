"use client";

import { auth } from "@/lib/firebase";
import {
  EmailAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  signOut,
  updatePassword,
} from "firebase/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

type AccountPageProps = {
  shop?: string;
};

export default function AccountPage({ shop }: AccountPageProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [authLoading, setAuthLoading] = useState(true);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("info");
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setEmail(user?.email || "");
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault();
    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.email) {
      setMessageType("error");
      setMessage("Không tìm thấy phiên đăng nhập.");
      return;
    }
    if (newPassword.length < 6) {
      setMessageType("error");
      setMessage("Mật khẩu mới phải từ 6 ký tự.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessageType("error");
      setMessage("Mật khẩu xác nhận không khớp.");
      return;
    }

    setLoading(true);
    try {
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, newPassword);
      setMessageType("success");
      setMessage("Đổi mật khẩu thành công.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setMessageType("error");
      setMessage("Mật khẩu cũ không đúng hoặc không thể đổi mật khẩu.");
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    if (sendingReset) return;
    if (!email) {
      setMessageType("error");
      setMessage("Bạn chưa đăng nhập để dùng chức năng này.");
      return;
    }
    setSendingReset(true);
    setMessageType("info");
    setMessage("Đang gửi email khôi phục...");
    try {
      // Use default Firebase reset flow to avoid unauthorized continue URL issues on custom domains.
      await sendPasswordResetEmail(auth, email);
      setMessageType("success");
      setMessage("Đã gửi email quên mật khẩu.");
    } catch (error: unknown) {
      const raw = error instanceof Error ? error.message : String(error || "");
      const lower = raw.toLowerCase();
      setMessageType("error");
      if (
        lower.includes("auth/unauthorized-continue-uri") ||
        lower.includes("auth/invalid-continue-uri")
      ) {
        setMessage(
          "Domain chưa được phép trong Firebase Authentication. Vui lòng thêm domain website vào Authorized domains.",
        );
      } else {
        setMessage("Không gửi được email quên mật khẩu.");
      }
    } finally {
      setSendingReset(false);
    }
  }

  async function handleLogout() {
    await signOut(auth);
    await fetch("/api/auth/session", { method: "DELETE" }).catch(() => undefined);
    router.replace("/login");
  }

  return (
    <main data-account-page-root="1" style={{ minHeight: "100vh", background: "#f4f6fb", padding: "20px 16px" }}>
      <div
        style={{
          maxWidth: 980,
          margin: "0 auto",
          display: "grid",
          gap: 16,
        }}
      >
        <div
          style={{
            background: "white",
            border: "1px solid #d1fae5",
            borderRadius: 12,
            padding: 18,
            boxShadow: "0 8px 22px rgba(0,0,0,0.05)",
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: 26, color: "#047857" }}>Tài khoản</h1>
            <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: 14 }}>
              Quản lý thông tin cá nhân và bảo mật tài khoản.
            </p>
          </div>
          <Link
            href={shop ? `/${shop}` : "/app"}
            style={{
              alignSelf: "center",
              border: "1px solid #a7f3d0",
              background: "#ecfdf5",
              color: "#065f46",
              borderRadius: 8,
              padding: "9px 12px",
              fontWeight: 700,
              fontSize: 14,
              textDecoration: "none",
            }}
          >
            {shop ? "Quay lại shop" : "Về ứng dụng"}
          </Link>
        </div>

        <section
          style={{
            background: "white",
            border: "1px solid #d1fae5",
            borderRadius: 12,
            padding: 18,
            boxShadow: "0 8px 22px rgba(0,0,0,0.05)",
          }}
        >
          <h2 style={{ margin: "0 0 14px", fontSize: 20, color: "#1f2937" }}>Thông tin tài khoản</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 12,
            }}
          >
            <div style={{ background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0", padding: 14 }}>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>EMAIL</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#0f172a", wordBreak: "break-word" }}>
                {authLoading ? "Đang tải..." : email || "-"}
              </div>
            </div>
            <div style={{ background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0", padding: 14 }}>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>SHOP</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#047857" }}>{shop || "-"}</div>
            </div>
          </div>
        </section>

        <section
          style={{
            background: "white",
            border: "1px solid #d1fae5",
            borderRadius: 12,
            padding: 18,
            boxShadow: "0 8px 22px rgba(0,0,0,0.05)",
          }}
        >
          <h2 style={{ margin: "0 0 14px", fontSize: 20, color: "#1f2937" }}>Bảo mật tài khoản</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 12,
            }}
          >
            <div
              style={{
                background: "#ffffff",
                borderRadius: 12,
                border: "1px solid #dbe5ee",
                padding: 16,
                boxShadow: "0 4px 14px rgba(15,23,42,0.04)",
                display: "grid",
                gap: 10,
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>Đổi mật khẩu</div>
              <button
                type="button"
                onClick={() => {
                  setMessageType("info");
                  setMessage("");
                  setShowPasswordModal(true);
                }}
                style={{
                  border: "none",
                  background: "#059669",
                  color: "white",
                  borderRadius: 8,
                  padding: "10px 14px",
                  fontWeight: 700,
                  cursor: "pointer",
                  justifySelf: "start",
                }}
              >
                Đổi mật khẩu ngay
              </button>
            </div>
            <div
              style={{
                background: "#ffffff",
                borderRadius: 12,
                border: "1px solid #dbe5ee",
                padding: 16,
                boxShadow: "0 4px 14px rgba(15,23,42,0.04)",
                display: "grid",
                gap: 10,
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>Quên mật khẩu</div>
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={sendingReset}
                style={{
                  border: "1px solid #bfdbfe",
                  background: sendingReset ? "#dbeafe" : "#eff6ff",
                  color: "#1d4ed8",
                  borderRadius: 8,
                  padding: "10px 14px",
                  fontWeight: 600,
                  cursor: sendingReset ? "not-allowed" : "pointer",
                  justifySelf: "start",
                  opacity: sendingReset ? 0.75 : 1,
                }}
              >
                {sendingReset ? "Đang gửi..." : "Gửi email khôi phục"}
              </button>
            </div>
          </div>
        </section>

        {message ? (
          <div
            style={{
              background:
                messageType === "success"
                  ? "#ecfdf5"
                  : messageType === "error"
                    ? "#fef2f2"
                    : "#eff6ff",
              border:
                messageType === "success"
                  ? "1px solid #86efac"
                  : messageType === "error"
                    ? "1px solid #fecaca"
                    : "1px solid #bfdbfe",
              borderRadius: 10,
              padding: "10px 12px",
              fontSize: 13,
              color:
                messageType === "success"
                  ? "#166534"
                  : messageType === "error"
                    ? "#b91c1c"
                    : "#1d4ed8",
            }}
          >
            {message}
          </div>
        ) : null}

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={handleLogout}
            style={{
              border: "1px solid rgba(239,68,68,0.35)",
              background: "#ef4444",
              color: "white",
              borderRadius: 8,
              padding: "10px 14px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Đăng xuất
          </button>
        </div>
      </div>

      {showPasswordModal ? (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowPasswordModal(false);
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(2,6,23,0.45)",
            zIndex: 2000,
            display: "grid",
            placeItems: "center",
            padding: 16,
          }}
        >
          <form
            onSubmit={handleChangePassword}
            style={{
              width: "100%",
              maxWidth: 430,
              background: "white",
              borderRadius: 12,
              border: "1px solid #d1fae5",
              boxShadow: "0 14px 34px rgba(0,0,0,0.16)",
              padding: 16,
              display: "grid",
              gap: 10,
            }}
          >
            <h3 style={{ margin: 0, fontSize: 18, color: "#1f2937" }}>Đổi mật khẩu</h3>
            <input
              type="password"
              placeholder="Mật khẩu cũ"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              style={{ border: "1px solid #cbd5e1", borderRadius: 8, padding: "10px 12px" }}
            />
            <input
              type="password"
              placeholder="Mật khẩu mới"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={{ border: "1px solid #cbd5e1", borderRadius: 8, padding: "10px 12px" }}
            />
            <input
              type="password"
              placeholder="Xác nhận mật khẩu mới"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={{ border: "1px solid #cbd5e1", borderRadius: 8, padding: "10px 12px" }}
            />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                style={{
                  border: "1px solid #cbd5e1",
                  background: "white",
                  color: "#1f2937",
                  borderRadius: 8,
                  padding: "10px 14px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  border: "none",
                  background: loading ? "#94a3b8" : "#059669",
                  color: "white",
                  borderRadius: 8,
                  padding: "10px 14px",
                  fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? "Đang lưu..." : "Lưu mật khẩu mới"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </main>
  );
}
