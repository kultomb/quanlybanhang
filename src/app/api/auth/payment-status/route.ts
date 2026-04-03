import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/backend/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COOKIE_NAME = "ha_session_token";

/**
 * Đọc paymentStatus / shopSlug từ RTDB bằng Admin SDK (không phụ thuộc rule client).
 * Trang /payment-required dùng để biết đã kích hoạt sau khi webhook ghi DB.
 */
export async function GET(request: Request) {
  let idToken = "";
  const h = request.headers.get("authorization") || request.headers.get("Authorization") || "";
  const m = h.match(/^\s*Bearer\s+(\S+)\s*$/i);
  if (m?.[1]) idToken = m[1].trim();
  if (!idToken) {
    const jar = await cookies();
    idToken = String(jar.get(COOKIE_NAME)?.value || "").trim();
  }
  if (!idToken) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const decoded = await adminAuth().verifyIdToken(idToken).catch(() => null);
  if (!decoded?.uid) {
    return Response.json({ error: "invalid_token" }, { status: 401 });
  }

  const snap = await adminDb().ref(`users/${decoded.uid}`).get();
  const profile = (snap.val() || {}) as {
    shopSlug?: string;
    paymentStatus?: string;
    paymentRef?: string;
    registrationTrial?: unknown;
    upgradeTargetSlug?: string;
  };

  const paymentStatus = String(profile.paymentStatus || "").trim();
  const paid = paymentStatus === "active";

  return Response.json({
    paid,
    paymentStatus,
    shopSlug: String(profile.shopSlug || "").trim(),
    paymentRef: String(profile.paymentRef || "").trim(),
    registrationTrial: profile.registrationTrial,
    upgradeTargetSlug: String(profile.upgradeTargetSlug || "").trim(),
  });
}
