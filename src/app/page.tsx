import Link from "next/link";

export const metadata = {
  title: "Quản lý bán hàng — POS, kho, khách hàng",
  description: "Hệ thống quản lý bán hàng cho cửa hàng điện thoại & linh kiện.",
};

export default function LandingPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background:
          "radial-gradient(1000px 520px at 15% -5%, rgba(16,185,129,0.4), transparent 50%), radial-gradient(800px 480px at 95% 105%, rgba(5,150,105,0.25), transparent 50%), linear-gradient(168deg, #ecfdf5 0%, #d1fae5 40%, #a7f3d0 100%)",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "18px 24px",
          maxWidth: 1120,
          margin: "0 auto",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <span style={{ fontWeight: 800, fontSize: 18, color: "#065f46", letterSpacing: "-0.02em" }}>
          Ha Mobile POS
        </span>
        <nav style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <Link
            href="/trial"
            style={{
              padding: "8px 14px",
              fontSize: 14,
              fontWeight: 600,
              color: "#047857",
              textDecoration: "none",
            }}
          >
            Dùng thử
          </Link>
          <Link
            href="/login"
            style={{
              padding: "8px 14px",
              fontSize: 14,
              fontWeight: 600,
              color: "#374151",
              textDecoration: "none",
            }}
          >
            Đăng nhập
          </Link>
          <Link
            href="/register"
            style={{
              padding: "9px 16px",
              fontSize: 14,
              fontWeight: 700,
              color: "#fff",
              background: "linear-gradient(135deg, #047857, #10b981)",
              borderRadius: 999,
              textDecoration: "none",
              boxShadow: "0 4px 14px rgba(5,150,105,0.35)",
            }}
          >
            Đăng ký
          </Link>
        </nav>
      </header>

      <section
        style={{
          flex: 1,
          display: "grid",
          placeItems: "center",
          padding: "48px 24px 64px",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 720 }}>
          <p
            style={{
              margin: "0 0 12px",
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#059669",
            }}
          >
            Bán hàng · Tồn kho · Khách & công nợ
          </p>
          <h1
            style={{
              margin: "0 0 16px",
              fontSize: "clamp(2rem, 5.5vw, 2.85rem)",
              lineHeight: 1.15,
              color: "#064e3b",
              fontWeight: 800,
              letterSpacing: "-0.03em",
            }}
          >
            Vận hành cửa hàng rõ ràng, dữ liệu đồng bộ đám mây
          </h1>
          <p
            style={{
              margin: "0 0 32px",
              fontSize: 18,
              lineHeight: 1.6,
              color: "#4b5563",
              maxWidth: 560,
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            Một nền tảng gọn cho POS, sản phẩm có IMEI, đơn hàng và sửa chữa — truy cập an toàn qua tài khoản, dữ
            liệu theo từng shop.
          </p>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              justifyContent: "center",
              marginBottom: 48,
            }}
          >
            <Link
              href="/trial"
              style={{
                padding: "16px 26px",
                fontSize: 16,
                fontWeight: 700,
                color: "#fff",
                background: "linear-gradient(135deg, #047857 0%, #059669 50%, #10b981 100%)",
                borderRadius: 14,
                textDecoration: "none",
                boxShadow: "0 14px 36px rgba(5,150,105,0.38)",
              }}
            >
              Dùng thử trên máy bạn
            </Link>
            <Link
              href="/register"
              style={{
                padding: "16px 26px",
                fontSize: 16,
                fontWeight: 700,
                color: "#065f46",
                background: "rgba(255,255,255,0.9)",
                border: "2px solid #34d399",
                borderRadius: 14,
                textDecoration: "none",
              }}
            >
              Đăng ký shop chính thức
            </Link>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 16,
              textAlign: "left",
            }}
          >
            {[
              { t: "POS & quét mã", d: "Bán nhanh, hỗ trợ IMEI và nhiều chế độ tồn kho." },
              { t: "Đồng bộ cloud", d: "Dữ liệu shop gắn với tài khoản, tránh lệch máy." },
              { t: "Dùng thử an toàn", d: "Slug tiền tố try- hoặc Firebase project riêng cho dev." },
            ].map((x) => (
              <div
                key={x.t}
                style={{
                  background: "rgba(255,255,255,0.88)",
                  borderRadius: 14,
                  padding: 20,
                  border: "1px solid rgba(16,185,129,0.2)",
                }}
              >
                <div style={{ fontWeight: 700, color: "#047857", marginBottom: 8 }}>{x.t}</div>
                <div style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.5 }}>{x.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer
        style={{
          padding: "20px 24px",
          textAlign: "center",
          fontSize: 13,
          color: "#6b7280",
          borderTop: "1px solid rgba(16,185,129,0.15)",
          background: "rgba(255,255,255,0.5)",
        }}
      >
        © {new Date().getFullYear()} Ha Mobile POS ·{" "}
        <Link href="/login" style={{ color: "#059669", fontWeight: 600 }}>
          Đăng nhập quản trị
        </Link>
      </footer>
    </main>
  );
}
