import Link from "next/link";

type HanghoErrorPageProps = {
  code: "404" | "403";
  title: string;
  description: string;
  homeHref?: string;
  homeLabel?: string;
};

export function HanghoErrorPage({
  code,
  title,
  description,
  homeHref = "/",
  homeLabel = "Về trang chủ",
}: HanghoErrorPageProps) {
  const kicker = code === "404" ? "Trang không tồn tại" : "Truy cập bị từ chối";

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "28px 18px",
        background: "linear-gradient(165deg, #ecfdf5 0%, #d1fae5 38%, #a7f3d0 72%, #86efac 100%)",
        fontFamily: "var(--font-montserrat), system-ui, sans-serif",
      }}
    >
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          background:
            "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(16, 185, 129, 0.22), transparent 55%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 460,
          background: "rgba(255, 255, 255, 0.94)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          borderRadius: 24,
          padding: "44px 36px 40px",
          boxShadow:
            "0 32px 64px -24px rgba(4, 120, 87, 0.28), 0 0 0 1px rgba(167, 243, 208, 0.85)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 24,
            right: 24,
            height: 4,
            borderRadius: "0 0 6px 6px",
            background: "linear-gradient(90deg, #047857 0%, #059669 45%, #10b981 100%)",
          }}
        />
        <div
          style={{
            width: 76,
            height: 76,
            margin: "8px auto 22px",
            borderRadius: 22,
            background: "linear-gradient(135deg, #047857 0%, #059669 50%, #10b981 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 34,
            lineHeight: 1,
            boxShadow: "0 12px 32px rgba(5, 150, 105, 0.38)",
          }}
        >
          🛒
        </div>
        <p
          style={{
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "#047857",
            margin: "0 0 6px",
          }}
        >
          {kicker}
        </p>
        <p
          style={{
            fontSize: 56,
            fontWeight: 800,
            lineHeight: 1,
            margin: "0 0 16px",
            background: "linear-gradient(135deg, #065f46 0%, #059669 50%, #34d399 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          {code}
        </p>
        <h1
          style={{
            fontSize: 24,
            fontWeight: 800,
            color: "#0f172a",
            margin: "0 0 14px",
            lineHeight: 1.25,
            letterSpacing: "-0.02em",
          }}
        >
          {title}
        </h1>
        <p
          style={{
            fontSize: 15,
            lineHeight: 1.65,
            color: "#475569",
            margin: "0 0 28px",
          }}
        >
          {description}
        </p>
        <Link
          href={homeHref}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            fontWeight: 700,
            fontSize: 15,
            color: "#fff",
            textDecoration: "none",
            padding: "14px 28px",
            borderRadius: 12,
            background: "linear-gradient(135deg, #047857 0%, #059669 50%, #10b981 100%)",
            boxShadow: "0 10px 28px rgba(5, 150, 105, 0.38)",
            transition: "transform 0.15s ease, box-shadow 0.15s ease",
          }}
        >
          {homeLabel}
        </Link>
        <p style={{ marginTop: 26, fontSize: 13, color: "#94a3b8", fontWeight: 500 }}>
          Hangho.com — Quản lý bán hàng
        </p>
      </div>
    </main>
  );
}
