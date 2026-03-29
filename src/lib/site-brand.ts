/**
 * Thương hiệu & domain công khai (hangho.com).
 * - `NEXT_PUBLIC_SITE_BRAND`: tên hiển thị (mặc định Hangho).
 * - `NEXT_PUBLIC_APP_URL`: URL production https://hangho.com — dùng cho link trong email đặt lại mật khẩu (tránh localhost trong mail).
 */

export function getSiteBrandName(): string {
  const s = (process.env.NEXT_PUBLIC_SITE_BRAND || "Hangho").trim();
  return s || "Hangho";
}

/**
 * Domain chỉ để hiển thị (không có protocol), ví dụ hangho.com.
 */
export function getSiteDomainHint(): string {
  const raw = (process.env.NEXT_PUBLIC_APP_URL || "").trim().replace(/\/+$/, "");
  if (!raw) return "hangho.com";
  try {
    const host = new URL(raw.startsWith("http") ? raw : `https://${raw}`).hostname;
    return host || "hangho.com";
  } catch {
    return "hangho.com";
  }
}

/**
 * Origin dùng làm `continueUrl` cho email đặt lại mật khẩu.
 * Ưu tiên `NEXT_PUBLIC_APP_URL` (nên đặt https://hangho.com trên Vercel và có thể trong .env.local khi test gửi mail).
 * Không dùng localhost làm continueUrl trong email — tránh link mail hiển thị localhost.
 */
export function getPasswordResetContinueOrigin(): string {
  const configured = (process.env.NEXT_PUBLIC_APP_URL || "").trim().replace(/\/+$/, "");
  if (configured && /^https?:\/\//i.test(configured)) {
    return configured;
  }
  if (typeof window === "undefined") return "";
  const o = window.location.origin;
  try {
    const h = new URL(o).hostname.toLowerCase();
    if (h === "localhost" || h === "127.0.0.1" || h === "[::1]") return "";
  } catch {
    return "";
  }
  return o;
}
