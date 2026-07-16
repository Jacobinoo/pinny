import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pinny - Beautiful Ideas",
  description: "A gorgeous Pinterest clone using the Binternet backend.",
};

import CacheWiper from "@/components/CacheWiper";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ServiceWorkerRegister />
        <CacheWiper />
        {children}
      </body>
    </html>
  );
}
