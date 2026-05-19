import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import SiteHeader from '@/components/site-header'

export const metadata: Metadata = {
  title: "Luam - Buy and Sell Pre-loved Items",
  description: "Join thousands of users buying and selling fashion, electronics, and more",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-stone-50 text-stone-900">
        <Suspense fallback={<header className="bg-white shadow-sm border-b h-[120px]" />}>
          <SiteHeader />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
