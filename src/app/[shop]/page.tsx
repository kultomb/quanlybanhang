import { notFound } from "next/navigation";

import ShopPosClient from "./shop-pos-client";
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

  return <ShopPosClient pathShopFromUrl={shop} />;
}
