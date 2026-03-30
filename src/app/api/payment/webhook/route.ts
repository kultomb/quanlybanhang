import { migrateTrialShopToProduction } from "@/lib/backend/trialUpgrade";
import { normalizeShopSlug } from "@/lib/backend/userShopSlug";
import { adminDb } from "@/lib/backend/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type GenericWebhookPayload = {
  id?: string | number;
  referenceCode?: string;
  code?: string;
  txnId?: string | number;
  transferType?: string;
  transferAmount?: number | string;
  amount?: number | string;
  content?: string;
  description?: string;
  transferContent?: string;
};

function normalizeText(v: unknown) {
  return String(v || "")
    .trim()
    .toUpperCase();
}

function normalizeCompact(v: unknown) {
  return normalizeText(v).replace(/[^A-Z0-9]/g, "");
}

function toAmount(v: unknown) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function paymentAmountRequired() {
  return Number(process.env.NEXT_PUBLIC_PAYMENT_AMOUNT || 299000);
}

function parseAcceptedApiKeys() {
  const raw = String(process.env.PAYMENT_WEBHOOK_API_KEY || "").trim();
  if (!raw) return [];
  return raw
    .split(/[,\n]/)
    .map((v) => v.trim())
    .filter(Boolean);
}

function webhookSecretOk(request: Request) {
  const expectedApiKeys = parseAcceptedApiKeys();
  const expectedSecret = String(process.env.PAYMENT_WEBHOOK_SECRET || "").trim();
  const hasAuth = expectedApiKeys.length > 0 || !!expectedSecret;
  if (!hasAuth) {
    /** Production: never open. Local test: set PAYMENT_WEBHOOK_ALLOW_INSECURE_LOCAL=1 explicitly. */
    const allowInsecureLocal =
      process.env.NODE_ENV !== "production" &&
      String(process.env.PAYMENT_WEBHOOK_ALLOW_INSECURE_LOCAL || "").trim() === "1";
    return allowInsecureLocal;
  }

  const authHeader = String(request.headers.get("authorization") || "").trim();
  const apikeyPrefix = "apikey ";
  const gotApiKey = authHeader.toLowerCase().startsWith(apikeyPrefix)
    ? authHeader.slice(apikeyPrefix.length).trim()
    : "";

  const gotHeader = request.headers.get("x-webhook-secret") || "";
  const gotQuery = new URL(request.url).searchParams.get("secret") || "";

  if (gotApiKey && expectedApiKeys.includes(gotApiKey)) return true;
  if (expectedSecret && (gotHeader === expectedSecret || gotQuery === expectedSecret)) return true;
  return false;
}

type UserPayRow = { paymentRef?: string; shopSlug?: string };

function findPaymentMatch(
  users: Record<string, UserPayRow> | null,
  paymentCode: string,
  paymentCodeCompact: string,
  transferContent: string,
  transferContentCompact: string,
  amount: number,
  required: number,
): { uid: string; matchedRef: string } | null {
  if (!users) return null;
  let matchedUid = "";
  let matchedRef = "";
  Object.entries(users).some(([uid, value]) => {
    const payRef = normalizeText(value.paymentRef);
    const payRefCompact = normalizeCompact(payRef);
    if (!payRef) return false;
    const matchedByCode = paymentCode ? paymentCode === payRef : false;
    const matchedByCodeCompact = paymentCodeCompact
      ? paymentCodeCompact === payRefCompact
      : false;
    const matchedByContent = transferContent.includes(payRef);
    const matchedByContentCompact = payRefCompact
      ? transferContentCompact.includes(payRefCompact)
      : false;
    if (!matchedByCode && !matchedByCodeCompact && !matchedByContent && !matchedByContentCompact)
      return false;
    if (amount < required) return false;
    matchedUid = uid;
    matchedRef = payRef;
    return true;
  });
  return matchedUid ? { uid: matchedUid, matchedRef } : null;
}

