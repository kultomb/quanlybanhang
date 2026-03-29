import { adminAuth, adminDb } from "@/lib/backend/server";
import { getShopPaths } from "@/lib/backend/shop-paths";
import { applyTrialPrefixToSlug, getTrialShopPrefix } from "@/lib/trial-shop";
import admin from "firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TRIAL_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      idToken?: string;
      email?: string;
      shopSlugInput?: string;
      isTrial?: boolean;
    };
    const idToken = String(body?.idToken || "").trim();
    const emailTrimmed = String(body?.email || "").trim();
    const rawShop = String(body?.shopSlugInput ?? "").trim();
    const isTrial = body?.isTrial === true;

    if (!idToken) {
      return Response.json({ error: "missing_token" }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      return Response.json({ error: "invalid_email" }, { status: 400 });
    }

    const decoded = await adminAuth().verifyIdToken(idToken).catch(() => null);
    if (!decoded?.uid) {
      return Response.json({ error: "invalid_token" }, { status: 401 });
    }
    const uid = decoded.uid;

    const slug = applyTrialPrefixToSlug(rawShop, isTrial);
    const trialPrefix = getTrialShopPrefix();

    if (!/^[a-z0-9-]{3,30}$/.test(slug)) {
      return Response.json({ error: "invalid_shop" }, { status: 400 });
    }

    if (isTrial) {
      if (!slug.startsWith(`${trialPrefix}-`)) {
        return Response.json({ error: "invalid_shop" }, { status: 400 });
      }
      const suffix = slug.startsWith(`${trialPrefix}-`) ? slug.slice(trialPrefix.length + 1) : "";
      const core = suffix.replace(/[^a-z0-9]/gi, "");
      if (core.length < 2) {
        return Response.json({ error: "shop_name_short" }, { status: 400 });
      }
    }

    const shopPath = getShopPaths(slug, isTrial).shop;
    const db = adminDb();
    const shopSnap = await db.ref(shopPath).get();
    if (shopSnap.exists()) {
      return Response.json({ error: "shop_exists" }, { status: 409 });
    }

    const paymentRef = isTrial
      ? `DEMO-${slug.toUpperCase()}-${Date.now().toString().slice(-6)}`
      : `PAY-${slug.toUpperCase()}-${Date.now().toString().slice(-6)}`;

    const trialExpiresAt = Date.now() + TRIAL_DURATION_MS;

    const userPayload: Record<string, unknown> = {
      uid,
      email: emailTrimmed,
      shopSlug: slug,
      paymentStatus: isTrial ? "active" : "pending",
      paymentRef,
      createdAt: admin.database.ServerValue.TIMESTAMP,
    };
    if (isTrial) {
      userPayload.registrationTrial = true;
      userPayload.trialExpiresAt = trialExpiresAt;
    }

    const shopPayload: Record<string, unknown> = {
      slug,
      ownerUid: uid,
      ownerEmail: emailTrimmed,
      createdAt: admin.database.ServerValue.TIMESTAMP,
    };
    if (isTrial) {
      const createdMs = Date.now();
      shopPayload.trial = true;
      shopPayload.trialShop = true;
      shopPayload.createdAt = createdMs;
      shopPayload.expiresAt = trialExpiresAt;
    }

    await db.ref(`users/${uid}`).set(userPayload);
    await db.ref(shopPath).set(shopPayload);

    return Response.json({ ok: true, shopSlug: slug });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[register-bootstrap]", msg);
    return Response.json(
      { error: "server_error", message: process.env.NODE_ENV !== "production" ? msg : undefined },
      { status: 500 },
    );
  }
}
