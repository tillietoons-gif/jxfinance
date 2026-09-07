"use client";

import { useEffect, useState, useCallback } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { KpiCard } from "@/components/shared/KpiCard";
import { ExportButtons } from "@/components/shared/ExportButtons";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  Car,
  Plus,
  Search,
  Pencil,
  Trash2,
  ChevronRight,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Package,
  FileText,
  CreditCard,
  Receipt,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  formatCurrency,
  formatDate,
  VEHICLE_STATUSES,
  PAYMENT_METHODS,
} from "@/lib/types";
import { exportToExcel } from "@/lib/excel";
import { generateVehicleStatementPdf } from "@/lib/pdf";
import { VehicleDetailExpenses } from "./VehicleDetailExpenses";

interface Vehicle {
  id: string;
  vin: string;
  make: string;
  model: string;
  year: number;
  destination: string;
  status: string;
  notes?: string;
  customer?: { id: string; name: string };
  customerId: string;
  expenses: any[];
  totalCharge: number;
  totalCost: number;
  profit: number;
  _count?: { payments: number; invoices: number };
  createdAt: string;
}

interface Customer {
  id: string;
  name: string;
}

export function VehiclesView() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [detailVehicle, setDetailVehicle] = useState<Vehicle | null>(null);
  const [detailData, setDetailData] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [vRes, cRes] = await Promise.all([
      fetch("/api/vehicles"),
      fetch("/api/customers"),
    ]);
    const v = await vRes.json();
    const c = await cRes.json();
    setVehicles(v);
    setCustomers(c);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openDetail = async (v: Vehicle) => {
    setDetailVehicle(v);
    setDetailLoading(true);
    const res = await fetch(`/api/vehicles/${v.id}`);
    const d = await res.json();
    setDetailData(d);
    setDetailLoading(false);
  };

  const refreshDetail = async () => {
    if (!detailVehicle) return;
    const res = await fetch(`/api/vehicles/${detailVehicle.id}`);
    const d = await res.json();
    setDetailData(d);
    await load();
  };

  const filtered = vehicles.filter((v) => {
    const s = search.toLowerCase();
    const matchSearch =
      !s ||
      v.vin.toLowerCase().includes(s) ||
      `${v.make} ${v.model}`.toLowerCase().includes(s) ||
      v.destination.toLowerCase().includes(s) ||
      v.customer?.name.toLowerCase().includes(s);
    const matchStatus = statusFilter === "all" || v.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalProfit = filtered.reduce((s, v) => s + v.profit, 0);
  const totalCharge = filtered.reduce((s, v) => s + v.totalCharge, 0);
  const totalCost = filtered.reduce((s, v) => s + v.totalCost, 0);

  const handleExportExcel = async () => {
    await exportToExcel({
      filename: `Vehicles_${new Date().toISOString().slice(0, 10)}`,
      sheetName: "Vehicles",
      title: "Vehicle Fleet Export",
      subtitle: `Generated ${new Date().toLocaleString()}`,
      columns: [
        { header: "VIN", key: "vin", width: 22 },
        { header: "Make", key: "make", width: 14 },
        { header: "Model", key: "model", width: 18 },
        { header: "Year", key: "year", width: 8 },
        { header: "Customer", key: "customerName", width: 22 },
        { header: "Destination", key: "destination", width: 20 },
        { header: "Status", key: "status", width: 14 },
        { header: "Customer Charge", key: "totalCharge", width: 16 },
        { header: "Company Cost", key: "totalCost", width: 16 },
        { header: "Profit", key: "profit", width: 14 },
        { header: "Created", key: "createdAt", width: 14 },
      ],
      rows: filtered.map((v) => ({
        ...v,
        customerName: v.customer?.name || "",
        createdAt: formatDate(v.createdAt),
      })),
      totals: [
        { label: "Total Charge", value: formatCurrency(totalCharge) },
        { label: "Total Cost", value: formatCurrency(totalCost) },
        { label: "Total Profit", value: formatCurrency(totalProfit) },
      ],
    });
  };

  const handleExportPdf = () => {
    if (!detailData) {
      toast.info("Open a vehicle to export its statement as PDF");
      return;
    }
    generateVehicleStatementPdf(detailData);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Vehicles"
        subtitle="Track vehicle shipments, expenses, and profit per unit"
        icon={Car}
        actions={
          <>
            <ExportButtons
              onExcel={handleExportExcel}
              onPdf={detailData ? handleExportPdf : undefined}
              pdfLabel="Statement PDF"
            />
            <Button
              size="sm"
              className="gap-1.5"
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Add Vehicle
            </Button>
          </>
        }
      />

      {/* KPI Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="Total Vehicles"
          value={vehicles.length}
          icon={Package}
        />
        <KpiCard
          label="Total Charges"
          value={formatCurrency(totalCharge)}
          icon={DollarSign}
          variant="success"
        />
        <KpiCard
          label="Total Costs"
          value={formatCurrency(totalCost)}
          icon={TrendingDown}
          variant="danger"
        />
        <KpiCard
          label="Net Profit"
          value={formatCurrency(totalProfit)}
          icon={TrendingUp}
          variant="primary"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search VIN, make, model, customer…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {VEHICLE_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            icon={Car}
            title="No vehicles yet"
            description="Add your first vehicle shipment to start tracking expenses and profit margins."
            action={
              <Button
                size="sm"
                className="gap-1.5"
                onClick={() => {
                  setEditing(null);
                  setDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4" />
                Add Vehicle
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto thin-scroll">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead className="w-[60px]"></TableHead>
                  <TableHead>VIN / Vehicle</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Charge</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-right">Profit</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((v) => (
                  <TableRow
                    key={v.id}
                    className="cursor-pointer hover:bg-slate-50"
                    onClick={() => openDetail(v)}
                  >
                    <TableCell>
                      <div className="h-8 w-8 rounded-md bg-slate-100 flex items-center justify-center">
                        <Car className="h-3.5 w-3.5 text-slate-500" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-sm">
                        {v.make} {v.model}{" "}
                        <span className="text-slate-400">({v.year})</span>
                      </div>
                      <div className="text-xs text-slate-500 font-mono">
                        {v.vin}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {v.customer?.name || "—"}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {v.destination || "—"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={v.status} />
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatCurrency(v.totalCharge)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-rose-600">
                      {formatCurrency(v.totalCost)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm font-semibold text-emerald-700">
                      {formatCurrency(v.profit)}
                    </TableCell>
                    <TableCell>
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <VehicleFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        customers={customers}
        onSuccess={load}
      />

      {/* Detail Sheet */}
      <Sheet
        open={!!detailVehicle}
        onOpenChange={(o) => {
          if (!o) {
            setDetailVehicle(null);
            setDetailData(null);
          }
        }}
      >
        <SheetContent
          side="right"
          className="w-full sm:max-w-3xl p-0 overflow-y-auto thin-scroll"
        >
          <SheetHeader className="px-5 py-4 border-b border-slate-200 bg-white sticky top-0 z-10">
            <SheetTitle className="text-base">
              {detailVehicle
                ? `${detailVehicle.make} ${detailVehicle.model} (${detailVehicle.year})`
                : ""}
            </SheetTitle>
            <p className="text-xs text-slate-500 font-mono">
              {detailVehicle?.vin}
            </p>
          </SheetHeader>

          {detailLoading || !detailData ? (
            <div className="p-8 text-center text-sm text-slate-400">
              Loading…
            </div>
          ) : (
            <div className="px-5 py-4 space-y-4">
              {/* Quick stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-slate-200 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                    Customer Charge
                  </p>
                  <p className="text-lg font-bold text-slate-900">
                    {formatCurrency(detailData.totalCharge)}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                    Company Cost
                  </p>
                  <p className="text-lg font-bold text-rose-700">
                    {formatCurrency(detailData.totalCost)}
                  </p>
                </div>
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-emerald-700 font-semibold">
                    Net Profit
                  </p>
                  <p className="text-lg font-bold text-emerald-800">
                    {formatCurrency(detailData.profit)}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                    Margin / Payments
                  </p>
                  <p className="text-lg font-bold text-slate-900">
                    {(detailData.margin || 0).toFixed(1)}%
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {formatCurrency(detailData.paymentsReceived)} received
                  </p>
                </div>
              </div>

              {/* Action toolbar */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => generateVehicleStatementPdf(detailData)}
                >
                  <FileText className="h-3.5 w-3.5" />
                  Statement PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => {
                    setEditing(detailData);
                    setDetailVehicle(null);
                    setDialogOpen(true);
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit Vehicle
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-rose-600 hover:text-rose-700"
                  onClick={async () => {
                    if (
                      !confirm(
                        `Delete vehicle ${detailData.vin}? This will also delete related expenses.`
                      )
                    )
                      return;
                    await fetch(`/api/vehicles/${detailData.id}`, {
                      method: "DELETE",
                    });
                    toast.success("Vehicle deleted");
                    setDetailVehicle(null);
                    setDetailData(null);
                    load();
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </Button>
              </div>

              {/* Tabs */}
              <Tabs defaultValue="expenses">
                <TabsList className="grid grid-cols-4 w-full">
                  <TabsTrigger value="expenses">Expenses</TabsTrigger>
                  <TabsTrigger value="payments">Payments</TabsTrigger>
                  <TabsTrigger value="invoices">Invoices</TabsTrigger>
                  <TabsTrigger value="profit">Profit</TabsTrigger>
                </TabsList>

                <TabsContent value="expenses" className="mt-3">
                  <VehicleDetailExpenses
                    vehicle={detailData}
                    onChanged={refreshDetail}
                  />
                </TabsContent>

                <TabsContent value="payments" className="mt-3">
                  <VehiclePaymentsTab
                    vehicle={detailData}
                    onChanged={refreshDetail}
                  />
                </TabsContent>

                <TabsContent value="invoices" className="mt-3">
                  <VehicleInvoicesTab vehicle={detailData} />
                </TabsContent>

                <TabsContent value="profit" className="mt-3">
                  <VehicleProfitTab vehicle={detailData} />
                </TabsContent>
              </Tabs>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

// --- Vehicle Form Dialog ---
function VehicleFormDialog({
  open,
  onOpenChange,
  editing,
  customers,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing: Vehicle | null;
  customers: Customer[];
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    vin: "",
    make: "",
    model: "",
    year: new Date().getFullYear(),
    destination: "",
    status: "PENDING",
    notes: "",
    customerId: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editing) {
      setForm({
        vin: editing.vin,
        make: editing.make,
        model: editing.model,
        year: editing.year,
        destination: editing.destination,
        status: editing.status,
        notes: editing.notes || "",
        customerId: editing.customerId,
      });
    } else {
      setForm({
        vin: "",
        make: "",
        model: "",
        year: new Date().getFullYear(),
        destination: "",
        status: "PENDING",
        notes: "",
        customerId: customers[0]?.id || "",
      });
    }
  }, [editing, customers, open]);

  const submit = async () => {
    if (!form.vin || !form.make || !form.model || !form.customerId) {
      toast.error("VIN, Make, Model, and Customer are required");
      return;
    }
    setSaving(true);
    try {
      const url = editing
        ? `/api/vehicles/${editing.id}`
        : "/api/vehicles";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to save vehicle");
      toast.success(editing ? "Vehicle updated" : "Vehicle added");
      onOpenChange(false);
      onSuccess();
    } catch (e: any) {
      toast.error(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editing ? "Edit Vehicle" : "Add New Vehicle"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 py-2">
          <div className="col-span-2">
            <Label className="text-xs">VIN *</Label>
            <Input
              value={form.vin}
              onChange={(e) => setForm({ ...form, vin: e.target.value })}
              placeholder="1HGCM82633A001234"
              className="mt-1 font-mono"
            />
          </div>
          <div>
            <Label className="text-xs">Make *</Label>
            <Input
              value={form.make}
              onChange={(e) => setForm({ ...form, make: e.target.value })}
              placeholder="Toyota"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Model *</Label>
            <Input
              value={form.model}
              onChange={(e) => setForm({ ...form, model: e.target.value })}
              placeholder="Camry"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Year</Label>
            <Input
              type="number"
              value={form.year}
              onChange={(e) =>
                setForm({ ...form, year: Number(e.target.value) })
              }
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Destination</Label>
            <Input
              value={form.destination}
              onChange={(e) =>
                setForm({ ...form, destination: e.target.value })
              }
              placeholder="Lagos, Nigeria"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Customer *</Label>
            <Select
              value={form.customerId}
              onValueChange={(v) => setForm({ ...form, customerId: v })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select customer" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Status</Label>
            <Select
              value={form.status}
              onValueChange={(v) => setForm({ ...form, status: v })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VEHICLE_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <Label className="text-xs">Notes</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Any shipment notes…"
              className="mt-1"
              rows={2}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Saving…" : editing ? "Update" : "Add Vehicle"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// --- Payments Tab ---
function VehiclePaymentsTab({
  vehicle,
  onChanged,
}: {
  vehicle: any;
  onChanged: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    amount: 0,
    method: PAYMENT_METHODS[0] as string,
    referenceNo: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!form.amount || form.amount <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          customerId: vehicle.customerId,
          vehicleId: vehicle.id,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Payment recorded");
      setForm({
        amount: 0,
        method: PAYMENT_METHODS[0] as string,
        referenceNo: "",
        notes: "",
      });
      setShowForm(false);
      onChanged();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <p className="text-xs text-slate-500">
          {vehicle.payments?.length || 0} payment(s) •{" "}
          {formatCurrency(vehicle.paymentsReceived)} received
        </p>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          onClick={() => setShowForm((s) => !s)}
        >
          <Plus className="h-3.5 w-3.5" />
          Record Payment
        </Button>
      </div>

      {showForm && (
        <div className="rounded-lg border border-slate-200 p-3 space-y-2 bg-slate-50">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Amount</Label>
              <Input
                type="number"
                value={form.amount || ""}
                onChange={(e) =>
                  setForm({ ...form, amount: Number(e.target.value) })
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Method</Label>
              <Select
                value={form.method}
                onValueChange={(v) => setForm({ ...form, method: v })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs">Reference No.</Label>
            <Input
              value={form.referenceNo}
              onChange={(e) =>
                setForm({ ...form, referenceNo: e.target.value })
              }
              className="mt-1"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={submit} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-md border border-slate-200 divide-y divide-slate-100">
        {(vehicle.payments || []).map((p: any) => (
          <div
            key={p.id}
            className="flex items-center justify-between p-2.5 hover:bg-slate-50"
          >
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-md bg-emerald-100 flex items-center justify-center">
                <CreditCard className="h-3.5 w-3.5 text-emerald-700" />
              </div>
              <div>
                <p className="text-sm font-medium">{p.method}</p>
                <p className="text-xs text-slate-500">
                  {formatDate(p.createdAt)}
                  {p.referenceNo ? ` • Ref: ${p.referenceNo}` : ""}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-emerald-700">
                {formatCurrency(p.amount)}
              </span>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 text-rose-500"
                onClick={async () => {
                  if (!confirm("Delete payment?")) return;
                  await fetch(`/api/payments/${p.id}`, { method: "DELETE" });
                  toast.success("Payment deleted");
                  onChanged();
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
        {(vehicle.payments || []).length === 0 && (
          <div className="p-6 text-center text-sm text-slate-400">
            No payments recorded
          </div>
        )}
      </div>
    </div>
  );
}

// --- Invoices Tab ---
function VehicleInvoicesTab({ vehicle }: { vehicle: any }) {
  if (!vehicle.invoices || vehicle.invoices.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-slate-400">
        No invoices for this vehicle
      </div>
    );
  }
  return (
    <div className="rounded-md border border-slate-200 divide-y divide-slate-100">
      {vehicle.invoices.map((inv: any) => (
        <div
          key={inv.id}
          className="flex items-center justify-between p-2.5 hover:bg-slate-50"
        >
          <div>
            <p className="text-sm font-medium font-mono">{inv.invoiceNumber}</p>
            <p className="text-xs text-slate-500">
              Issued {formatDate(inv.issueDate)} • Due {formatDate(inv.dueDate)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{inv.status}</Badge>
            <span className="text-sm font-semibold">
              {formatCurrency(inv.total)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// --- Profit Tab ---
function VehicleProfitTab({ vehicle }: { vehicle: any }) {
  const rows = vehicle.expenses || [];
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3">
          <p className="text-[10px] uppercase tracking-wider text-emerald-700 font-semibold">
            Profit
          </p>
          <p className="text-base font-bold text-emerald-900">
            {formatCurrency(vehicle.profit)}
          </p>
        </div>
        <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
            Margin
          </p>
          <p className="text-base font-bold text-slate-900">
            {(vehicle.margin || 0).toFixed(2)}%
          </p>
        </div>
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
          <p className="text-[10px] uppercase tracking-wider text-amber-700 font-semibold">
            Outstanding
          </p>
          <p className="text-base font-bold text-amber-900">
            {formatCurrency(
              Math.max(vehicle.totalCharge - vehicle.paymentsReceived, 0)
            )}
          </p>
        </div>
      </div>

      <div className="rounded-md border border-slate-200 divide-y divide-slate-100">
        {rows.map((e: any) => (
          <div key={e.id} className="flex items-center justify-between p-2.5">
            <div className="text-sm">{e.title}</div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="text-emerald-700">+{formatCurrency(e.customerCharge)}</span>
              <span className="text-rose-600">−{formatCurrency(e.companyCost)}</span>
              <span className="font-semibold text-slate-900">
                {formatCurrency(e.profit)}
              </span>
            </div>
          </div>
        ))}
        {rows.length === 0 && (
          <div className="p-6 text-center text-sm text-slate-400">
            No expenses recorded
          </div>
        )}
      </div>
    </div>
  );
}
