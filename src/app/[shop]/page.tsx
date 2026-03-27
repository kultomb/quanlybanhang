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
      <main
        style={{
          position: "relative",
          width: "100vw",
          height: "100vh",
          margin: 0,
          overflow: "hidden",
        }}
      >
        {/* Logo trong iframe (.top-utility-bar z-index:100); thanh tài khoản cùng lớp z=100, absolute trong main — không fixed/1200 đè cả iframe */}
        <AccountBar shop={shop} />
        <ShopLegacyFrame shop={shop} />
      </main>
    </RequireAuth>
  );
}
