"use client";

import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect } from "react";
import { auth } from "@/lib/backend/client";
import { fetchUserProfileClient } from "@/lib/user-profile-client";

export default function AppPage() {
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }
      const profile = await fetchUserProfileClient(user.uid);
      const shopSlug = String(profile.shopSlug || "").trim();
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
