import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/backend/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COOKIE_NAME = "ha_session_token";
const SHOP_COOKIE_NAME = "ha_shop_slug";

function normalizeShopSlug(value: string) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "");
}

async function resolveUserShopSlug(uid: string) {
  const direct = String((await adminDb().ref(`users/${uid}/shopSlug`).get()).val() || "").trim();
  if (direct) return normalizeShopSlug(direct);

  const shopsSnap = await adminDb().ref("shops").get();
  const shops = (shopsSnap.val() || {}) as Record<string, { ownerUid?: string; slug?: string }>;
  for (const [slug, value] of Object.entries(shops)) {
    if (String(value?.ownerUid || "").trim() === uid) {
      return normalizeShopSlug(String(value?.slug || slug));
    }
  }
  return "";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { idToken?: string; shopSlug?: string };
    const idToken = String(body?.idToken || "").trim();
    if (!idToken) {
      return new Response("Missing token", { status: 400 });
    }
    const decoded = await adminAuth().verifyIdToken(idToken).catch(() => null);
    if (!decoded?.uid) {
      return new Response("Invalid token", { status: 401 });
    }
    const profileShopSlug = await resolveUserShopSlug(decoded.uid);
    const requestShopSlug = normalizeShopSlug(String(body?.shopSlug || ""));
    const shopSlug = profileShopSlug || requestShopSlug;

    const jar = await cookies();
    jar.set(COOKIE_NAME, idToken, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    if (shopSlug) {
      jar.set(SHOP_COOKIE_NAME, shopSlug, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
    }
    return new Response("OK");
  } catch {
    return new Response("Invalid request", { status: 400 });
  }
}

export async function DELETE() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
  jar.delete(SHOP_COOKIE_NAME);
  return new Response("OK");
}
