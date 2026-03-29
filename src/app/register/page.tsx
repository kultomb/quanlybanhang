import { Suspense } from "react";
import RegisterForm from "./register-client";

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <main
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            background: "linear-gradient(160deg, #ecfdf5 0%, #d1fae5 100%)",
          }}
        >
          <p style={{ color: "#6b7280", fontSize: 15 }}>Đang tải...</p>
        </main>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
