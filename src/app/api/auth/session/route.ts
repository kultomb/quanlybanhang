import { cookies } from "next/headers";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COOKIE_NAME = "ha_session_token";
const SHOP_COOKIE_NAME = "ha_shop_slug";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { idToken?: string; shopSlug?: string };
    const idToken = String(body?.idToken || "").trim();
    const shopSlug = String(body?.shopSlug || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "");
    if (!idToken) {
      return new Response("Missing token", { status: 400 });
    }

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
