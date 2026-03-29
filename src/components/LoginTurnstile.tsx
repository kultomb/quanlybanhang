"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";

type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

type LoginTurnstileProps = {
  siteKey: string;
  onToken: (token: string) => void;
};

export default function LoginTurnstile({ siteKey, onToken }: LoginTurnstileProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [apiReady, setApiReady] = useState(false);

  const mount = useCallback(() => {
    const el = containerRef.current;
    const api = typeof window !== "undefined" ? window.turnstile : undefined;
    if (!el || !api || !siteKey) return;
    if (widgetIdRef.current) {
      try {
        api.remove(widgetIdRef.current);
      } catch {
        // Ignore.
      }
      widgetIdRef.current = null;
    }
    const id = api.render(el, {
      sitekey: siteKey,
      callback: (t: string) => onToken(t),
      "error-callback": () => onToken(""),
      "expired-callback": () => onToken(""),
    });
    widgetIdRef.current = id;
  }, [siteKey, onToken]);

  useEffect(() => {
    if (!apiReady || !siteKey) return;
    mount();
    return () => {
      const api = window.turnstile;
      const wid = widgetIdRef.current;
      if (api && wid) {
        try {
          api.remove(wid);
        } catch {
          // Ignore.
        }
      }
      widgetIdRef.current = null;
    };
  }, [apiReady, siteKey, mount]);

  if (!siteKey) return null;

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={() => setApiReady(true)}
      />
      <div ref={containerRef} style={{ minHeight: 70, display: "grid", placeItems: "center" }} />
    </>
  );
}
