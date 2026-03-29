import { notFound } from "next/navigation";

import ShopAccountClient from "../shop-account-client";
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

  return <ShopAccountClient pathShopFromUrl={shop} />;
}
