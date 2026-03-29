"use client";

import RequireAuth from "@/components/RequireAuth";

export default function DashboardPage() {
  return (
    <RequireAuth>
      <main
        style={{
          minHeight: "60vh",
          padding: 28,
          maxWidth: 720,
          margin: "0 auto",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <h1 style={{ margin: "0 0 12px", fontSize: 26, color: "#065f46" }}>Bảng điều khiển</h1>
        <p style={{ margin: 0, color: "#4b5563", lineHeight: 1.55 }}>
          Trang nội bộ — yêu cầu đăng nhập. Đường dẫn được bảo vệ ở middleware và phiên client.
        </p>
      </main>
    </RequireAuth>
  );
}
