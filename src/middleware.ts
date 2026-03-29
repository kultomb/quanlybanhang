import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Chuẩn hóa host (www ↔ apex) theo NEXT_PUBLIC_APP_URL.
 *
 * QUAN TRỌNG: không redirect `/api/*` — nếu không, fetch `/api/rtdb/.../data.json` bị 308 sang host khác,
 * trình duyệt có thể không gửi lại Authorization/cookie → lỗi tải dữ liệu (app.json 200, data.json redirect + 0 B).
 */
function canonicalHostname(): string | null {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim() || "";
  if (!raw || /localhost|127\.0\.0\.1/i.test(raw)) return null;
  try {
    return new URL(raw).hostname.toLowerCase();
  } catch {
    return null;
  }
}

/** Trả về hostname chuẩn nếu request đang ở alias (www vs apex), ngược lại null. */
function hostAliasRedirectTarget(currentHost: string, want: string): string | null {
  const cur = currentHost.toLowerCase().split(":")[0] || "";
  const w = want.toLowerCase();
  if (!cur || cur === w) return null;
  const wParts = w.split(".");
  if (wParts[0] === "www" && wParts.length >= 3) {
    const apex = wParts.slice(1).join(".");
    if (cur === apex) return w;
    return null;
  }
  if (cur === `www.${w}`) return w;
  return null;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/api/") || pathname.startsWith("/_next/")) {
    return NextResponse.next();
  }

  const want = canonicalHostname();
  if (!want) return NextResponse.next();

  const rawHost = request.headers.get("host") || "";
  const current = rawHost.split(":")[0] || "";
  const target = hostAliasRedirectTarget(current, want);
  if (!target) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.hostname = target;
  return NextResponse.redirect(url, 308);
}

export const config = {
  matcher: ["/((?!api/|_next/static|_next/image|favicon.ico).*)", "/"],
};
