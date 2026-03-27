"use client";

import { signOut } from "firebase/auth";
import { auth } from "@/lib/backend/client";

export async function logoutAndCleanupClientSession() {
  try {
    await signOut(auth);
  } catch {
    // Ignore sign-out failures and continue cleanup.
  }

  await fetch("/api/auth/session", { method: "DELETE" }).catch(() => undefined);

  if (typeof window !== "undefined") {
    try {
      // Explicitly clear browser state so deleted accounts never keep stale local data.
      window.localStorage.clear();
      window.sessionStorage.clear();
    } catch {
      // Ignore storage cleanup failures in restricted environments.
    }
  }
}
