/**
 * Proxy RTDB cho legacy app Hangho.com (bundle POS / FirebaseStorage).
 *
 * Mô hình dữ liệu (tương đương tinh thần “Auth riêng, data trên server”):
 * - Firebase Auth: đăng nhập; cookie HttpOnly `ha_session_token` **hoặc** header `Authorization: Bearer <idToken>`
 *   (iframe legacy gửi Bearer khi một số trình duyệt không kèm cookie trong request từ iframe, dù cùng site).
 * - `users/{uid}`: hồ sơ tài khoản (shopSlug, paymentStatus, …) — không lưu toàn bộ products/orders tại đây.
 * - Dữ liệu nghiệp vụ shop: RTDB `backups/shop_{slug}/…` (pro) hoặc `trial_backups/shop_{slug}/…` (dùng thử).
 *   Client legacy vẫn gọi `/api/rtdb/backups/…`; server map trial → `trial_backups` theo hồ sơ user.
 * - Client legacy gửi URL có thể kèm key cũ; server luôn ép `segments[1] = shop_{slug}` theo `users/{uid}/shopSlug`
 *   (resolve + tự ghi lại nếu chỉ tìm thấy qua `shops/` hoặc `trialShops/`) để không đọc/ghi nhầm kho.
 * - 403 JSON: `missing_shop_slug`, `trial_slug_mismatch`, `production_trial_prefix_forbidden`, `trial_expired`,
 *   `trial_backup_required`, `production_backup_required`.
 *
 * Khác ví dụ Firestore (doc users/{uid} với field products[]): đây là RTDB + một file JSON backup; hành vi đúng
 * vẫn là: chỉ seed demo khi cloud thật sự trống và user xác nhận (xem initAsync trong app.js).
 */
import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/backend/server";
import { getBackupDbRoot } from "@/lib/backend/shop-paths";
import { liftLegacyTrialBackupToTrialBackups } from "@/lib/backend/trialUpgrade";
import { resolveUserShopContext, type UserShopContext } from "@/lib/backend/userShopSlug";
import { getTrialShopPrefix, isEffectiveTrialAccount } from "@/lib/trial-shop";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COOKIE_NAME = "ha_session_token";

function idTokenFromRequest(request: Request, cookieValue: string): string {
  const fromCookie = String(cookieValue || "").trim();
  if (fromCookie) return fromCookie;
  const h = request.headers.get("authorization") ?? request.headers.get("Authorization") ?? "";
  const m = String(h).match(/^\s*Bearer\s+(\S+)\s*$/i);
  return m?.[1]?.trim() ?? "";
}

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

function jsonError(status: number, error: string, message: string) {
  return new Response(JSON.stringify({ error, message }), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

/**
 * Chặn cross-mode: trial ↔ slug có tiền tố; hết hạn trial.
 * Dùng isEffectiveTrialAccount (cờ true/false ưu tiên, chưa set thì suy từ slug).
 */
function assertTrialProductionRtdbAccess(ctx: UserShopContext): Response | null {
  const { shopSlug, registrationTrial, trialExpiresAt } = ctx;
  if (!shopSlug) return null;

  const p = getTrialShopPrefix();
  const slugLooksTrial = shopSlug.startsWith(`${p}-`);
  const isTrial = isEffectiveTrialAccount(registrationTrial, shopSlug, p);

  if (isTrial && !slugLooksTrial) {
    return jsonError(
      403,
      "trial_slug_mismatch",
      "Tài khoản dùng thử và địa chỉ cửa hàng hiện không khớp. Hãy đăng xuất, đăng nhập lại, hoặc liên hệ hỗ trợ.",
    );
  }
  if (!isTrial && slugLooksTrial) {
    return jsonError(
      403,
      "production_trial_prefix_forbidden",
      "Tên cửa hàng không phù hợp với tài khoản đã kích hoạt. Vui lòng liên hệ hỗ trợ.",
    );
  }
  if (isTrial && trialExpiresAt != null && Date.now() > trialExpiresAt) {
    return jsonError(
      403,
      "trial_expired",
      "Thời hạn dùng thử đã hết. Vui lòng nâng cấp tài khoản và thanh toán chuyển khoản (trang Nâng cấp → thanh toán).",
    );
  }
  return null;
}

async function proxy(
  request: Request,
  context: { params: Promise<{ path?: string[] }> },
) {
  const jar = await cookies();
  const token = idTokenFromRequest(request, jar.get(COOKIE_NAME)?.value || "");
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
  const userCtx = await resolveUserShopContext(decoded.uid);
  const trialBlock = assertTrialProductionRtdbAccess(userCtx);
  if (trialBlock) return trialBlock;

  const userShopSlug = userCtx.shopSlug;
  const allowedShopKey = userShopSlug ? `shop_${userShopSlug}` : "";
  if (!allowedShopKey) {
    return jsonError(
      403,
      "missing_shop_slug",
      "Tài khoản của bạn chưa được gắn với một cửa hàng. Hãy hoàn tất bước đăng ký hoặc liên hệ hỗ trợ. Hiện chưa thể lưu hoặc tải dữ liệu bán hàng.",
    );
  }

  // Force per-user storage namespace even if old client sends stale keys like "12345".
  segments[1] = allowedShopKey;
  const pfx = getTrialShopPrefix();
  const trialUser = isEffectiveTrialAccount(userCtx.registrationTrial, userShopSlug, pfx);
  // Trial → trial_backups; pro → backups (URL client luôn backups/…)
  segments[0] = getBackupDbRoot(trialUser);
  const backupRoot = segments[0];
  // Không tin client: ép kho theo hồ sơ; chặn nếu mapping không khớp loại tài khoản (phòng sửa code sai / bypass).
  if (trialUser && backupRoot !== "trial_backups") {
    return jsonError(
      403,
      "trial_backup_required",
      "Dữ liệu cửa hàng chưa mở được với tài khoản dùng thử này. Thử đăng nhập lại hoặc liên hệ hỗ trợ.",
    );
  }
  if (!trialUser && backupRoot !== "backups") {
    return jsonError(
      403,
      "production_backup_required",
      "Dữ liệu cửa hàng chưa mở được. Thử đăng nhập lại hoặc liên hệ hỗ trợ.",
    );
  }
  const targetPath = segments.join("/");
  const db = adminDb();
  if (trialUser) {
    await liftLegacyTrialBackupToTrialBackups(db, allowedShopKey);
  }
  const dbRef = db.ref(targetPath);
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
    const MAX_BODY = 6 * 1024 * 1024;
    const raw = await request.text();
    if (raw.length > MAX_BODY) {
      return jsonError(413, "payload_too_large", "Payload vượt giới hạn cho phép.");
    }
    let value: unknown = null;
    if (raw) {
      try {
        value = JSON.parse(raw) as unknown;
      } catch {
        return jsonError(400, "invalid_json", "Body không phải JSON hợp lệ.");
      }
    }
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
