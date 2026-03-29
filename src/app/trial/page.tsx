import type { Metadata } from "next";
import Link from "next/link";
import { HanghoLogoLink } from "@/components/HanghoBrand";
import styles from "../page.module.css";

export const metadata: Metadata = {
  title: "Dùng thử — Hangho.com",
  description: "Trải nghiệm POS miễn phí, không cần chuyển khoản.",
  robots: { index: false, follow: false },
};

export default function TrialPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background:
          "radial-gradient(900px 480px at 12% -8%, rgba(16,185,129,0.38), transparent 52%), radial-gradient(720px 420px at 92% 102%, rgba(5,150,105,0.2), transparent 50%), linear-gradient(168deg, #ecfdf5 0%, #d1fae5 42%, #bbf7d0 100%)",
      }}
    >
      <header className={`${styles.landingHeader} ${styles.landingHeaderNarrow}`}>
        <div className={styles.landingBrand}>
          <HanghoLogoLink href="/" variant="compact" />
        </div>
        <nav className={styles.landingNav}>
          <Link href="/" className={styles.landingNavLink}>
            Trang chủ
          </Link>
          <Link href="/login" className={`${styles.landingNavLink} ${styles.landingNavLinkMuted}`}>
            Đăng nhập
          </Link>
        </nav>
      </header>

      <div
        style={{
          flex: 1,
          maxWidth: 640,
          margin: "0 auto",
          width: "100%",
          padding: "8px 22px 56px",
          boxSizing: "border-box",
        }}
      >
        <p style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 600, color: "#059669", letterSpacing: "0.04em" }}>
          MIỄN PHÍ · KHÔNG CẦN CHUYỂN KHOẢN
        </p>
        <h1
          style={{
            margin: "0 0 14px",
            fontSize: "clamp(1.75rem, 5vw, 2.25rem)",
            fontWeight: 800,
            color: "#022c22",
            lineHeight: 1.2,
            letterSpacing: "-0.03em",
          }}
        >
          Dùng thử POS trong vài phút
        </h1>
        <p style={{ margin: "0 0 28px", fontSize: 17, color: "#334155", lineHeight: 1.55, maxWidth: 520 }}>
          Tạo tài khoản dùng thử, làm quen bán hàng và các tính năng POS.
        </p>

        <div
          style={{
            display: "grid",
            gap: 10,
            marginBottom: 28,
          }}
        >
          {[
            "Không qua bước thanh toán khi đăng ký dùng thử",
            "Mỗi lần đăng ký có không gian riêng cho dữ liệu thử",
            "Thời gian dùng thử có giới hạn; phù hợp demo hoặc tập huấn",
          ].map((text) => (
            <div
              key={text}
              style={{
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
                background: "rgba(255,255,255,0.72)",
                border: "1px solid rgba(16,185,129,0.2)",
                borderRadius: 12,
                padding: "14px 16px",
                boxShadow: "0 4px 20px rgba(15,118,110,0.06)",
              }}
            >
              <span
                style={{
                  flexShrink: 0,
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: "#059669",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 800,
                  display: "grid",
                  placeItems: "center",
                  marginTop: 1,
                }}
                aria-hidden
              >
                ✓
              </span>
              <span style={{ fontSize: 15, color: "#1e293b", lineHeight: 1.5 }}>{text}</span>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 40 }}>
          <Link
            href="/register?trial=1"
            style={{
              display: "block",
              textAlign: "center",
              padding: "16px 22px",
              borderRadius: 14,
              background: "linear-gradient(135deg, #047857 0%, #059669 45%, #10b981 100%)",
              color: "#fff",
              fontWeight: 800,
              fontSize: 16,
              textDecoration: "none",
              boxShadow: "0 12px 32px rgba(5,150,105,0.35)",
            }}
          >
            Bắt đầu dùng thử
          </Link>
          <Link
            href="/login"
            style={{
              display: "block",
              textAlign: "center",
              padding: "14px 22px",
              borderRadius: 14,
              border: "2px solid rgba(5,150,105,0.45)",
              color: "#047857",
              fontWeight: 700,
              fontSize: 15,
              textDecoration: "none",
              background: "rgba(255,255,255,0.85)",
            }}
          >
            Đã có tài khoản — Đăng nhập
          </Link>
        </div>
      </div>
    </main>
  );
}
