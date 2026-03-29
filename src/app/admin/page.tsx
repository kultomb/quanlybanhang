"use client";

/**
 * Chỉ user trong ADMIN_UIDS hoặc token có custom claim admin=true mới tới được đây
 * (middleware trả 404 trước khi render nếu không đủ quyền).
 */
export default function AdminPage() {
  return (
    <main
      style={{
        minHeight: "60vh",
        padding: 28,
        maxWidth: 720,
        margin: "0 auto",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h1 style={{ margin: "0 0 12px", fontSize: 26, color: "#7c2d12" }}>Quản trị</h1>
      <p style={{ margin: 0, color: "#4b5563", lineHeight: 1.55 }}>
        Khu vực dành cho quản trị viên.
      </p>
    </main>
  );
}
