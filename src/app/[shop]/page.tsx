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
        {/* Tài khoản portal vào #next-account-slot trong iframe — cùng DOM/cuộn với .top-utility-bar */}
        <ShopLegacyFrame shop={shop} />
      </main>
    </RequireAuth>
  );
}
