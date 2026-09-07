"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { KpiCard } from "@/components/shared/KpiCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Car,
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

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#f59e0b",
  IN_YARD: "#3b82f6",
  LOADED: "#a855f7",
  IN_TRANSIT: "#06b6d4",
  CUSTOMS: "#f97316",
  DELIVERED: "#10b981",
  CANCELLED: "#f43f5e",
};

export function DashboardView({
  onNavigate,
}: {
  onNavigate: (v: any) => void;
}) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-5">
        <PageHeader
          title="Dashboard"
          subtitle="Loading overview…"
          icon={LayoutDashboard}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-28 bg-white rounded-xl border border-slate-200 animate-pulse"
            />
          ))}
        </div>
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <div className="h-[200px] flex items-center justify-center text-sm text-slate-400">
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
                        fill={STATUS_COLORS[entry.name] || "#94a3b8"}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      fontSize: "12px",
                      borderRadius: "6px",
                      border: "1px solid #e2e8f0",
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
                      background: STATUS_COLORS[s.name] || "#94a3b8",
                    }}
                  />
                  <span className="text-slate-600">{s.name.replace(/_/g, " ")}</span>
                  <span className="text-slate-400 ml-auto">{s.value}</span>
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
              <div className="h-[200px] flex items-center justify-center text-sm text-slate-400">
                No profit data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={topProfit} layout="vertical" margin={{ left: 0, right: 16 }}>
                  <CartesianGrid
                    horizontal={false}
                    stroke="#f1f5f9"
                    strokeDasharray="3 3"
                  />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "#475569" }}
                    width={90}
                  />
                  <Tooltip
                    contentStyle={{
                      fontSize: "12px",
                      borderRadius: "6px",
                      border: "1px solid #e2e8f0",
                    }}
                    formatter={(v: any) => formatCurrency(v)}
                  />
                  <Bar dataKey="profit" fill="#0f172a" radius={[0, 4, 4, 0]} />
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
            <div className="divide-y divide-slate-100">
              {(data?.recentVehicles || []).map((v: any) => (
                <div
                  key={v.id}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50"
                >
                  <div className="h-9 w-9 rounded-md bg-slate-100 flex items-center justify-center">
                    <Car className="h-4 w-4 text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {v.make} {v.model} ({v.year})
                    </p>
                    <p className="text-xs text-slate-500 font-mono truncate">
                      {v.vin}
                    </p>
                  </div>
                  <StatusBadge status={v.status} />
                </div>
              ))}
              {(data?.recentVehicles || []).length === 0 && (
                <div className="px-4 py-8 text-center text-sm text-slate-400">
                  No vehicles yet
                </div>
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
            <div className="divide-y divide-slate-100">
              {(data?.customerLedgers || []).map((l: any) => (
                <div
                  key={l.id}
                  className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{l.name}</p>
                    <p className="text-xs text-slate-500">
                      Updated {formatDate(l.updatedAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={
                        l.balance > 0
                          ? "text-sm font-semibold text-rose-600"
                          : l.balance < 0
                          ? "text-sm font-semibold text-emerald-600"
                          : "text-sm font-semibold text-slate-700"
                      }
                    >
                      {formatCurrency(l.balance)}
                    </p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">
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
                <div className="px-4 py-8 text-center text-sm text-slate-400">
                  No ledgers yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
