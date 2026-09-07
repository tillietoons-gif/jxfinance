"use client";

import { useState, useCallback } from "react";
import {
  LayoutDashboard,
  Car,
  Users,
  BookOpen,
  CreditCard,
  FileText,
  BarChart3,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";

import { DashboardView } from "@/components/modules/DashboardView";
import { VehiclesView } from "@/components/modules/VehiclesView";
import { CustomersView } from "@/components/modules/CustomersView";
import { LedgersView } from "@/components/modules/LedgersView";
import { PaymentsView } from "@/components/modules/PaymentsView";
import { InvoicesView } from "@/components/modules/InvoicesView";
import { ReportsView } from "@/components/modules/ReportsView";

type View =
  | "dashboard"
  | "vehicles"
  | "customers"
  | "ledgers"
  | "payments"
  | "invoices"
  | "reports";

const NAV: { id: View; label: string; icon: any; description: string }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, description: "Overview & KPIs" },
  { id: "vehicles", label: "Vehicles", icon: Car, description: "Shipment tracking" },
  { id: "customers", label: "Customers", icon: Users, description: "Client directory" },
  { id: "ledgers", label: "Ledgers", icon: BookOpen, description: "Dual-ledger accounting" },
  { id: "payments", label: "Payments", icon: CreditCard, description: "Payment recording" },
  { id: "invoices", label: "Invoices", icon: FileText, description: "Billing & invoicing" },
  { id: "reports", label: "Reports", icon: BarChart3, description: "Analytics & exports" },
];

function SidebarContent({
  view,
  onNavigate,
}: {
  view: View;
  onNavigate: (v: View) => void;
}) {
  return (
    <div className="flex flex-col h-full bg-white">
      {/* Brand header — JACXI wordmark + SHIPPING sub-label
          Matches brand book cover: Extra Bold Black wordmark, widely-tracked grey subtitle */}
      <div className="px-5 pt-7 pb-6 border-b border-[#E3E3DF]">
        <p className="mb-2 text-[9px] font-semibold uppercase tracking-wider-brand text-[#92730E]">
          Vehicle logistics / finance
        </p>
        <h1 className="brand-wordmark text-3xl text-black leading-none">
          JACXI
        </h1>
        <p className="mt-2 text-[10px] font-semibold text-[#6B7280] uppercase tracking-brand">
          Shipping
        </p>
        {/* Subtle gold accent rule under the brand */}
        <div className="mt-3 h-px w-8 bg-[#D4AF37]" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto thin-scroll">
        <p className="px-3 pb-2 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider-brand">
          Workspace
        </p>
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = view === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                "relative w-full group flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all",
                active
                  ? "bg-black text-white"
                  : "text-[#374151] hover:bg-[#F9FAFB] hover:text-black"
              )}
            >
              {/* Gold left-edge indicator for active state */}
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 bg-[#D4AF37] rounded-r" />
              )}
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0",
                  active
                    ? "text-[#D4AF37]"
                    : "text-[#9CA3AF] group-hover:text-black"
                )}
              />
              <span className="flex-1 text-left">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Brand footer — values: Transparency, Precision, Reliability */}
      <div className="px-5 py-4 border-t border-[#E3E3DF]">
        <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-brand mb-1.5">
          Brand Values
        </p>
        <p className="text-xs text-[#374151] leading-relaxed">
          Transparency<span className="text-[#D4AF37] mx-1.5">·</span>
          Precision<span className="text-[#D4AF37] mx-1.5">·</span>
          Reliability
        </p>
        <div className="mt-3 h-px brand-accent-line" />
        <p className="mt-2 text-[10px] text-[#9CA3AF]">North America → Afghanistan</p>
      </div>
    </div>
  );
}

export default function Home() {
  const [view, setView] = useState<View>("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const handleNavigate = (v: View) => {
    setView(v);
    setMobileOpen(false);
    if (v === "dashboard") refresh();
  };

  return (
    <div className="workspace-surface min-h-screen flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-white border-r border-[#E3E3DF] sticky top-0 h-screen">
        <SidebarContent view={view} onNavigate={handleNavigate} />
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SidebarContent view={view} onNavigate={handleNavigate} />
        </SheetContent>
      </Sheet>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar (mobile only) */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-[#E3E3DF] lg:hidden">
          <div className="flex items-center justify-between px-4 h-14">
            <button
              onClick={() => setMobileOpen(true)}
              className="p-1.5 rounded-md hover:bg-[#F9FAFB]"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="text-center">
              <span className="brand-wordmark block text-sm text-black tracking-tight">JACXI</span>
              <span className="block text-[8px] font-semibold uppercase tracking-brand text-[#92730E]">Shipping</span>
            </div>
            <div className="w-7" />
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-5 max-w-[1600px] w-full mx-auto">
          <div key={`${view}-${refreshKey}`} className="animate-fade-in">
            {view === "dashboard" && (
              <DashboardView onNavigate={handleNavigate} />
            )}
            {view === "vehicles" && <VehiclesView />}
            {view === "customers" && <CustomersView />}
            {view === "ledgers" && <LedgersView />}
            {view === "payments" && <PaymentsView />}
            {view === "invoices" && <InvoicesView />}
            {view === "reports" && <ReportsView />}
          </div>
        </main>
      </div>
    </div>
  );
}
