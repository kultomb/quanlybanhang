"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { auth } from "@/lib/backend/client";
import AccountBar from "@/components/AccountBar";
import TrialModeBanner from "@/components/TrialModeBanner";

declare global {
  interface Window {
    __hanghoGetIdToken?: () => Promise<string | null>;
  }
}

const PM_GET = "HANGHO_GET_ID_TOKEN";
const PM_TOKEN = "HANGHO_ID_TOKEN";

async function readHanghoIdToken(): Promise<string | null> {
  const u = auth.currentUser;
  if (!u) return null;
  try {
    return await u.getIdToken();
  } catch {
    return null;
  }
}

type ShopLegacyFrameProps = {
  shop: string;
};

export default function ShopLegacyFrame({ shop }: ShopLegacyFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [accountMount, setAccountMount] = useState<HTMLElement | null>(null);
  const src = useMemo(() => `/legacy/index.html?shop=${encodeURIComponent(shop)}`, [shop]);

  useEffect(() => {
    setAccountMount(null);
  }, [shop]);

  useLayoutEffect(() => {
    window.__hanghoGetIdToken = () => readHanghoIdToken();

    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      const child = iframeRef.current?.contentWindow;
      if (!child || e.source !== child) return;
      const d = e.data;
      if (!d || d.type !== PM_GET || typeof d.requestId !== "string") return;
      void (async () => {
        const token = await readHanghoIdToken();
        (e.source as Window | null)?.postMessage(
          { type: PM_TOKEN, requestId: d.requestId, token },
          e.origin,
        );
      })();
    };

    window.addEventListener("message", onMessage);
    return () => {
      window.removeEventListener("message", onMessage);
      delete window.__hanghoGetIdToken;
    };
  }, []);

  const onFrameLoad = useCallback((e: React.SyntheticEvent<HTMLIFrameElement>) => {
    const doc = e.currentTarget.contentDocument;
    if (!doc) return;
    const slot = doc.getElementById("next-account-slot");
    setAccountMount(slot);
  }, []);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <TrialModeBanner shopSlug={shop} />
      <iframe
        ref={iframeRef}
        src={src}
        title={`Legacy Sales App - ${shop}`}
        onLoad={onFrameLoad}
        style={{
          flex: 1,
          minHeight: 0,
          width: "100%",
          border: "none",
          display: "block",
        }}
      />
      {accountMount ? createPortal(<AccountBar shop={shop} docked />, accountMount) : null}
    </div>
  );
}
