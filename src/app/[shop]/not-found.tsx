import Link from "next/link";

export default function ShopNotFound() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        fontFamily: "system-ui, sans-serif",
        background: "linear-gradient(160deg, #f8fafc 0%, #e2e8f0 100%)",
      }}
    >
      <div
        style={{
          maxWidth: 420,
          textAlign: "center",
          color: "#334155",
        }}
      >
        <h1 style={{ margin: "0 0 8px", fontSize: 22, color: "#0f172a" }}>Không tìm thấy cửa hàng</h1>
        <p style={{ margin: "0 0 20px", fontSize: 15, lineHeight: 1.55 }}>
          Địa chỉ này không khớp với cửa hàng nào trên hệ thống. Kiểm tra lại tên shop hoặc đường dẫn.
        </p>
        <Link
          href="/"
          style={{
            display: "inline-block",
            fontWeight: 700,
            color: "#047857",
            textDecoration: "none",
            padding: "10px 18px",
            borderRadius: 10,
            background: "#ecfdf5",
            border: "1px solid #a7f3d0",
          }}
        >
          Về trang chủ
        </Link>
      </div>
    </main>
  );
}
