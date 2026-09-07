"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { KpiCard } from "@/components/shared/KpiCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Car,
  BookOpen,
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowRight,
  Receipt,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/types";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
} from "recharts";
import { StatusBadge } from "@/components/shared/StatusBadge";

// JACXI brand palette — gold + jet black + warm greys
// Status colors anchored to the brand book: PENDING=gold, DELIVERED=gold-deep, CANCELLED=red
const STATUS_COLORS: Record<string, string> = {
  PENDING: "#D4AF37",
  IN_YARD: "#6B7280",
  LOADED: "#9CA3AF",
  IN_TRANSIT: "#9CA3AF",
  CUSTOMS: "#F59E0B",
  DELIVERED: "#92730E",
  CANCELLED: "#DC2626",
};

export function DashboardView({
  onNavigate,
}: {
  onNavigate: (v: any) => void;
}) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    fetch("/api/dashboard")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load dashboard");
        return r.json();
      })
      .then((d) => setData(d))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Dashboard"
          subtitle="Loading overview."
          icon={LayoutDashboard}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-28 bg-white rounded-xl border border-[#E5E7EB] animate-pulse"
            />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="h-[280px] bg-white rounded-xl border border-[#E5E7EB] animate-pulse" />
          <div className="h-[280px] lg:col-span-2 bg-white rounded-xl border border-[#E5E7EB] animate-pulse" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-[240px] bg-white rounded-xl border border-[#E5E7EB] animate-pulse" />
          <div className="h-[240px] bg-white rounded-xl border border-[#E5E7EB] animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <ErrorState onRetry={load} />
      </div>
    );
  }

  const f = data?.financials || {};
  const c = data?.counts || {};

  const statusData = Object.entries(data?.statusCounts || {}).map(
    ([name, value]) => ({ name, value: value as number })
  );

  const topProfit = (data?.topProfitVehicles || []).map((v: any) => ({
    name: `${v.make} ${v.model}`.slice(0, 14),
    profit: v.profit,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle="Business overview & financial pulse"
        icon={LayoutDashboard}
        actions={
          <Button
            onClick={() => onNavigate("reports")}
            size="sm"
            variant="outline"
            className="gap-1.5"
          >
            View Reports
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        }
      />

      {/* KPI Cards — JACXI brand: primary=jet black with gold, others snow-white with gold borders */}
      <div className="stagger grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Net Profit"
          value={formatCurrency(f.totalProfit)}
          hint={`Revenue ${formatCurrency(f.totalRevenue)} • Cost ${formatCurrency(f.totalCost)}`}
          icon={TrendingUp}
          variant="primary"
          trend={{ value: `${(f.margin || 0).toFixed(1)}% margin`, positive: true }}
        />
        <KpiCard
          label="Outstanding"
          value={formatCurrency(f.totalOutstanding)}
          hint={`${c.invoices || 0} invoices • ${c.vehicles || 0} vehicles`}
          icon={Receipt}
          variant="warning"
        />
        <KpiCard
          label="Payments Received"
          value={formatCurrency(f.totalPaymentsReceived)}
          hint={`Across ${c.payments || 0} payments`}
          icon={Wallet}
          variant="success"
        />
        <KpiCard
          label="Receivable Balance"
          value={formatCurrency(f.totalReceivable)}
          hint={`Payable ${formatCurrency(f.totalPayable)}`}
          icon={DollarSign}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Vehicle status pie */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Vehicle Status Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-sm text-[#9CA3AF]">
                No vehicles yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={2}
                  >
                    {statusData.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={STATUS_COLORS[entry.name] || "#9CA3AF"}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      fontSize: "12px",
                      borderRadius: "6px",
                      border: "1px solid #E5E7EB",
                      background: "#FFFFFF",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div className="grid grid-cols-2 gap-1 mt-3">
              {statusData.map((s) => (
                <div
                  key={s.name}
                  className="flex items-center gap-1.5 text-[11px]"
                >
                  <span
                    className="h-2 w-2 rounded-sm"
                    style={{
                      background: STATUS_COLORS[s.name] || "#9CA3AF",
                    }}
                  />
                  <span className="text-[#374151]">{s.name.replace(/_/g, " ")}</span>
                  <span className="text-[#9CA3AF] ml-auto">{s.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top profit vehicles */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">
              Top Profit Vehicles
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => onNavigate("vehicles")}
            >
              View all
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {topProfit.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-sm text-[#9CA3AF]">
                No profit data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={topProfit} layout="vertical" margin={{ left: 0, right: 16 }}>
                  <CartesianGrid
                    horizontal={false}
                    stroke="#F3F4F6"
                    strokeDasharray="3 3"
                  />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: "#9CA3AF" }}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "#374151" }}
                    width={90}
                  />
                  <Tooltip
                    contentStyle={{
                      fontSize: "12px",
                      borderRadius: "6px",
                      border: "1px solid #E5E7EB",
                      background: "#FFFFFF",
                    }}
                    formatter={(v: any) => formatCurrency(v)}
                  />
                  <Bar dataKey="profit" fill="#000000" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent vehicles + Outstanding ledgers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Recent Vehicles</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => onNavigate("vehicles")}
            >
              View all
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-[#F3F4F6]">
              {(data?.recentVehicles || []).map((v: any) => (
                <div
                  key={v.id}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#F9FAFB]"
                >
                  <div className="h-9 w-9 rounded-md bg-black flex items-center justify-center">
                    <Car className="h-4 w-4 text-[#D4AF37]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">
                      {v.make} {v.model} ({v.year})
                    </p>
                    <p className="text-xs text-[#6B7280] font-mono truncate">
                      {v.vin}
                    </p>
                  </div>
                  <StatusBadge status={v.status} />
                </div>
              ))}
              {(data?.recentVehicles || []).length === 0 && (
                <EmptyState icon={Car} title="No vehicles yet" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">
              Outstanding Customer Ledgers
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => onNavigate("ledgers")}
            >
              View all
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-[#F3F4F6]">
              {(data?.customerLedgers || []).map((l: any) => (
                <div
                  key={l.id}
                  className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-[#F9FAFB]"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{l.name}</p>
                    <p className="text-xs text-[#6B7280]">
                      Updated {formatDate(l.updatedAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={
                        l.balance > 0
                          ? "text-sm font-semibold text-[#92730E]"
                          : l.balance < 0
                          ? "text-sm font-semibold text-[#92730E]"
                          : "text-sm font-semibold text-black"
                      }
                    >
                      {formatCurrency(l.balance)}
                    </p>
                    <p className="text-[10px] text-[#9CA3AF] uppercase tracking-brand">
                      {l.balance > 0
                        ? "Receivable"
                        : l.balance < 0
                        ? "Payable"
                        : "Settled"}
                    </p>
                  </div>
                </div>
              ))}
              {(data?.customerLedgers || []).length === 0 && (
                <EmptyState icon={BookOpen} title="No ledgers yet" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
