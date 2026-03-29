"use client";

import { doc, getDoc } from "firebase/firestore";
import { get, ref } from "firebase/database";

import { db, rtdb } from "@/lib/backend/client";

export type UserProfileClient = {
  shopSlug: string;
  paymentStatus: string;
  registrationTrial: boolean | null;
};

const FIRESTORE_PROFILE_CAP_MS = 5000;
const RTDB_PROFILE_CAP_MS = 12000;

function raceCap<T>(p: Promise<T>, ms: number, onTimeout: T): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((resolve) => {
      window.setTimeout(() => resolve(onTimeout), ms);
    }),
  ]);
}

async function fetchShopSlugFromFirestore(uid: string): Promise<string> {
  try {
    const usnap = await getDoc(doc(db, "users", uid));
    if (!usnap.exists()) return "";
    const d = usnap.data();
    let shopSlug = String(d.shopSlug || "").trim();
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
    return shopSlug;
  } catch {
    return "";
  }
}

/**
 * Shop mapping từ Firestore (có giới hạn thời gian); payment / trial từ RTDB.
 * Firestore + RTDB chạy song song để giảm độ trễ đăng nhập.
 */
export async function fetchUserProfileClient(uid: string): Promise<UserProfileClient> {
  const rtdbP = raceCap(
    get(ref(rtdb, `users/${uid}`))
      .then((snap) => (snap.val() || {}) as Record<string, unknown>)
      .catch(() => ({} as Record<string, unknown>)),
    RTDB_PROFILE_CAP_MS,
    {} as Record<string, unknown>,
  );

  const shopFromFsP = raceCap(fetchShopSlugFromFirestore(uid), FIRESTORE_PROFILE_CAP_MS, "");

  const [v, shopFromFs] = await Promise.all([rtdbP, shopFromFsP]);

  const shopSlug = String(shopFromFs || "").trim() || String(v.shopSlug || "").trim();

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
