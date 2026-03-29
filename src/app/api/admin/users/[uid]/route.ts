import { deleteUserAccountAndRelatedData, AdminDeleteUserError } from "@/lib/backend/admin-delete-user";
import { requireAdminFromRequest } from "@/lib/backend/admin-api-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(_request: Request, ctx: { params: Promise<{ uid: string }> }) {
  const gate = await requireAdminFromRequest(_request);
  if (!gate.ok) return gate.response;

  const { uid: raw } = await ctx.params;
  const targetUid = String(raw || "").trim();
  if (!targetUid) {
    return new Response(JSON.stringify({ error: "invalid_uid" }), {
      status: 400,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }

  try {
    await deleteUserAccountAndRelatedData(targetUid, gate.uid);
  } catch (e) {
    if (e instanceof AdminDeleteUserError) {
      const status = e.code === "self_delete_forbidden" ? 400 : 500;
      return new Response(JSON.stringify({ error: e.code, message: e.message }), {
        status,
        headers: { "content-type": "application/json; charset=utf-8" },
      });
    }
    console.error("[admin/users DELETE]", e);
    return new Response(JSON.stringify({ error: "delete_failed", message: "Lỗi không xác định khi xóa." }), {
      status: 500,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
