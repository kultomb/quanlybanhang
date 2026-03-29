import { requireAdminFromRequest } from "@/lib/backend/admin-api-auth";
import { adminDb } from "@/lib/backend/server";
import { PRESENCE_ONLINE_MS } from "@/lib/presence-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_UIDS = 500;

/**
 * Chỉ đọc RTDB `users/{uid}/lastSeen` — để admin làm mới online/offline theo thời gian thực
 * mà không tải lại toàn bộ danh sách.
 */
export async function GET(request: Request) {
  const gate = await requireAdminFromRequest(request);
  if (!gate.ok) return gate.response;

  const raw = new URL(request.url).searchParams.get("uids") || "";
  const uids = raw
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, MAX_UIDS);

  if (uids.length === 0) {
    return new Response(JSON.stringify({ presence: {} }), {
      status: 200,
      headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
    });
  }

  try {
    const db = adminDb();
    const now = Date.now();
    const presence: Record<string, { lastSeen: number | null; online: boolean }> = {};

    await Promise.all(
      uids.map(async (uid) => {
        const lastSnap = await db.ref(`users/${uid}/lastSeen`).get();
        const v = lastSnap.val();
        const lastSeen = typeof v === "number" && Number.isFinite(v) ? v : null;
        presence[uid] = {
          lastSeen,
          online: lastSeen != null && now - lastSeen <= PRESENCE_ONLINE_MS,
        };
      }),
    );

    return new Response(JSON.stringify({ presence }), {
      status: 200,
      headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
    });
  } catch (e) {
    console.error("[admin/users/presence]", e);
    return new Response(JSON.stringify({ error: "presence_failed" }), {
      status: 500,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }
}
