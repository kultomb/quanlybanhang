"use client";

import RequireAuth from "@/components/RequireAuth";

export default function SrcProtectedPage() {
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
        <h1 style={{ margin: "0 0 12px", fontSize: 26, color: "#1e3a5f" }}>Khu vực /src</h1>
        <p style={{ margin: 0, color: "#4b5563", lineHeight: 1.55 }}>
          Route được bảo vệ — không dùng làm slug cửa hàng.
        </p>
      </main>
    </RequireAuth>
  );
}
