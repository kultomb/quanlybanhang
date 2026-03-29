import "server-only";

export async function verifyTurnstileToken(token: string, secret: string): Promise<boolean> {
  const t = String(token || "").trim();
  const s = String(secret || "").trim();
  if (!s || !t) return false;
  try {
    const body = new URLSearchParams();
    body.set("secret", s);
    body.set("response", t);
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}
