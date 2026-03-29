"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { auth } from "@/lib/backend/client";
import AccountBar from "@/components/AccountBar";
import TrialModeBanner from "@/components/TrialModeBanner";

declare global {
  interface Window {
    /** POS iframe: gọi trực tiếp (cùng origin) hoặc dùng kèm postMessage fallback. */
    __hanghoGetIdToken?: () => Promise<string | null>;
  }
}

const PM_GET = "HANGHO_GET_ID_TOKEN";
const PM_TOKEN = "HANGHO_ID_TOKEN";

type ShopLegacyFrameProps = {
  shop: string;
};

export default function ShopLegacyFrame({ shop }: ShopLegacyFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [bridgeReady, setBridgeReady] = useState(false);
  const [accountMount, setAccountMount] = useState<HTMLElement | null>(null);
  const src = useMemo(() => `/legacy/index.html?shop=${encodeURIComponent(shop)}`, [shop]);

  useEffect(() => {
    setAccountMount(null);
  }, [shop]);

  useLayoutEffect(() => {
    window.__hanghoGetIdToken = async () => {
      const u = auth.currentUser;
      if (!u) return null;
      try {
        return await u.getIdToken();
      } catch {
        return null;
      }
    };

    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      const child = iframeRef.current?.contentWindow;
      if (!child || e.source !== child) return;
      const d = e.data;
      if (!d || d.type !== PM_GET || typeof d.requestId !== "string") return;
      void (async () => {
        const u = auth.currentUser;
        let token: string | null = null;
        if (u) {
          try {
            token = await u.getIdToken();
          } catch {
            token = null;
          }
        }
        (e.source as Window | null)?.postMessage(
          { type: PM_TOKEN, requestId: d.requestId, token },
          e.origin,
        );
      })();
    };

    window.addEventListener("message", onMessage);
    setBridgeReady(true);
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
      {bridgeReady ? (
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
      ) : (
        <div
          style={{
            flex: 1,
            minHeight: 0,
            display: "grid",
            placeItems: "center",
            color: "#64748b",
            fontSize: 14,
          }}
          aria-busy="true"
        >
          Đang chuẩn bị phiên đồng bộ…
        </div>
      )}
      {accountMount ? createPortal(<AccountBar shop={shop} docked />, accountMount) : null}
    </div>
  );
}
