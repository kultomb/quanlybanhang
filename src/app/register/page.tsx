"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import {
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import { get, ref, set, serverTimestamp } from "firebase/database";
import { auth, rtdb } from "@/lib/firebase";

function getAuthErrorMessage(err: unknown): string {
  const raw = err instanceof Error ? err.message : "";
  const codeMatch = raw.match(/auth\/[a-z-]+/i);
  const code = (codeMatch?.[0] || "").toLowerCase();
  const normalized = raw.toLowerCase();

  if (
    normalized.includes("permission_denied") ||
    normalized.includes("database/permission-denied") ||
    normalized.includes("insufficient permissions")
  ) {
    return "Đăng ký bị chặn bởi quyền dữ liệu (Rules). Vui lòng cập nhật/publish Rules mới rồi thử lại.";
  }
  if (normalized.includes("app_check") || normalized.includes("app check")) {
    return "Dịch vụ bảo mật App Check đang chặn yêu cầu. Vui lòng kiểm tra cấu hình App Check.";
  }

  switch (code) {
    case "auth/invalid-email":
      return "Email không hợp lệ.";
    case "auth/email-already-in-use":
      return "Email này đã được đăng ký.";
    case "auth/weak-password":
      return "Mật khẩu quá yếu. Vui lòng đặt mật khẩu mạnh hơn.";
    case "auth/network-request-failed":
      return "Lỗi kết nối mạng. Vui lòng kiểm tra Internet và thử lại.";
    case "auth/too-many-requests":
      return "Thao tác quá nhanh hoặc quá nhiều lần. Vui lòng thử lại sau.";
    default:
      return raw ? `Đăng ký thất bại: ${raw}` : "Đăng ký thất bại. Vui lòng thử lại.";
  }
}

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [shopSlug, setShopSlug] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function normalizeSlug(value: string) {
    return value
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  async function handleRegister(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const slug = normalizeSlug(shopSlug);
    const emailTrimmed = email.trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      setError("Email không đúng định dạng (ví dụ: ten@domain.com).");
      return;
    }

    if (password.length < 6) {
      setError("Mật khẩu phải từ 6 ký tự.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }
    if (!/^[a-z0-9-]{3,30}$/.test(slug)) {
      setError("Tên shop chỉ gồm a-z, số, dấu -, độ dài 3-30 ký tự.");
      return;
    }

    setLoading(true);
    try {
      const shopRef = ref(rtdb, `shops/${slug}`);
      const cred = await createUserWithEmailAndPassword(auth, emailTrimmed, password);
      const uid = cred.user.uid;
      const idToken = await cred.user.getIdToken();
      const paymentRef = `PAY-${slug.toUpperCase()}-${Date.now().toString().slice(-6)}`;

      await new Promise<void>((resolve) => {
        let done = false;
        const timer = window.setTimeout(() => {
          if (done) return;
          done = true;
          resolve();
        }, 3000);
        const unsub = onAuthStateChanged(auth, (u) => {
          if (done) return;
          if (!u || u.uid !== uid) return;
          done = true;
          window.clearTimeout(timer);
          unsub();
          resolve();
        });
      });

      const existingShop = await get(shopRef);
      if (existingShop.exists()) {
        setError("Tên shop đã tồn tại. Vui lòng chọn tên khác.");
        try {
          await deleteUser(cred.user);
        } catch {
          await signOut(auth).catch(() => undefined);
        }
        setLoading(false);
        return;
      }

      async function setWithRetry(targetRef: ReturnType<typeof ref>, value: unknown, label: string) {
        try {
          await set(targetRef, value);
          return;
        } catch (e) {
          const raw = e instanceof Error ? e.message : String(e);
          if (!raw.toLowerCase().includes("permission denied")) {
            throw new Error(`Không ghi được ${label}: ${raw}`);
          }
          await new Promise((r) => window.setTimeout(r, 450));
          try {
            await set(targetRef, value);
            return;
          } catch (e2) {
            const raw2 = e2 instanceof Error ? e2.message : String(e2);
            throw new Error(`Không ghi được ${label}: ${raw2}`);
          }
        }
      }

      try {
        await setWithRetry(ref(rtdb, `users/${uid}`), {
          uid,
          email: emailTrimmed,
          shopSlug: slug,
          paymentStatus: "pending",
          paymentRef,
          createdAt: serverTimestamp(),
        }, "hồ sơ user");
      } catch (e) {
        const raw = e instanceof Error ? e.message : String(e);
        setError(`${raw}. Hãy kiểm tra Rules đã publish đúng và App Check không chặn sai.`);
        setLoading(false);
        return;
      }

      try {
        await setWithRetry(shopRef, {
          slug,
          ownerUid: uid,
          ownerEmail: emailTrimmed,
          createdAt: serverTimestamp(),
        }, "thông tin shop");
      } catch (e) {
        const raw = e instanceof Error ? e.message : String(e);
        setError(`${raw}. Hãy kiểm tra Rules đã publish đúng và App Check không chặn sai.`);
        setLoading(false);
        return;
      }

      await fetch("/api/auth/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ idToken, shopSlug: slug }),
      }).catch(() => undefined);

      router.replace(`/payment-required?shop=${encodeURIComponent(slug)}`);
    } catch (err: unknown) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

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
      <form
        onSubmit={handleRegister}
        style={{
          width: "100%",
          maxWidth: 420,
          background: "rgba(255,255,255,0.94)",
          backdropFilter: "blur(6px)",
          borderRadius: 16,
          padding: 24,
          border: "1px solid rgba(16,185,129,0.22)",
          boxShadow: "0 16px 40px rgba(5,150,105,0.18)",
          display: "grid",
          gap: 14,
        }}
      >
        <h1 style={{ margin: 0, fontSize: 26, color: "#065f46", textAlign: "center" }}>
          Đăng ký tài khoản
        </h1>
        <p style={{ margin: 0, color: "#4b5563", fontSize: 14, textAlign: "center" }}>
          Tạo tài khoản để vào hệ thống bán hàng.
        </p>

        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Tên shop</span>
          <input
            type="text"
            required
            value={shopSlug}
            onChange={(e) => setShopSlug(e.target.value)}
            placeholder="vd: minhhamobile"
            style={{
              border: "1px solid #a7f3d0",
              borderRadius: 10,
              padding: "11px 12px",
              fontSize: 14,
              outline: "none",
            }}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Email</span>
          <input
            type="text"
            inputMode="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              border: "1px solid #a7f3d0",
              borderRadius: 10,
              padding: "11px 12px",
              fontSize: 14,
              outline: "none",
            }}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Mật khẩu</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              border: "1px solid #a7f3d0",
              borderRadius: 10,
              padding: "11px 12px",
              fontSize: 14,
              outline: "none",
            }}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Xác nhận mật khẩu</span>
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={{
              border: "1px solid #a7f3d0",
              borderRadius: 10,
              padding: "11px 12px",
              fontSize: 14,
              outline: "none",
            }}
          />
        </label>

        {error ? (
          <div
            style={{
              background: "#fef2f2",
              color: "#b91c1c",
              border: "1px solid #fecaca",
              borderRadius: 8,
              padding: "10px 12px",
              fontSize: 13,
            }}
          >
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          style={{
            border: "none",
            borderRadius: 10,
            background: loading
              ? "#6b7280"
              : "linear-gradient(135deg, #047857 0%, #059669 50%, #10b981 100%)",
            color: "#fff",
            fontWeight: 700,
            padding: "12px 14px",
            cursor: loading ? "not-allowed" : "pointer",
            boxShadow: loading ? "none" : "0 10px 22px rgba(5,150,105,0.28)",
          }}
        >
          {loading ? "Đang tạo tài khoản..." : "Đăng ký"}
        </button>

        <div style={{ textAlign: "center", fontSize: 14, color: "#4b5563" }}>
          Đã có tài khoản?
          {" "}
          <Link
            href="/login"
            style={{
              color: "#065f46",
              fontWeight: 800,
              textDecoration: "none",
              background: "#ecfdf5",
              border: "1px solid #a7f3d0",
              borderRadius: 999,
              padding: "4px 10px",
              display: "inline-block",
            }}
          >
            Đăng nhập
          </Link>
        </div>
      </form>
    </main>
  );
}
