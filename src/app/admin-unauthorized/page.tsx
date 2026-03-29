import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Không tìm thấy trang — Hangho.com",
  robots: { index: false, follow: false },
};

/**
 * Nội dung hiển thị khi /admin được rewrite (không phải admin).
 * Không nhắc biến môi trường hay cơ chế cấp quyền.
 */
export default function AdminUnauthorizedPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        background: "linear-gradient(165deg, #f8fafc 0%, #e2e8f0 45%, #cbd5e1 100%)",
      }}
    >
      <div
        style={{
          textAlign: "center",
          maxWidth: 420,
        }}
      >
        <p
          style={{
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "#94a3b8",
            marginBottom: 12,
          }}
        >
          Hangho.com
        </p>
        <h1
          style={{
            fontSize: "clamp(4.5rem, 14vw, 7rem)",
            fontWeight: 800,
            lineHeight: 1,
            color: "#e2e8f0",
            textShadow: "0 2px 0 #cbd5e1, 0 8px 32px rgba(15,23,42,0.12)",
            marginBottom: 16,
            letterSpacing: "-0.04em",
          }}
        >
          404
        </h1>
        <h2 style={{ fontSize: "clamp(1.25rem, 3.5vw, 1.5rem)", fontWeight: 700, color: "#0f172a", marginBottom: 12 }}>
          Không tìm thấy trang
        </h2>
        <p style={{ fontSize: 16, lineHeight: 1.65, color: "#64748b", marginBottom: 28 }}>
          Đường dẫn bạn mở không tồn tại hoặc đã được thay đổi. Vui lòng kiểm tra lại liên kết.
        </p>
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "14px 28px",
            borderRadius: 12,
            fontWeight: 700,
            fontSize: 15,
            color: "#fff",
            background: "linear-gradient(135deg, #0f766e 0%, #0d9488 50%, #14b8a6 100%)",
            textDecoration: "none",
            boxShadow: "0 12px 28px rgba(13,148,136,0.35)",
          }}
        >
          Về trang chủ
        </Link>
      </div>
    </main>
  );
}
