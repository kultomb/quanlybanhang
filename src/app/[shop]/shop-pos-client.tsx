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
            flex: 1,
            minHeight: 0,
            margin: 0,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <ShopLegacyFrame shop={shopSlug} />
        </main>
      )}
    />
  );
}
