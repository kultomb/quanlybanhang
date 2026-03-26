"use client";

import { auth, rtdb } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { get, ref } from "firebase/database";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const BANK_BIN = process.env.NEXT_PUBLIC_BANK_BIN || "970422";
const BANK_ACCOUNT = process.env.NEXT_PUBLIC_BANK_ACCOUNT || "0000000000";
const BANK_NAME = process.env.NEXT_PUBLIC_BANK_NAME || "CHU TAI KHOAN";
const PAYMENT_AMOUNT = Number(process.env.NEXT_PUBLIC_PAYMENT_AMOUNT || 299000);

export default function PaymentRequiredPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialShop = String(searchParams.get("shop") || "");
  const [shop, setShop] = useState(initialShop);
  const [paymentRef, setPaymentRef] = useState("");
  const [checking, setChecking] = useState(true);
  const [message, setMessage] = useState("");

  const qrUrl = useMemo(() => {
    const addInfo = encodeURIComponent(paymentRef || `THANH TOAN ${shop || "SHOP"}`);
    const accountName = encodeURIComponent(BANK_NAME);
    return `https://img.vietqr.io/image/${BANK_BIN}-${BANK_ACCOUNT}-compact2.png?amount=${PAYMENT_AMOUNT}&addInfo=${addInfo}&accountName=${accountName}`;
  }, [paymentRef, shop]);

  async function checkStatus(uid: string) {
    const snap = await get(ref(rtdb, `users/${uid}`));
    const profile = (snap.val() || {}) as {
      shopSlug?: string;
      paymentStatus?: string;
      paymentRef?: string;
    };
    const resolvedShop = String(profile.shopSlug || "");
    if (resolvedShop) setShop(resolvedShop);
    setPaymentRef(String(profile.paymentRef || ""));
    const paid = profile.paymentStatus !== "pending";
    if (paid) {
      router.replace(`/${resolvedShop || shop || ""}`);
      return true;
    }
    return false;
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }
      await checkStatus(user.uid);
      setChecking(false);
    });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    if (checking) return;
    const timer = window.setInterval(() => {
      const user = auth.currentUser;
      if (!user) return;
      void checkStatus(user.uid);
    }, 12000);
    return () => window.clearInterval(timer);
  }, [checking]);

  async function handleIHavePaid() {
    const user = auth.currentUser;
    if (!user) {
      router.replace("/login");
      return;
    }
    setMessage("Đang kiểm tra thanh toán...");
    const paid = await checkStatus(user.uid);
    if (!paid) {
      setMessage(
        "Chưa ghi nhận thanh toán. Vui lòng chuyển khoản đúng nội dung và bấm kiểm tra lại sau 10-30 giây.",
      );
    }
  }

  async function handleLogout() {
    await signOut(auth);
    await fetch("/api/auth/session", { method: "DELETE" }).catch(() => undefined);
    router.replace("/login");
  }

  if (checking) return null;

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background:
          "radial-gradient(1200px 600px at 20% -10%, rgba(16,185,129,0.35), transparent 55%), radial-gradient(900px 500px at 90% 110%, rgba(5,150,105,0.28), transparent 55%), linear-gradient(160deg, #ecfdf5 0%, #d1fae5 45%, #a7f3d0 100%)",
        padding: 16,
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: 520,
          background: "rgba(255,255,255,0.95)",
          borderRadius: 16,
          border: "1px solid rgba(16,185,129,0.22)",
          boxShadow: "0 16px 40px rgba(5,150,105,0.18)",
          padding: 22,
          display: "grid",
          gap: 12,
        }}
      >
        <h1 style={{ margin: 0, color: "#065f46", fontSize: 24, textAlign: "center" }}>
          Kich hoat tai khoan
        </h1>
        <p style={{ margin: 0, color: "#475569", textAlign: "center", fontSize: 14 }}>
          Hoan tat chuyen khoan de mo khoa gian hang: <strong>{shop || "-"}</strong>
        </p>

        <div style={{ textAlign: "center", fontSize: 14, color: "#0f172a" }}>
          <div>
            So tien: <strong>{PAYMENT_AMOUNT.toLocaleString("vi-VN")} VND</strong>
          </div>
          <div>
            Noi dung: <strong>{paymentRef || `THANH TOAN ${shop || "SHOP"}`}</strong>
          </div>
        </div>

        <div style={{ display: "grid", placeItems: "center", padding: 8 }}>
          <img
            src={qrUrl}
            alt="QR thanh toan"
            style={{ width: 280, maxWidth: "100%", borderRadius: 12, border: "1px solid #d1fae5" }}
          />
        </div>

        {message ? (
          <div
            style={{
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              color: "#1d4ed8",
              borderRadius: 8,
              padding: "10px 12px",
              fontSize: 13,
            }}
          >
            {message}
          </div>
        ) : null}

        <button
          type="button"
          onClick={handleIHavePaid}
          style={{
            border: "none",
            borderRadius: 10,
            background: "linear-gradient(135deg, #047857 0%, #059669 50%, #10b981 100%)",
            color: "white",
            padding: "12px 14px",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Toi da chuyen khoan - Kiem tra lai
        </button>

        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
          <Link href="/login" style={{ color: "#065f46", fontWeight: 700 }}>
            Ve dang nhap
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            style={{
              border: "1px solid rgba(239,68,68,0.35)",
              background: "#ef4444",
              color: "white",
              borderRadius: 8,
              padding: "8px 12px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Dang xuat
          </button>
        </div>
      </section>
    </main>
  );
}
