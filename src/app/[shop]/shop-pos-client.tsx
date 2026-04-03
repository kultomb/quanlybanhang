"use client";

import RequireAuth from "@/components/RequireAuth";
import ShopLegacyFrame from "@/components/ShopLegacyFrame";

export default function ShopPosClient({ pathShopFromUrl }: { pathShopFromUrl: string }) {
  return (
    <RequireAuth
      pathShopFromUrl={pathShopFromUrl}
      renderShop={({ shopSlug }) => (
        <main
          style={{
            position: "relative",
            width: "100%",
            maxWidth: "100%",
            /* 100vh trên mobile (Safari/Chrome) thường cao hơn màn hình thật → iframe legacy lệch; dvh bám viewport động */
            height: "100dvh",
            minHeight: "100dvh",
            maxHeight: "100dvh",
            margin: 0,
            overflow: "hidden",
          }}
        >
          <ShopLegacyFrame shop={shopSlug} />
        </main>
      )}
    />
  );
}
