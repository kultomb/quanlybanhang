import ShopLayoutChrome from "@/components/ShopLayoutChrome";

export default async function ShopLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ shop: string }>;
}) {
  await params;
  return <ShopLayoutChrome>{children}</ShopLayoutChrome>;
}
