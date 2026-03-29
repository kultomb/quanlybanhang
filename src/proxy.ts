import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { verifyFirebaseIdToken } from "@/lib/edge-firebase-jwt";

const SHOP_COOKIE = "ha_shop_slug";
const SESSION_COOKIE = "ha_session_token";

/** UID Firebase được coi là admin (CSV). Có thể bổ sung custom claim `admin: true` trên token. */
function adminUidSet() {
  const raw = process.env.ADMIN_UIDS || "";
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
}

function protectedRouteKind(pathname: string): "auth" | "admin" | null {
  const p = pathname.split("?")[0].toLowerCase();
  if (p === "/dashboard" || p.startsWith("/dashboard/")) return "auth";
  if (p === "/src" || p.startsWith("/src/")) return "auth";
  if (p === "/admin" || p.startsWith("/admin/")) return "admin";
  return null;
}

/** Giống normalizeShopSlug (server) — không import userShopSlug vì proxy Edge không được kéo admin SDK. */
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
  "dashboard",
  "admin",
  "src",
]);

/**
 * Chặn /abc, /src… khi đã có cookie shop: redirect ngay trên Edge (trước cache HTML/RSC),
 * không phụ thuộc bundle JS trong trình duyệt chính.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const kind = protectedRouteKind(pathname);
  if (kind) {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim() || "";
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token || !projectId) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.search = "";
      return NextResponse.redirect(url);
    }
    const payload = await verifyFirebaseIdToken(token, projectId);
    if (!payload?.sub) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.search = "";
      return NextResponse.redirect(url);
    }
    if (kind === "admin") {
      const admins = adminUidSet();
      if (payload.admin !== true && !admins.has(payload.sub)) {
        return new NextResponse(null, { status: 404 });
      }
    }
    const res = NextResponse.next();
    res.headers.set("Cache-Control", "private, no-store, max-age=0, must-revalidate");
    return res;
  }

  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) {
    return NextResponse.next();
  }

  const top = parts[0].toLowerCase();
  if (RESERVED_TOP.has(top)) {
    return NextResponse.next();
  }

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
