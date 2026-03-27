import AccountBar from "@/components/AccountBar";
import RequireAuth from "@/components/RequireAuth";
import ShopLegacyFrame from "@/components/ShopLegacyFrame";

type ShopPageProps = {
  params: Promise<{ shop: string }>;
};

export default async function ShopPage({ params }: ShopPageProps) {
  const { shop } = await params;

  return (
    <RequireAuth>
      <main style={{ width: "100vw", height: "100vh", margin: 0 }}>
        <AccountBar shop={shop} />
        <ShopLegacyFrame shop={shop} />
      </main>
    </RequireAuth>
  );
}
