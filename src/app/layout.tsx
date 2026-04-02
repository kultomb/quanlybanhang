import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import { ConfirmDialogProvider } from "@/components/confirm-dialog";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin", "vietnamese"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hangho.com — Quản lý bán hàng",
  description: "POS, tồn kho, khách hàng và đồng bộ đám mây.",
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
      <body>
        <ConfirmDialogProvider>{children}</ConfirmDialogProvider>
      </body>
    </html>
  );
}
