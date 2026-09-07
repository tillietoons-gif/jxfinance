import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster as Sonner } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "JACXI Shipping — Vehicle Logistics & Financial Management",
  description:
    "Premium vehicle logistics from North America to Afghanistan. Solo-operator platform for vehicle shipments, dual-sided expense tracking, dual-ledger accounting, payments, invoices, and reporting.",
  keywords: [
    "JACXI",
    "vehicle logistics",
    "shipping",
    "invoicing",
    "ledger",
    "accounting",
    "Afghanistan",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Sonner position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
