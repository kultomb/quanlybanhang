import { notFound } from "next/navigation";

import AccountPage from "@/components/AccountPage";
import RequireAuth from "@/components/RequireAuth";
import { redirectIfShopUrlMismatch } from "@/lib/backend/redirect-if-shop-url-mismatch";
import { rtdbShopSlugExists } from "@/lib/backend/shop-exists";

type ShopAccountPageProps = {
  params: Promise<{ shop: string }>;
};

export default async function ShopAccountPage({ params }: ShopAccountPageProps) {
  const { shop } = await params;
  if (!(await rtdbShopSlugExists(shop))) {
    notFound();
  }
  await redirectIfShopUrlMismatch(shop);

  return (
    <RequireAuth
      pathShopFromUrl={shop}
      renderShop={({ shopSlug }) => <AccountPage shop={shopSlug} />}
    />
  );
}
