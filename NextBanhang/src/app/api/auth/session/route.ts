import { cookies } from "next/headers";

const COOKIE_NAME = "ha_session_token";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { idToken?: string };
    const idToken = String(body?.idToken || "").trim();
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
    return new Response("OK");
  } catch {
    return new Response("Invalid request", { status: 400 });
  }
}

export async function DELETE() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
  return new Response("OK");
}
