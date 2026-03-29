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
    // Dev convenience only — production must set PAYMENT_WEBHOOK_API_KEY and/or PAYMENT_WEBHOOK_SECRET
    return process.env.NODE_ENV !== "production";
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
    const eventRef = db.ref(`paymentEvents/${txnId}`);
    const already = await eventRef.get();
    if (already.exists()) {
      return Response.json({ success: true, duplicated: true });
    }

    const pendingSnap = await db
      .ref("users")
      .orderByChild("paymentStatus")
      .equalTo("pending")
      .get();

    if (!pendingSnap.exists()) {
      await eventRef.set({
        receivedAt: Date.now(),
        amount,
        paymentCode,
        transferContent,
        status: "no_pending_user",
      });
      return Response.json({ success: true, matched: false });
    }

    const required = paymentAmountRequired();
    const users = pendingSnap.val() as Record<string, { paymentRef?: string; shopSlug?: string }>;
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

    if (!matchedUid) {
      await eventRef.set({
        receivedAt: Date.now(),
        amount,
        paymentCode,
        transferContent,
        status: "unmatched",
      });
      return Response.json({ success: true, matched: false });
    }

    const userRef = db.ref(`users/${matchedUid}`);
    await userRef.update({
      paymentStatus: "active",
      paymentPaidAt: Date.now(),
      paymentTxnId: txnId,
      paymentAmount: amount,
    });
    await eventRef.set({
      receivedAt: Date.now(),
      uid: matchedUid,
      paymentRef: matchedRef,
      amount,
      paymentCode,
      transferContent,
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
