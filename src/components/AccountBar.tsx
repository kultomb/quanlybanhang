"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useEffect, useMemo, useRef, useState } from "react";
import { auth } from "@/lib/backend/client";

type AccountBarProps = {
  shop?: string;
};

export default function AccountBar({ shop }: AccountBarProps) {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setEmail(user?.email || "");
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const updateMobile = () => setIsMobile(window.innerWidth <= 768);
    updateMobile();
    window.addEventListener("resize", updateMobile);
    return () => window.removeEventListener("resize", updateMobile);
  }, []);

  useEffect(() => {
    const onDocClick = (event: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  const accountName = useMemo(() => {
    if (!email) return "Khách";
    return email.split("@")[0] || email;
  }, [email]);

  const shortShop = useMemo(() => {
    if (!shop) return "Tài khoản";
    return shop.length > 16 ? `${shop.slice(0, 16)}...` : shop;
  }, [shop]);

  async function handleLogout() {
    await signOut(auth);
    router.replace("/login");
  }

  return (
    <>
      {open ? (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1199,
            background: "transparent",
          }}
        />
      ) : null}
      <div
        ref={rootRef}
        style={{
          position: "fixed",
          top: isMobile ? 10 : 12,
          right: isMobile ? 16 : 20,
          zIndex: 1200,
        }}
      >
        <button
          onClick={() => setOpen((v) => !v)}
          title="Mở menu tài khoản"
          aria-label="Mở menu tài khoản"
          style={{
            width: "auto",
            maxWidth: isMobile ? "min(210px, calc(100vw - 24px))" : 240,
            height: isMobile ? 36 : 40,
            borderRadius: 10,
            border: "1px solid rgba(4,120,87,0.35)",
            background: "rgba(255,255,255,0.94)",
            color: "white",
            fontSize: isMobile ? 12 : 13,
            cursor: "pointer",
            boxShadow: "0 10px 24px rgba(5,150,105,0.18)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 6,
            padding: isMobile ? "0 8px" : "0 10px",
            colorScheme: "light",
            borderStyle: "solid",
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: isMobile ? 22 : 24,
              height: isMobile ? 22 : 24,
              borderRadius: 999,
              background:
                "linear-gradient(135deg, #047857 0%, #059669 50%, #10b981 100%)",
              color: "white",
              fontSize: isMobile ? 11 : 12,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            👤
          </span>
          <span
            style={{
              minWidth: 0,
              flex: 1,
              textAlign: "left",
              color: "#065f46",
              fontWeight: 700,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              padding: 0,
              fontSize: isMobile ? 12 : 13,
            }}
            title={`${shop || "Tài khoản"} • ${loading ? "Đang tải..." : accountName}`}
          >
            {shortShop}
          </span>
        </button>

        {open ? (
          <div
            style={{
              position: "absolute",
              top: isMobile ? 42 : 46,
              right: 0,
              width: isMobile ? "min(280px, calc(100vw - 20px))" : 300,
              background: "white",
              color: "#0f172a",
              borderRadius: 14,
              padding: 12,
              border: "1px solid rgba(5,150,105,0.35)",
              boxShadow: "0 16px 40px rgba(2,6,23,0.22)",
              fontSize: 13,
              display: "grid",
              gap: 10,
            }}
          >
            {email ? (
              <>
                <Link
                  href={shop ? `/${shop}/account` : "/account"}
                  style={{
                    textAlign: "center",
                    border: "1px solid rgba(5,150,105,0.35)",
                    background: "#ecfdf5",
                    color: "#065f46",
                    borderRadius: 8,
                    padding: "8px 10px",
                    fontSize: 12,
                    fontWeight: 700,
                    textDecoration: "none",
                  }}
                >
                  Tài khoản / Đổi mật khẩu
                </Link>
                <button
                  onClick={handleLogout}
                  style={{
                    width: "100%",
                    border: "1px solid rgba(239,68,68,0.35)",
                    background: "#ef4444",
                    color: "white",
                    borderRadius: 8,
                    padding: "8px 10px",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    textAlign: "center",
                  }}
                >
                  Đăng xuất
                </button>
              </>
            ) : (
              <Link
                href="/login"
                style={{
                  textAlign: "center",
                  border: "1px solid rgba(5,150,105,0.35)",
                  background:
                    "linear-gradient(135deg, #047857 0%, #059669 50%, #10b981 100%)",
                  color: "white",
                  borderRadius: 8,
                  padding: "8px 10px",
                  fontSize: 12,
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                Đăng nhập
              </Link>
            )}
          </div>
        ) : null}
      </div>
    </>
  );
}
