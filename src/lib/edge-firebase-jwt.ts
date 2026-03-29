import * as jose from "jose";

const JWKS = jose.createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"),
);

export type FirebaseIdPayload = {
  sub: string;
  email?: string;
  admin?: boolean;
};

/**
 * Xác minh ID token Firebase trên Edge (proxy) — không dùng firebase-admin.
 */
export async function verifyFirebaseIdToken(
  token: string,
  projectId: string,
): Promise<FirebaseIdPayload | null> {
  const trimmed = String(token || "").trim();
  if (!trimmed || !projectId) return null;
  try {
    const { payload } = await jose.jwtVerify(trimmed, JWKS, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    });
    const sub = String(payload.sub || "");
    if (!sub) return null;
    return {
      sub,
      email: typeof payload.email === "string" ? payload.email : undefined,
      admin: payload.admin === true,
    };
  } catch {
    return null;
  }
}
