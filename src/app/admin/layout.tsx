import type { Metadata } from "next";
import Link from "next/link";

import "./admin.css";

export const metadata: Metadata = {
  title: "Quản trị — Hangho.com",
  description: "Bảng quản lý nội bộ — chỉ tài khoản được cấp quyền.",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="adm-shell">
      <header className="adm-topbar">
        <div className="adm-topbar-brand">
          <span className="adm-topbar-logo">Hangho.com</span>
          <span className="adm-topbar-sep" aria-hidden>
            /
          </span>
          <span className="adm-topbar-title">Quản trị</span>
          <span className="adm-topbar-pill">/admin</span>
        </div>
        <nav className="adm-topbar-nav">
          <Link href="/">Trang chủ</Link>
        </nav>
      </header>
      <div className="adm-main">{children}</div>
    </div>
  );
}
