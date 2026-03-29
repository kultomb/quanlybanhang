import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const SHOP_COOKIE = "ha_shop_slug";

/** Giống normalizeShopSlug (server) — không import userShopSlug vì middleware Edge không được kéo admin SDK. */
function normSlug(value: string): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "");
}

const RESERVED_TOP = new Set([
  "api",
  "_next",
  "login",
  "register",
  "app",
  "account",
  "account-embed",
  "trial",
  "upgrade",
  "payment-required",
  "reset-password",
  "legacy",
]);

/**
 * Chặn /abc, /src… khi đã có cookie shop: redirect ngay trên Edge (trước cache HTML/RSC),
 * không phụ thuộc bundle JS trong trình duyệt chính.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) {
    return NextResponse.next();
  }

  const top = parts[0].toLowerCase();
  if (RESERVED_TOP.has(top)) {
    return NextResponse.next();
  }

  // Chỉ xử lý segment giống slug shop (tránh .well-known, file có dấu chấm, v.v.)
  if (!/^[a-z0-9-]{1,64}$/i.test(parts[0])) {
    return NextResponse.next();
  }

  const cookieSlug = request.cookies.get(SHOP_COOKIE)?.value;
  if (!cookieSlug?.trim()) {
    return withNoStoreIfLooksLikeShopPath(parts, NextResponse.next());
  }

  const urlSlug = normSlug(parts[0]);
  const canon = normSlug(cookieSlug);
  if (!canon || urlSlug === canon) {
    return withNoStoreIfLooksLikeShopPath(parts, NextResponse.next());
  }

  const url = request.nextUrl.clone();
  const tail = parts.slice(1);
  url.pathname = `/${canon}${tail.length ? `/${tail.join("/")}` : ""}`;
  url.search = request.nextUrl.search;
  const res = NextResponse.redirect(url, 307);
  res.headers.set("Cache-Control", "private, no-store, max-age=0, must-revalidate");
  return res;
}

function withNoStoreIfLooksLikeShopPath(parts: string[], res: NextResponse): NextResponse {
  if (parts.length > 0 && !RESERVED_TOP.has(parts[0].toLowerCase())) {
    res.headers.set("Cache-Control", "private, no-store, max-age=0, must-revalidate");
  }
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
