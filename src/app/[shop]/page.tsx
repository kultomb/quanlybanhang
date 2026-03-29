import { notFound } from "next/navigation";

import RequireAuth from "@/components/RequireAuth";
import ShopLegacyFrame from "@/components/ShopLegacyFrame";
import { redirectIfShopUrlMismatch } from "@/lib/backend/redirect-if-shop-url-mismatch";
import { rtdbShopSlugExists } from "@/lib/backend/shop-exists";

type ShopPageProps = {
  params: Promise<{ shop: string }>;
};

export default async function ShopPage({ params }: ShopPageProps) {
  const { shop } = await params;
  if (!(await rtdbShopSlugExists(shop))) {
    notFound();
  }
  await redirectIfShopUrlMismatch(shop);

  return (
    <RequireAuth
      pathShopFromUrl={shop}
      renderShop={({ shopSlug }) => (
        <main
          style={{
            position: "relative",
            width: "100vw",
            height: "100vh",
            margin: 0,
            overflow: "hidden",
          }}
        >
          {/* shopSlug từ hồ sơ — không lấy segment URL (tránh hiển thị /iframe sai khi URL rác) */}
          <ShopLegacyFrame shop={shopSlug} />
        </main>
      )}
    />
  );
}
