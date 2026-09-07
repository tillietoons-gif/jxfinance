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
  Truck,
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
    <div className="flex flex-col h-full">
      {/* Logo / brand */}
      <div className="flex items-center gap-2.5 px-4 h-14 border-b border-slate-200 bg-slate-950">
        <div className="h-7 w-7 rounded-md bg-white flex items-center justify-center">
          <Truck className="h-4 w-4 text-slate-950" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-white font-bold text-sm tracking-tight">
            AUTOLOGIX
          </span>
          <span className="text-[10px] text-slate-400 font-medium">
            Logistics & Finance
          </span>
        </div>
      </div>

      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto thin-scroll">
        <p className="px-2 pb-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
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
                "w-full group flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm font-medium transition-colors",
                active
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0",
                  active
                    ? "text-white"
                    : "text-slate-400 group-hover:text-slate-700"
                )}
              />
              <span className="flex-1 text-left">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="px-4 py-3 border-t border-slate-200">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-white flex items-center justify-center text-xs font-semibold">
            OP
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-xs font-medium text-slate-900">Operator</span>
            <span className="text-[10px] text-slate-500">Solo Admin</span>
          </div>
        </div>
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
    <div className="min-h-screen flex bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 shrink-0 flex-col bg-white border-r border-slate-200 sticky top-0 h-screen">
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
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 lg:hidden">
          <div className="flex items-center justify-between px-4 h-14">
            <button
              onClick={() => setMobileOpen(true)}
              className="p-1.5 rounded-md hover:bg-slate-100"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="font-semibold text-sm tracking-tight">
              AUTOLOGIX
            </span>
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
