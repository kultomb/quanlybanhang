"use client";

import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { get, ref } from "firebase/database";
import { useEffect } from "react";
import { auth, rtdb } from "@/lib/firebase";

export default function AppPage() {
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }
      const snap = await get(ref(rtdb, `users/${user.uid}/shopSlug`));
      const shopSlug = String(snap.val() || "").trim();
      if (shopSlug) {
        router.replace(`/${shopSlug}`);
        return;
      }
      router.replace("/account");
    });
    return () => unsub();
  }, [router]);

  return null;
}
