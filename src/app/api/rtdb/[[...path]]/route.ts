import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/backend/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COOKIE_NAME = "ha_session_token";

function normalizePathSegments(pathValue: string) {
  return pathValue
    .replace(/^\/+/, "")
    .split("/")
    .filter(Boolean)
    .map((s) => s.replace(/\.json$/i, ""));
}

function toShallowObject(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  return Object.keys(value as Record<string, unknown>).reduce<Record<string, boolean>>((acc, key) => {
    acc[key] = true;
    return acc;
  }, {});
}

async function resolveUserShopSlug(uid: string) {
  const direct = String((await adminDb().ref(`users/${uid}/shopSlug`).get()).val() || "").trim();
  if (direct) return direct;

  // Fallback for legacy records where users/{uid}/shopSlug was not written correctly.
  const shopsSnap = await adminDb().ref("shops").get();
  const shops = (shopsSnap.val() || {}) as Record<string, { ownerUid?: string; slug?: string }>;
  for (const [slug, value] of Object.entries(shops)) {
    if (String(value?.ownerUid || "").trim() === uid) {
      return String(value?.slug || slug).trim();
    }
  }
  return "";
}

async function proxy(
  request: Request,
  context: { params: Promise<{ path?: string[] }> },
) {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value || "";
  if (!token) return new Response("Unauthorized", { status: 401 });

  const decoded = await adminAuth()
    .verifyIdToken(token)
    .catch(() => null);
  if (!decoded?.uid) return new Response("Unauthorized", { status: 401 });

  const { path } = await context.params;
  const fullPath = (path || []).join("/");
  if (!fullPath.startsWith("backups/")) {
    return new Response("Forbidden path", { status: 403 });
  }

  const segments = normalizePathSegments(fullPath);
  // Expected: backups/{shopKey}/...
  if (segments.length < 2 || segments[0] !== "backups") {
    return new Response("Forbidden path", { status: 403 });
  }
  const requestedShopKey = segments[1];
  const userShopSlug = await resolveUserShopSlug(decoded.uid);
  const allowedShopKey = userShopSlug ? `shop_${userShopSlug}` : "";
  if (!allowedShopKey) {
    return new Response("Forbidden path", { status: 403 });
  }

  // Force per-user storage namespace even if old client sends stale keys like "12345".
  segments[1] = allowedShopKey;
  const targetPath = segments.join("/");
  const dbRef = adminDb().ref(targetPath);
  const method = request.method.toUpperCase();
  if (method === "GET") {
    const snap = await dbRef.get();
    const reqUrl = new URL(request.url);
    const shallow = reqUrl.searchParams.get("shallow") === "true";
    const value = shallow ? toShallowObject(snap.val()) : snap.val();
    return new Response(JSON.stringify(value ?? null), {
      status: 200,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
      },
    });
  }

  if (method === "PUT") {
    const raw = await request.text();
    const value = raw ? JSON.parse(raw) : null;
    await dbRef.set(value);
    return new Response(JSON.stringify(value ?? null), {
      status: 200,
      headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
    });
  }

  if (method === "DELETE") {
    await dbRef.remove();
    return new Response("null", {
      status: 200,
      headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
    });
  }

  return new Response("Method Not Allowed", { status: 405 });
}

export async function GET(
  request: Request,
  context: { params: Promise<{ path?: string[] }> },
) {
  return proxy(request, context);
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ path?: string[] }> },
) {
  return proxy(request, context);
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ path?: string[] }> },
) {
  return proxy(request, context);
}
