import { requireAdminFromRequest } from "@/lib/backend/admin-api-auth";
import { adminAuth, adminDb } from "@/lib/backend/server";
import { resolveUserShopContext } from "@/lib/backend/userShopSlug";
import { PRESENCE_ONLINE_MS } from "@/lib/presence-config";
import { isEffectiveTrialAccount } from "@/lib/trial-shop";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const gate = await requireAdminFromRequest(request);
  if (!gate.ok) return gate.response;

  const url = new URL(request.url);
  const maxResults = Math.min(1000, Math.max(1, Number(url.searchParams.get("limit")) || 100));
  const pageToken = url.searchParams.get("pageToken") || undefined;

  try {
    const list = await adminAuth().listUsers(maxResults, pageToken);
    const db = adminDb();

    const users = await Promise.all(
      list.users.map(async (u) => {
        const ctx = await resolveUserShopContext(u.uid);
        const slug = ctx.shopSlug || "";
        const isTrial = isEffectiveTrialAccount(ctx.registrationTrial, slug);
        const paySnap = await db.ref(`users/${u.uid}/paymentStatus`).get();
        const paymentStatus = String(paySnap.val() || "").trim();
        const accountType = isTrial ? "trial" : paymentStatus === "active" ? "production" : "pending_payment";
        const lastSnap = await db.ref(`users/${u.uid}/lastSeen`).get();
        const raw = lastSnap.val();
        const lastSeen = typeof raw === "number" && Number.isFinite(raw) ? raw : null;
        const now = Date.now();
        const online = lastSeen != null && now - lastSeen <= PRESENCE_ONLINE_MS;

        return {
          uid: u.uid,
          email: u.email ?? null,
          emailVerified: u.emailVerified,
          disabled: u.disabled,
          accountType,
          paymentStatus: paymentStatus || null,
          shopName: ctx.shopDisplayName || null,
          shopSlug: slug || null,
          registrationTrial: ctx.registrationTrial,
          trialExpiresAt: ctx.trialExpiresAt,
          lastSeen,
          online,
          lastSignInTime: u.metadata.lastSignInTime || null,
          creationTime: u.metadata.creationTime || null,
        };
      }),
    );

    return new Response(
      JSON.stringify({
        users,
        pageToken: list.pageToken || null,
        viewerUid: gate.uid,
      }),
      {
        status: 200,
        headers: {
          "content-type": "application/json; charset=utf-8",
          "cache-control": "no-store",
        },
      },
    );
  } catch (e) {
    console.error("[admin/users]", e);
    return new Response(JSON.stringify({ error: "list_failed", message: "Không đọc được danh sách tài khoản." }), {
      status: 500,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }
}
