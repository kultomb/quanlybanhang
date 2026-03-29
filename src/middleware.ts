import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { verifyFirebaseIdToken } from "@/lib/edge-firebase-jwt";

function adminUidSet(): Set<string> {
  return new Set(
    (process.env.ADMIN_UIDS || "")
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter(Boolean),
  );
}

export async function middleware(request: NextRequest) {
  const projectId = (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "").trim();
  const path = request.nextUrl.pathname;
  const token = request.cookies.get("ha_session_token")?.value?.trim() ?? "";

  if (!projectId) {
    if (path.startsWith("/api/admin")) {
      return NextResponse.json({ error: "server_misconfigured" }, { status: 500 });
    }
    return new NextResponse(null, { status: 503 });
  }

  if (!token) {
    if (path.startsWith("/api/admin")) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const login = new URL("/login", request.url);
    login.searchParams.set("next", path);
    return NextResponse.redirect(login);
  }

  const decoded = await verifyFirebaseIdToken(token, projectId);
  if (!decoded) {
    if (path.startsWith("/api/admin")) {
      return NextResponse.json({ error: "invalid_token" }, { status: 401 });
    }
    const login = new URL("/login", request.url);
    login.searchParams.set("next", path);
    return NextResponse.redirect(login);
  }

  const isAdmin = decoded.admin === true || adminUidSet().has(decoded.sub);
  if (!isAdmin) {
    if (path.startsWith("/api/admin")) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    /** Giữ URL /admin nhưng hiển thị trang 404 giao diện chung (không lộ cấu hình). */
    return NextResponse.rewrite(new URL("/admin-unauthorized", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/api/admin/:path*"],
};
