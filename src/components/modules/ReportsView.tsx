"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { KpiCard } from "@/components/shared/KpiCard";
import { ExportButtons } from "@/components/shared/ExportButtons";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Truck,
  Clock,
  Calendar,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Line,
  LineChart,
  Area,
  AreaChart,
} from "recharts";
import { formatCurrency, formatDate, formatNumber } from "@/lib/types";
import { exportToExcel } from "@/lib/excel";
import { generateReportPdf } from "@/lib/pdf";
import { StatusBadge } from "@/components/shared/StatusBadge";

export function ReportsView() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Reports"
        subtitle="Profit & loss, vehicle margins, and aged receivables"
        icon={BarChart3}
      />
      <Tabs defaultValue="pnl">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="pnl">P & L</TabsTrigger>
          <TabsTrigger value="vehicle-margins">Vehicle Margins</TabsTrigger>
          <TabsTrigger value="aged">Aged Receivables</TabsTrigger>
        </TabsList>
        <TabsContent value="pnl" className="mt-4">
          <PnlReport />
        </TabsContent>
        <TabsContent value="vehicle-margins" className="mt-4">
          <VehicleMarginsReport />
        </TabsContent>
        <TabsContent value="aged" className="mt-4">
          <AgedReceivablesReport />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PnlReport() {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [preset, setPreset] = useState("all");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (start) params.set("start", start);
    if (end) params.set("end", end);
    const res = await fetch(`/api/reports/profit-loss?${params}`);
    const d = await res.json();
    setData(d);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const applyPreset = (p: string) => {
    setPreset(p);
    const now = new Date();
    const today = new Date();
    if (p === "today") {
      setStart(now.toISOString().slice(0, 10));
      setEnd(now.toISOString().slice(0, 10));
    } else if (p === "week") {
      const start = new Date();
      start.setDate(now.getDate() - 7);
      setStart(start.toISOString().slice(0, 10));
      setEnd(today.toISOString().slice(0, 10));
    } else if (p === "month") {
      const start = new Date();
      start.setMonth(now.getMonth() - 1);
      setStart(start.toISOString().slice(0, 10));
      setEnd(today.toISOString().slice(0, 10));
    } else if (p === "year") {
      const start = new Date();
      start.setFullYear(now.getFullYear() - 1);
      setStart(start.toISOString().slice(0, 10));
      setEnd(today.toISOString().slice(0, 10));
    } else {
      setStart("");
      setEnd("");
    }
  };

  const handleExcel = async () => {
    if (!data) return;
    await exportToExcel({
      filename: "PnL_Report",
      sheetName: "P&L",
      title: "Profit & Loss Report",
      subtitle: `${start || "All time"} to ${end || "today"}`,
      columns: [
        { header: "Date", key: "date", width: 14 },
        { header: "Revenue", key: "revenue", width: 14 },
        { header: "Cost", key: "cost", width: 14 },
        { header: "Profit", key: "profit", width: 14 },
      ],
      rows: data.byDay || [],
      totals: [
        { label: "Total Revenue", value: formatCurrency(data.totalRevenue) },
        { label: "Total Cost", value: formatCurrency(data.totalCost) },
        { label: "Net Profit", value: formatCurrency(data.totalProfit) },
        { label: "Margin", value: `${(data.margin || 0).toFixed(1)}%` },
      ],
    });
  };

  const handlePdf = () => {
    if (!data) return;
    generateReportPdf({
      title: "Profit & Loss Report",
      subtitle: `${start || "All time"} to ${end || "today"}`,
      summary: [
        { label: "Revenue", value: formatCurrency(data.totalRevenue) },
        { label: "Cost", value: formatCurrency(data.totalCost) },
        { label: "Profit", value: formatCurrency(data.totalProfit) },
        { label: "Margin", value: `${(data.margin || 0).toFixed(1)}%` },
      ],
      head: ["Date", "Revenue", "Cost", "Profit"],
      body: (data.byDay || []).map((d: any) => [
        d.date,
        formatCurrency(d.revenue),
        formatCurrency(d.cost),
        formatCurrency(d.profit),
      ]),
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Date Range Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="text-xs text-[#6B7280] mb-1 block">Start</label>
              <Input
                type="date"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="w-40"
              />
            </div>
            <div>
              <label className="text-xs text-[#6B7280] mb-1 block">End</label>
              <Input
                type="date"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="w-40"
              />
            </div>
            <Select value={preset} onValueChange={applyPreset}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Quick select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last 7 days</SelectItem>
                <SelectItem value="month">Last 30 days</SelectItem>
                <SelectItem value="year">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" onClick={load}>
              Apply
            </Button>
            <div className="ml-auto">
              <ExportButtons onExcel={handleExcel} onPdf={handlePdf} />
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="h-32 bg-white rounded-xl border animate-pulse" />
      ) : data ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard
              label="Revenue"
              value={formatCurrency(data.totalRevenue)}
              icon={DollarSign}
              variant="success"
            />
            <KpiCard
              label="Cost"
              value={formatCurrency(data.totalCost)}
              icon={TrendingDown}
              variant="danger"
            />
            <KpiCard
              label="Net Profit"
              value={formatCurrency(data.totalProfit)}
              icon={TrendingUp}
              variant="primary"
              trend={{
                value: `${(data.margin || 0).toFixed(1)}% margin`,
                positive: data.totalProfit >= 0,
              }}
            />
            <KpiCard
              label="Payments Received"
              value={formatCurrency(data.totalPayments)}
              icon={DollarSign}
            />
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Profit Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.byDay && data.byDay.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={data.byDay}>
                    <defs>
                      <linearGradient id="profit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.5} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0f172a" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#0f172a" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                      tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        fontSize: "12px",
                        borderRadius: "6px",
                      }}
                      formatter={(v: any) => formatCurrency(v)}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#0f172a"
                      fill="url(#revenue)"
                      name="Revenue"
                    />
                    <Area
                      type="monotone"
                      dataKey="profit"
                      stroke="#10b981"
                      fill="url(#profit)"
                      name="Profit"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-sm text-[#9CA3AF]">
                  No data for selected range
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Expense Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto thin-scroll">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#F9FAFB] hover:bg-[#F9FAFB]">
                      <TableHead>Date</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Vehicle</TableHead>
                      <TableHead className="text-right">Charge</TableHead>
                      <TableHead className="text-right">Cost</TableHead>
                      <TableHead className="text-right">Profit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data.expenses || []).slice(0, 20).map((e: any) => (
                      <TableRow key={e.id}>
                        <TableCell className="text-xs text-[#6B7280]">
                          {formatDate(e.createdAt)}
                        </TableCell>
                        <TableCell className="text-sm">{e.title}</TableCell>
                        <TableCell className="text-xs font-mono text-[#6B7280]">
                          {e.vehicle?.vin}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm text-[#92730E]">
                          {formatCurrency(e.customerCharge)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm text-[#DC2626]">
                          {formatCurrency(e.companyCost)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm font-semibold">
                          {formatCurrency(e.profit)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}

function VehicleMarginsReport() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reports/vehicle-margins")
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, []);

  const handleExcel = async () => {
    if (!data) return;
    await exportToExcel({
      filename: "Vehicle_Margins_Report",
      sheetName: "Vehicle Margins",
      title: "Vehicle Expense & Margin Report",
      columns: [
        { header: "VIN", key: "vin", width: 22 },
        { header: "Make", key: "make", width: 14 },
        { header: "Model", key: "model", width: 18 },
        { header: "Customer", key: "customerName", width: 22 },
        { header: "Status", key: "status", width: 14 },
        { header: "Charge", key: "customerCharge", width: 14 },
        { header: "Cost", key: "companyCost", width: 14 },
        { header: "Profit", key: "profit", width: 14 },
        { header: "Margin %", key: "margin", width: 12 },
      ],
      rows: data.vehicles.map((v: any) => ({
        ...v,
        margin: `${(v.margin || 0).toFixed(2)}%`,
      })),
      totals: [
        { label: "Total Charge", value: formatCurrency(data.summary.totalCharge) },
        { label: "Total Cost", value: formatCurrency(data.summary.totalCost) },
        { label: "Total Profit", value: formatCurrency(data.summary.totalProfit) },
        { label: "Avg Margin", value: `${(data.summary.avgMargin || 0).toFixed(2)}%` },
      ],
    });
  };

  const handlePdf = () => {
    if (!data) return;
    generateReportPdf({
      title: "Vehicle Margins Report",
      summary: [
        { label: "Vehicles", value: String(data.summary.totalVehicles) },
        { label: "Total Charge", value: formatCurrency(data.summary.totalCharge) },
        { label: "Total Cost", value: formatCurrency(data.summary.totalCost) },
        { label: "Total Profit", value: formatCurrency(data.summary.totalProfit) },
      ],
      head: ["VIN", "Vehicle", "Customer", "Charge", "Cost", "Profit", "Margin %"],
      body: data.vehicles.map((v: any) => [
        v.vin,
        `${v.make} ${v.model}`,
        v.customerName,
        formatCurrency(v.customerCharge),
        formatCurrency(v.companyCost),
        formatCurrency(v.profit),
        `${(v.margin || 0).toFixed(1)}%`,
      ]),
    });
  };

  if (loading) return <div className="h-32 bg-white rounded-xl border animate-pulse" />;
  if (!data) return null;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <ExportButtons onExcel={handleExcel} onPdf={handlePdf} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="Total Vehicles"
          value={data.summary.totalVehicles}
          icon={Truck}
        />
        <KpiCard
          label="Total Charge"
          value={formatCurrency(data.summary.totalCharge)}
          icon={DollarSign}
          variant="success"
        />
        <KpiCard
          label="Total Cost"
          value={formatCurrency(data.summary.totalCost)}
          icon={TrendingDown}
          variant="danger"
        />
        <KpiCard
          label="Avg Margin"
          value={`${(data.summary.avgMargin || 0).toFixed(1)}%`}
          icon={TrendingUp}
          variant="primary"
        />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">
            Top Profit Vehicles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={data.vehicles.slice(0, 8).map((v: any) => ({
                name: `${v.make} ${v.model}`.slice(0, 16),
                profit: v.profit,
              }))}
              margin={{ left: 0, right: 16 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: "#475569" }}
                angle={-15}
                textAnchor="end"
                height={60}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{ fontSize: "12px", borderRadius: "6px" }}
                formatter={(v: any) => formatCurrency(v)}
              />
              <Bar dataKey="profit" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">
            Vehicle Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto thin-scroll">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#F9FAFB] hover:bg-[#F9FAFB]">
                  <TableHead>VIN / Vehicle</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Charge</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-right">Profit</TableHead>
                  <TableHead className="text-right">Margin</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.vehicles.map((v: any) => (
                  <TableRow key={v.id} className="hover:bg-[#F9FAFB]">
                    <TableCell>
                      <div className="font-medium text-sm">
                        {v.make} {v.model} ({v.year})
                      </div>
                      <div className="text-xs text-[#6B7280] font-mono">
                        {v.vin}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-[#4B5563]">
                      {v.customerName}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={v.status} />
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-[#92730E]">
                      {formatCurrency(v.customerCharge)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-[#DC2626]">
                      {formatCurrency(v.companyCost)}
                    </TableCell>
                    <TableCell
                      className={`text-right font-mono text-sm font-semibold ${
                        v.profit >= 0 ? "text-[#92730E]" : "text-[#DC2626]"
                      }`}
                    >
                      {formatCurrency(v.profit)}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      <span
                        className={
                          v.margin >= 0
                            ? "text-[#92730E]"
                            : "text-[#DC2626]"
                        }
                      >
                        {(v.margin || 0).toFixed(1)}%
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AgedReceivablesReport() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reports/aged-receivables")
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, []);

  const handleExcel = async () => {
    if (!data) return;
    await exportToExcel({
      filename: "Aged_Receivables_Report",
      sheetName: "Aged Receivables",
      title: "Aged Receivables Report",
      columns: [
        { header: "Ledger", key: "ledgerName", width: 28 },
        { header: "Customer", key: "customerName", width: 22 },
        { header: "Type", key: "type", width: 14 },
        { header: "Balance", key: "balance", width: 14 },
        { header: "Days", key: "daysOutstanding", width: 10 },
        { header: "Last Updated", key: "lastUpdated", width: 14 },
      ],
      rows: data.rows.map((r: any) => ({
        ...r,
        type: r.isReceivable ? "Receivable" : "Payable",
        lastUpdated: formatDate(r.lastUpdated),
      })),
      totals: [
        { label: "Total Receivable", value: formatCurrency(data.totalReceivable) },
        { label: "Total Payable", value: formatCurrency(data.totalPayable) },
      ],
    });
  };

  const handlePdf = () => {
    if (!data) return;
    generateReportPdf({
      title: "Aged Receivables Report",
      summary: [
        { label: "Items", value: String(data.count) },
        { label: "Receivable", value: formatCurrency(data.totalReceivable) },
        { label: "Payable", value: formatCurrency(data.totalPayable) },
        { label: "Net", value: formatCurrency(data.totalReceivable - data.totalPayable) },
      ],
      head: ["Ledger", "Customer", "Type", "Balance", "Days"],
      body: data.rows.map((r: any) => [
        r.ledgerName,
        r.customerName,
        r.isReceivable ? "Receivable" : "Payable",
        formatCurrency(r.balance),
        String(r.daysOutstanding),
      ]),
    });
  };

  if (loading) return <div className="h-32 bg-white rounded-xl border animate-pulse" />;
  if (!data) return null;

  const buckets = data.buckets || {};
  const bucketData = [
    { name: "Current", value: buckets.current || 0 },
    { name: "1-30d", value: buckets["1-30"] || 0 },
    { name: "31-60d", value: buckets["31-60"] || 0 },
    { name: "61-90d", value: buckets["61-90"] || 0 },
    { name: "90+d", value: buckets["90+"] || 0 },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <ExportButtons onExcel={handleExcel} onPdf={handlePdf} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="Total Receivable"
          value={formatCurrency(data.totalReceivable)}
          icon={Clock}
          variant="success"
        />
        <KpiCard
          label="Total Payable"
          value={formatCurrency(data.totalPayable)}
          icon={Clock}
          variant="danger"
        />
        <KpiCard
          label="Items"
          value={data.count}
          icon={BarChart3}
        />
        <KpiCard
          label="Net"
          value={formatCurrency(data.totalReceivable - data.totalPayable)}
          icon={DollarSign}
          variant="primary"
        />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">
            Aging Buckets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={bucketData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#475569" }} />
              <YAxis
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{ fontSize: "12px", borderRadius: "6px" }}
                formatter={(v: any) => formatCurrency(v)}
              />
              <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">
            Outstanding Balances
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto thin-scroll">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#F9FAFB] hover:bg-[#F9FAFB]">
                  <TableHead>Ledger</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead className="text-right">Days</TableHead>
                  <TableHead>Last Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.rows.map((r: any) => (
                  <TableRow key={r.id} className="hover:bg-[#F9FAFB]">
                    <TableCell className="text-sm font-medium">
                      {r.ledgerName}
                    </TableCell>
                    <TableCell className="text-sm text-[#4B5563]">
                      {r.customerName}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium ${
                          r.isReceivable
                            ? "bg-[#DC2626]/10 text-[#991B1B] border-[#DC2626]/30"
                            : "bg-[#D4AF37]/10 text-[#92730E] border-[#D4AF37]/30"
                        }`}
                      >
                        {r.isReceivable ? "Receivable" : "Payable"}
                      </span>
                    </TableCell>
                    <TableCell
                      className={`text-right font-mono text-sm font-semibold ${
                        r.isReceivable ? "text-[#DC2626]" : "text-[#92730E]"
                      }`}
                    >
                      {formatCurrency(Math.abs(r.balance))}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {r.daysOutstanding}
                    </TableCell>
                    <TableCell className="text-xs text-[#6B7280]">
                      {formatDate(r.lastUpdated)}
                    </TableCell>
                  </TableRow>
                ))}
                {data.rows.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-sm text-[#9CA3AF] py-8"
                    >
                      No outstanding balances
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
