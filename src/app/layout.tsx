import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster as Sonner } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "JACXI Shipping — Vehicle Logistics & Financial Management",
  description: "Vehicle logistics, financial management, payments, invoices, and reporting for JACXI Shipping.",
  keywords: ["JACXI", "vehicle logistics", "shipping", "invoicing", "ledger", "accounting", "Afghanistan"],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          {children}
          <Sonner position="top-right" richColors closeButton />
        </Providers>
      </body>
    </html>
  );
}
