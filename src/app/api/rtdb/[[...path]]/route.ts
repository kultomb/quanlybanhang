/**
 * Proxy RTDB cho legacy app (HamobileBanhang / FirebaseStorage).
 *
 * Mô hình dữ liệu (tương đương tinh thần “Auth riêng, data trên server”):
 * - Firebase Auth: đăng nhập; session cookie `ha_session_token` xác thực request tới đây.
 * - `users/{uid}`: hồ sơ tài khoản (shopSlug, paymentStatus, …) — không lưu toàn bộ products/orders tại đây.
 * - Dữ liệu nghiệp vụ shop: RTDB path `backups/shop_{shopSlug}/app.json` (một JSON lớn: customers, products, orders…).
 * - Client legacy gửi URL có thể kèm key cũ; server luôn ép `segments[1] = shop_{slug}` theo `users/{uid}/shopSlug`
 *   (resolve + tự ghi lại nếu chỉ tìm thấy qua `shops/`) để không đọc/ghi nhầm kho.
 * - 403 `missing_shop_slug`: JSON `{ error, message }` khi hồ sơ user không có slug hợp lệ.
 *
 * Khác ví dụ Firestore (doc users/{uid} với field products[]): đây là RTDB + một file JSON backup; hành vi đúng
 * vẫn là: chỉ seed demo khi cloud thật sự trống và user xác nhận (xem initAsync trong app.js).
 */
import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/backend/server";
import { resolveUserShopSlugWithHeal } from "@/lib/backend/userShopSlug";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COOKIE_NAME = "ha_session_token";

function normalizePathSegments(pathValue: string) {
  return pathValue
    .replace(/^\/+/, "")
    .split("/")
    .filter(Boolean)
    .map((s) => s.replace(/\.json$/i, ""));
}

function toShallowObject(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  return Object.keys(value as Record<string, unknown>).reduce<Record<string, boolean>>((acc, key) => {
    acc[key] = true;
    return acc;
  }, {});
}

async function proxy(
  request: Request,
  context: { params: Promise<{ path?: string[] }> },
) {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value || "";
  if (!token) return new Response("Unauthorized", { status: 401 });

  const decoded = await adminAuth()
    .verifyIdToken(token)
    .catch(() => null);
  if (!decoded?.uid) return new Response("Unauthorized", { status: 401 });

  const { path } = await context.params;
  const fullPath = (path || []).join("/");
  if (!fullPath.startsWith("backups/")) {
    return new Response("Forbidden path", { status: 403 });
  }

  const segments = normalizePathSegments(fullPath);
  // Expected: backups/{shopKey}/...
  if (segments.length < 2 || segments[0] !== "backups") {
    return new Response("Forbidden path", { status: 403 });
  }
  const requestedShopKey = segments[1];
  const userShopSlug = await resolveUserShopSlugWithHeal(decoded.uid);
  const allowedShopKey = userShopSlug ? `shop_${userShopSlug}` : "";
  if (!allowedShopKey) {
    return new Response(
      JSON.stringify({
        error: "missing_shop_slug",
        message:
          "Tài khoản chưa có shopSlug (users/{uid}/shopSlug). Hoàn tất đăng ký shop, sửa hồ sơ trên Firebase, hoặc liên hệ hỗ trợ — không thể đọc/ghi kho dữ liệu.",
      }),
      {
        status: 403,
        headers: {
          "content-type": "application/json; charset=utf-8",
          "cache-control": "no-store",
        },
      },
    );
  }

  // Force per-user storage namespace even if old client sends stale keys like "12345".
  segments[1] = allowedShopKey;
  const targetPath = segments.join("/");
  const dbRef = adminDb().ref(targetPath);
  const method = request.method.toUpperCase();
  if (method === "GET") {
    const snap = await dbRef.get();
    const reqUrl = new URL(request.url);
    const shallow = reqUrl.searchParams.get("shallow") === "true";
    const value = shallow ? toShallowObject(snap.val()) : snap.val();
    return new Response(JSON.stringify(value ?? null), {
      status: 200,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
      },
    });
  }

  if (method === "PUT") {
    const raw = await request.text();
    const value = raw ? JSON.parse(raw) : null;
    await dbRef.set(value);
    return new Response(JSON.stringify(value ?? null), {
      status: 200,
      headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
    });
  }

  if (method === "DELETE") {
    await dbRef.remove();
    return new Response("null", {
      status: 200,
      headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
    });
  }

  return new Response("Method Not Allowed", { status: 405 });
}

export async function GET(
  request: Request,
  context: { params: Promise<{ path?: string[] }> },
) {
  return proxy(request, context);
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ path?: string[] }> },
) {
  return proxy(request, context);
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ path?: string[] }> },
) {
  return proxy(request, context);
}
