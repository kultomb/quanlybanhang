import { cookies } from "next/headers";

import { idTokenFromApiRequest } from "@/lib/backend/admin-api-auth";
import { adminAuth, adminDb } from "@/lib/backend/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COOKIE_NAME = "ha_session_token";

/** Cập nhật RTDB `users/{uid}/lastSeen` — dùng dashboard admin (online xanh/đỏ). */
export async function POST(request: Request) {
  try {
    const jar = await cookies();
    const token = idTokenFromApiRequest(request, jar.get(COOKIE_NAME)?.value ?? "");
    if (!token) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { "content-type": "application/json; charset=utf-8" },
      });
    }
    const decoded = await adminAuth().verifyIdToken(token).catch(() => null);
    if (!decoded?.uid) {
      return new Response(JSON.stringify({ error: "invalid_token" }), {
        status: 401,
        headers: { "content-type": "application/json; charset=utf-8" },
      });
    }
    const now = Date.now();
    await adminDb().ref(`users/${decoded.uid}/lastSeen`).set(now);
    return new Response(JSON.stringify({ ok: true, lastSeen: now }), {
      status: 200,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  } catch {
    return new Response(JSON.stringify({ error: "bad_request" }), {
      status: 400,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }
}
