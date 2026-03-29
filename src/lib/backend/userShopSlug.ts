import { adminDb } from "@/lib/backend/server";

export function normalizeShopSlug(value: string) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "");
}

/**
 * Đọc shopSlug cho uid. Nếu users/{uid}/shopSlug trống nhưng shops có ownerUid khớp,
 * ghi lại users/{uid}/shopSlug để lần sau không bị 403 / mapping lệch.
 */
export async function resolveUserShopSlugWithHeal(uid: string): Promise<string> {
  const userRef = adminDb().ref(`users/${uid}/shopSlug`);
  const rawDirect = String((await userRef.get()).val() || "").trim();
  const direct = normalizeShopSlug(rawDirect);
  if (direct) return direct;

  const shopsSnap = await adminDb().ref("shops").get();
  const shops = (shopsSnap.val() || {}) as Record<string, { ownerUid?: string; slug?: string }>;
  for (const [slug, value] of Object.entries(shops)) {
    if (String(value?.ownerUid || "").trim() === uid) {
      const found = normalizeShopSlug(String(value?.slug || slug));
      if (found) {
        await userRef.set(found).catch(() => {});
      }
      return found;
    }
  }
  return "";
}
