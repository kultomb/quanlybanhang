import Link from "next/link";
import { HanghoLogoLink } from "@/components/HanghoBrand";
import styles from "./page.module.css";

export const metadata = {
  title: "Hangho.com — POS, kho, khách hàng",
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
      <header className={styles.landingHeader}>
        <div className={styles.landingBrand}>
          <HanghoLogoLink variant="landing" />
        </div>
        <nav className={styles.landingNav}>
          <Link href="/trial" className={styles.landingNavLink}>
            Dùng thử
          </Link>
          <Link href="/login" className={`${styles.landingNavLink} ${styles.landingNavLinkMuted}`}>
            Đăng nhập
          </Link>
          <Link href="/register" className={`${styles.landingNavLink} ${styles.landingNavCta}`}>
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
              {
                t: "Bán hàng thần tốc",
                d: "Tối ưu hóa quy trình thanh toán với tính năng quét mã vạch/IMEI hiện đại, giúp hoàn tất đơn hàng chỉ trong tích tắc.",
              },
              {
                t: "Kiểm soát kho thông minh",
                d: "Nắm bắt chính xác số lượng tồn kho theo thời gian thực tế, quản lý nhập - xuất chặt chẽ, loại bỏ hoàn toàn sai sót.",
              },
              {
                t: "Quản lý công nợ triệt để",
                d: "Hệ thống tự động lưu trữ và nhắc nhở công nợ, giúp bạn theo dõi chi tiết từng khách hàng, đảm bảo dòng tiền luôn minh bạch.",
              },
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
        © {new Date().getFullYear()} Hangho.com ·{" "}
        <Link href="/login" style={{ color: "#059669", fontWeight: 600 }}>
          Đăng nhập
        </Link>
      </footer>
    </main>
  );
}
