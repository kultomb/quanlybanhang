import { requireAdminFromRequest } from "@/lib/backend/admin-api-auth";
import { adminAuth } from "@/lib/backend/server";
import { validateSignupPassword } from "@/lib/password-policy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request, ctx: { params: Promise<{ uid: string }> }) {
  const gate = await requireAdminFromRequest(request);
  if (!gate.ok) return gate.response;

  const { uid: targetUid } = await ctx.params;
  const uid = String(targetUid || "").trim();
  if (!uid) {
    return new Response(JSON.stringify({ error: "invalid_uid" }), {
      status: 400,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }

  let body: { password?: string };
  try {
    body = (await request.json()) as { password?: string };
  } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), {
      status: 400,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }

  const password = String(body?.password || "");
  const userRecord = await adminAuth().getUser(uid).catch(() => null);
  const email = userRecord?.email ?? undefined;
  const check = validateSignupPassword(password, email);
  if (!check.ok) {
    return new Response(JSON.stringify({ error: "weak_password", message: check.message }), {
      status: 400,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }

  try {
    await adminAuth().updateUser(uid, { password });
  } catch (e) {
    console.error("[admin/password]", e);
    return new Response(JSON.stringify({ error: "update_failed", message: "Không cập nhật được mật khẩu." }), {
      status: 500,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
