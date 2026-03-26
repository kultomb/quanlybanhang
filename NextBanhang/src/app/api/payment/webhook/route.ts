import { adminDb } from "@/lib/firebase-admin";

type GenericWebhookPayload = {
  id?: string | number;
  code?: string;
  txnId?: string | number;
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

function toAmount(v: unknown) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function paymentAmountRequired() {
  return Number(process.env.NEXT_PUBLIC_PAYMENT_AMOUNT || 299000);
}

function webhookSecretOk(request: Request) {
  const expected = String(process.env.PAYMENT_WEBHOOK_SECRET || "").trim();
  if (!expected) return true;
  const gotHeader = request.headers.get("x-webhook-secret") || "";
  const gotQuery = new URL(request.url).searchParams.get("secret") || "";
  return gotHeader === expected || gotQuery === expected;
}

export async function POST(request: Request) {
  if (!webhookSecretOk(request)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const payload = (await request.json().catch(() => ({}))) as GenericWebhookPayload;
  const transferContent = normalizeText(
    payload.transferContent || payload.content || payload.description,
  );
  const amount = toAmount(payload.transferAmount ?? payload.amount);
  const txnId = normalizeText(payload.id || payload.txnId || payload.code || `NOID-${Date.now()}`);

  if (!transferContent || !amount) {
    return Response.json({ ok: false, reason: "missing_fields" }, { status: 400 });
  }

  const db = adminDb();
  const eventRef = db.ref(`paymentEvents/${txnId}`);
  const already = await eventRef.get();
  if (already.exists()) {
    return Response.json({ ok: true, duplicated: true });
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
      transferContent,
      status: "no_pending_user",
    });
    return Response.json({ ok: true, matched: false });
  }

  const required = paymentAmountRequired();
  const users = pendingSnap.val() as Record<string, { paymentRef?: string; shopSlug?: string }>;
  let matchedUid = "";
  let matchedRef = "";

  Object.entries(users).some(([uid, value]) => {
    const payRef = normalizeText(value.paymentRef);
    if (!payRef) return false;
    if (!transferContent.includes(payRef)) return false;
    if (amount < required) return false;
    matchedUid = uid;
    matchedRef = payRef;
    return true;
  });

  if (!matchedUid) {
    await eventRef.set({
      receivedAt: Date.now(),
      amount,
      transferContent,
      status: "unmatched",
    });
    return Response.json({ ok: true, matched: false });
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
    transferContent,
    status: "matched",
  });

  return Response.json({ ok: true, matched: true, uid: matchedUid });
}
