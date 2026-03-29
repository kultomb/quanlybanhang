import { adminAuth } from "@/lib/backend/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Thu hồi mọi refresh token của user (mọi thiết bị). Gọi sau đổi/đặt lại mật khẩu khi client còn idToken hợp lệ.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { idToken?: string };
    const idToken = String(body?.idToken || "").trim();
    if (!idToken) {
      return Response.json({ error: "missing_token" }, { status: 400 });
    }
    const decoded = await adminAuth().verifyIdToken(idToken).catch(() => null);
    if (!decoded?.uid) {
      return Response.json({ error: "invalid_token" }, { status: 401 });
    }
    await adminAuth().revokeRefreshTokens(decoded.uid);
    return Response.json({ ok: true });
  } catch (e) {
    console.error("[revoke-sessions]", e);
    return Response.json({ error: "server_error" }, { status: 500 });
  }
}
