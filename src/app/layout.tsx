import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import { ConfirmDialogProvider } from "@/components/confirm-dialog";
import TrialBannerOutlet from "@/components/TrialBannerOutlet";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin", "vietnamese"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hangho.com — Quản lý bán hàng",
  description: "POS, tồn kho, khách hàng và đồng bộ đám mây.",
  verification: {
    google: "5k78BUlPEqMvjdvWOBSbJFvNUOHIMtuDRBeNDeERRdI",
  },
  // Favicon: đặt file tại src/app/favicon.ico — Next tự gắn <link> và phục vụ /favicon.ico.
};

/** Enables env(safe-area-inset-*) for notched devices and standalone-style layouts. */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={montserrat.variable}>
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <ConfirmDialogProvider>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              minHeight: 0,
            }}
          >
            <TrialBannerOutlet />
            <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
              {children}
            </div>
          </div>
        </ConfirmDialogProvider>
      </body>
    </html>
  );
}
