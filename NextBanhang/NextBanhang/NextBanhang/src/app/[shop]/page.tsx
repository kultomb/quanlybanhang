import AccountBar from "@/components/AccountBar";
import RequireAuth from "@/components/RequireAuth";

type ShopPageProps = {
  params: Promise<{ shop: string }>;
};

export default async function ShopPage({ params }: ShopPageProps) {
  const { shop } = await params;
  const safeShop = encodeURIComponent(shop);

  return (
    <RequireAuth>
      <main style={{ width: "100vw", height: "100vh", margin: 0 }}>
        <AccountBar shop={shop} />
        <iframe
          src={`/legacy/index.html?shop=${safeShop}`}
          title={`Legacy Sales App - ${shop}`}
          style={{ width: "100%", height: "100%", border: "none" }}
        />
      </main>
    </RequireAuth>
  );
}
