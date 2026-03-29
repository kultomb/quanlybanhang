"use client";

import { doc, getDoc } from "firebase/firestore";
import { get, ref } from "firebase/database";

import { db, rtdb } from "@/lib/backend/client";

export type UserProfileClient = {
  shopSlug: string;
  paymentStatus: string;
  registrationTrial: boolean | null;
};

/**
 * Shop mapping từ Firestore; payment / trial vẫn từ RTDB users/{uid} (nguồn hiện có).
 */
export async function fetchUserProfileClient(uid: string): Promise<UserProfileClient> {
  let shopSlug = "";

  try {
    const usnap = await getDoc(doc(db, "users", uid));
    if (usnap.exists()) {
      const d = usnap.data();
      shopSlug = String(d.shopSlug || "").trim();
      const shopId = String(d.shopId || "").trim();
      if (!shopSlug && shopId) {
        const ssnap = await getDoc(doc(db, "shops", shopId));
        if (ssnap.exists()) {
          const sd = ssnap.data();
          if (String(sd.ownerId || "") === uid) {
            shopSlug = String(sd.slug || "").trim();
          }
        }
      }
    }
  } catch {
    // Firestore tắt hoặc rules — fallback RTDB.
  }

  const snap = await get(ref(rtdb, `users/${uid}`));
  const v = (snap.val() || {}) as Record<string, unknown>;

  if (!shopSlug) {
    shopSlug = String(v.shopSlug || "").trim();
  }

  const rt = v.registrationTrial;
  const registrationTrial =
    rt === true || rt === "true" ? true : rt === false || rt === "false" ? false : null;

  const ps = String(v.paymentStatus || "").trim();
  return {
    shopSlug,
    paymentStatus: ps,
    registrationTrial,
  };
}
