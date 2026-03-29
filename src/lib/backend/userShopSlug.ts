import { adminDb } from "@/lib/backend/server";
import { getShopTableRoot } from "@/lib/backend/shop-paths";

export function normalizeShopSlug(value: string) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "");
}

export type UserShopContext = {
  shopSlug: string;
  /** true/false nếu đã set; null = bản ghi cũ chưa có field */
  registrationTrial: boolean | null;
  trialExpiresAt: number | null;
};

/**
 * Đọc users/{uid} + shopSlug (heal từ shops/ hoặc trialShops/ nếu thiếu).
 */
export async function resolveUserShopContext(uid: string): Promise<UserShopContext> {
  const snap = await adminDb().ref(`users/${uid}`).get();
  const v = (snap.val() || {}) as Record<string, unknown>;
  let slug = normalizeShopSlug(String(v.shopSlug || ""));

  const rt = v.registrationTrial;
  let registrationTrial: boolean | null = null;
  if (rt === true || rt === "true") registrationTrial = true;
  else if (rt === false || rt === "false") registrationTrial = false;

  const te = v.trialExpiresAt;
  const n = typeof te === "number" ? te : Number(te);
  const trialExpiresAt = Number.isFinite(n) && n > 0 ? n : null;

  async function healSlugFromTable(isTrial: boolean) {
    const table = getShopTableRoot(isTrial);
    const tableSnap = await adminDb().ref(table).get();
    const rows = (tableSnap.val() || {}) as Record<string, { ownerUid?: string; slug?: string }>;
    for (const [key, value] of Object.entries(rows)) {
      if (String(value?.ownerUid || "").trim() === uid) {
        const found = normalizeShopSlug(String(value?.slug || key));
        if (found) {
          await adminDb().ref(`users/${uid}/shopSlug`).set(found).catch(() => {});
        }
        return found;
      }
    }
    return "";
  }

  if (!slug) {
    slug = await healSlugFromTable(false);
    if (!slug) slug = await healSlugFromTable(true);
  }

  return { shopSlug: slug, registrationTrial, trialExpiresAt };
}

export async function resolveUserShopSlugWithHeal(uid: string): Promise<string> {
  const ctx = await resolveUserShopContext(uid);
  return ctx.shopSlug;
}