export async function POST(request: Request) {
  try {
    if (!webhookSecretOk(request)) {
      return Response.json({ success: false, reason: "unauthorized" }, { status: 401 });
    }

    const payload = (await request.json().catch(() => ({}))) as GenericWebhookPayload;
    const transferType = normalizeText(payload.transferType);
    if (transferType && transferType !== "IN") {
      return Response.json({ success: true, ignored: true, reason: "not_incoming_transfer" });
    }

    const transferContent = normalizeText(
      payload.transferContent || payload.content || payload.description,
    );
    const transferContentCompact = normalizeCompact(transferContent);
    const paymentCode = normalizeText(payload.code);
    const paymentCodeCompact = normalizeCompact(paymentCode);
    const amount = toAmount(payload.transferAmount ?? payload.amount);
    const txnId = normalizeText(
      payload.id || payload.txnId || payload.referenceCode || payload.code || `NOID-${Date.now()}`,
    );

    if (!transferContent || !amount) {
      return Response.json({ success: false, reason: "missing_fields" }, { status: 400 });
    }

    const db = adminDb();
    const ingestRef = db.ref(`paymentWebhookIngest/${txnId}`);
    const legacyEventRef = db.ref(`paymentEvents/${txnId}`);
    const [ingestSnap, legacySnap] = await Promise.all([ingestRef.get(), legacyEventRef.get()]);
    if (ingestSnap.exists() || legacySnap.exists()) {
      return Response.json({ success: true, duplicated: true });
    }

    const required = paymentAmountRequired();

    const pendingSnap = await db.ref("users").orderByChild("paymentStatus").equalTo("pending").get();
    const upgradeSnap = await db
      .ref("users")
      .orderByChild("paymentStatus")
      .equalTo("pending_upgrade")
      .get();

    let match = findPaymentMatch(
      pendingSnap.exists() ? (pendingSnap.val() as Record<string, UserPayRow>) : null,
      paymentCode,
      paymentCodeCompact,
      transferContent,
      transferContentCompact,
      amount,
      required,
    );
    let isUpgrade = false;
    if (!match) {
      match = findPaymentMatch(
        upgradeSnap.exists() ? (upgradeSnap.val() as Record<string, UserPayRow>) : null,
        paymentCode,
        paymentCodeCompact,
        transferContent,
        transferContentCompact,
        amount,
        required,
      );
      isUpgrade = !!match;
    }

    if (!match) {
      const statusNote =
        !pendingSnap.exists() && !upgradeSnap.exists() ? "no_pending_user" : "unmatched";
      // Không ghi paymentEvents cho giao dịch không khớp thanh toán thật (dùng thử không tính tiền; tránh nhiễu audit).
      await ingestRef.set({
        receivedAt: Date.now(),
        outcome: "unmatched",
        amount,
        paymentCode,
        transferContent,
        status: statusNote,
      });
      return Response.json({ success: true, matched: false });
    }

    const { uid: matchedUid, matchedRef } = match;
    const userRef = db.ref(`users/${matchedUid}`);

    if (isUpgrade) {
      const fullSnap = await userRef.get();
      const profile = (fullSnap.val() || {}) as {
        shopSlug?: string;
        upgradeTargetSlug?: string;
        email?: string;
        paymentStatus?: string;
      };
      const upgradeTo = normalizeShopSlug(String(profile.upgradeTargetSlug || ""));
      const fromSlug = normalizeShopSlug(String(profile.shopSlug || ""));
      if (
        profile.paymentStatus === "pending_upgrade" &&
        upgradeTo &&
        fromSlug &&
        upgradeTo !== fromSlug
      ) {
        await migrateTrialShopToProduction(db, {
          uid: matchedUid,
          fromSlug,
          toSlug: upgradeTo,
          ownerEmail: String(profile.email || ""),
        });
        await userRef.update({
          shopSlug: upgradeTo,
          registrationTrial: false,
          paymentStatus: "active",
          paymentPaidAt: Date.now(),
          paymentTxnId: txnId,
          paymentAmount: amount,
        });
        await userRef.child("upgradeTargetSlug").remove();
        await userRef.child("upgradeFromSlug").remove();
        await userRef.child("trialExpiresAt").remove();
      } else {
        await userRef.update({
          paymentStatus: "active",
          paymentPaidAt: Date.now(),
          paymentTxnId: txnId,
          paymentAmount: amount,
        });
      }
    } else {
      await userRef.update({
        paymentStatus: "active",
        paymentPaidAt: Date.now(),
        paymentTxnId: txnId,
        paymentAmount: amount,
      });
    }
    await legacyEventRef.set({
      receivedAt: Date.now(),
      uid: matchedUid,
      paymentRef: matchedRef,
      upgrade: isUpgrade,
      amount,
      paymentCode,
      transferContent,
      status: "matched",
    });
    await ingestRef.set({
      receivedAt: Date.now(),
      outcome: "matched",
      uid: matchedUid,
      paymentRef: matchedRef,
      upgrade: isUpgrade,
      amount,
      status: "matched",
    });

    return Response.json({ success: true, matched: true, uid: matchedUid });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[payment/webhook]", message);
    const body =
      process.env.NODE_ENV === "production"
        ? { success: false, reason: "server_error" }
        : { success: false, reason: "server_error", message };
    return Response.json(body, { status: 500 });
  }
}
