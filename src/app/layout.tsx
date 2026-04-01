import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={montserrat.variable}>
      <body>{children}</body>
    </html>
  );
}
