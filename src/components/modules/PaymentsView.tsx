"use client";

import { useEffect, useState, useCallback } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { KpiCard } from "@/components/shared/KpiCard";
import { ExportButtons } from "@/components/shared/ExportButtons";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import {
  CreditCard,
  Plus,
  Search,
  Trash2,
  DollarSign,
  Wallet,
  Receipt,
  TrendingUp,
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
import { toast } from "sonner";
import {
  formatCurrency,
  formatDateTime,
  PAYMENT_METHODS,
} from "@/lib/types";
import { exportToExcel } from "@/lib/excel";

interface Payment {
  id: string;
  amount: number;
  method: string;
  referenceNo?: string;
  notes?: string;
  createdAt: string;
  customer?: { name: string };
  vehicle?: { vin: string; make: string; model: string } | null;
  customerId: string;
  vehicleId?: string | null;
}

export function PaymentsView() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [pRes, cRes, vRes] = await Promise.all([
        fetch("/api/payments"),
        fetch("/api/customers"),
        fetch("/api/vehicles"),
      ]);
      if (!pRes.ok || !cRes.ok || !vRes.ok)
        throw new Error("Failed to load payments");
      const p = await pRes.json();
      const c = await cRes.json();
      const v = await vRes.json();
      setPayments(p);
      setCustomers(c);
      setVehicles(v);
    } catch (e) {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = payments.filter((p) => {
    const s = search.toLowerCase();
    return (
      !s ||
      (p.customer?.name || "").toLowerCase().includes(s) ||
      (p.vehicle?.vin || "").toLowerCase().includes(s) ||
      (p.referenceNo || "").toLowerCase().includes(s) ||
      p.method.toLowerCase().includes(s)
    );
  });

  const total = filtered.reduce((s, p) => s + p.amount, 0);
  const byMethod = filtered.reduce((acc, p) => {
    acc[p.method] = (acc[p.method] || 0) + p.amount;
    return acc;
  }, {} as Record<string, number>);

  const handleExcel = async () => {
    await exportToExcel({
      filename: `Payments_${new Date().toISOString().slice(0, 10)}`,
      sheetName: "Payments",
      title: "Payments Export",
      columns: [
        { header: "Date", key: "createdAt", width: 22 },
        { header: "Customer", key: "customerName", width: 22 },
        { header: "Vehicle VIN", key: "vehicleVin", width: 22 },
        { header: "Method", key: "method", width: 14 },
        { header: "Reference", key: "referenceNo", width: 18 },
        { header: "Amount", key: "amount", width: 14 },
      ],
      rows: filtered.map((p) => ({
        createdAt: formatDateTime(p.createdAt),
        customerName: p.customer?.name || "—",
        vehicleVin: p.vehicle?.vin || "—",
        method: p.method,
        referenceNo: p.referenceNo || "—",
        amount: p.amount,
      })),
      totals: [{ label: "Total Payments", value: formatCurrency(total) }],
    });
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Payments"
        subtitle="Record payments received against vehicles & customer accounts"
        icon={CreditCard}
        actions={
          <>
            <ExportButtons onExcel={handleExcel} />
            <Button
              size="sm"
              className="gap-1.5"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Record Payment
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="Total Received"
          value={formatCurrency(total)}
          icon={Wallet}
          variant="success"
        />
        <KpiCard
          label="Payments Count"
          value={filtered.length}
          icon={Receipt}
        />
        <KpiCard
          label="Avg Payment"
          value={formatCurrency(filtered.length ? total / filtered.length : 0)}
          icon={DollarSign}
        />
        <KpiCard
          label="By Bank Transfer"
          value={formatCurrency(byMethod["Bank Transfer"] || 0)}
          icon={TrendingUp}
        />
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
        <Input
          placeholder="Search by customer, vehicle VIN, reference, or method…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="rounded-xl border border-[#E5E7EB] bg-white overflow-hidden">
        {loading ? (
          <TableSkeleton rows={6} />
        ) : error ? (
          <ErrorState onRetry={load} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={CreditCard}
            title="No payments recorded"
            description="Start recording payments received from customers against their vehicles or accounts."
            action={
              <Button
                size="sm"
                className="gap-1.5"
                onClick={() => setDialogOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Record Payment
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto thin-scroll">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#F9FAFB] hover:bg-[#F9FAFB]">
                  <TableHead className="w-[60px]"></TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={p.id} className="hover:bg-[#F9FAFB]">
                    <TableCell>
                      <div className="h-8 w-8 rounded-md bg-[#D4AF37]/15 flex items-center justify-center">
                        <CreditCard className="h-3.5 w-3.5 text-[#92730E]" />
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-[#4B5563]">
                      {formatDateTime(p.createdAt)}
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      {p.customer?.name || "—"}
                    </TableCell>
                    <TableCell className="text-xs text-[#6B7280] font-mono">
                      {p.vehicle?.vin ? (
                        <>
                          {p.vehicle.vin}
                          <div className="text-[10px] text-[#9CA3AF]">
                            {p.vehicle.make} {p.vehicle.model}
                          </div>
                        </>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md border border-[#E5E7EB] bg-[#F9FAFB] text-xs font-medium">
                        {p.method}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-[#6B7280] font-mono">
                      {p.referenceNo || "—"}
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold text-[#92730E]">
                      {formatCurrency(p.amount)}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-[#DC2626]"
                        onClick={async () => {
                          if (!confirm("Delete this payment?")) return;
                          await fetch(`/api/payments/${p.id}`, {
                            method: "DELETE",
                          });
                          toast.success("Payment deleted");
                          load();
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <PaymentFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        customers={customers}
        vehicles={vehicles}
        onSuccess={load}
      />
    </div>
  );
}

function PaymentFormDialog({
  open,
  onOpenChange,
  customers,
  vehicles,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  customers: any[];
  vehicles: any[];
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    customerId: "",
    vehicleId: "",
    amount: 0,
    method: PAYMENT_METHODS[0] as string,
    referenceNo: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({
        customerId: customers[0]?.id || "",
        vehicleId: "",
        amount: 0,
        method: PAYMENT_METHODS[0],
        referenceNo: "",
        notes: "",
      });
    }
  }, [open, customers]);

  const customerVehicles = vehicles.filter(
    (v) => v.customerId === form.customerId
  );

  const submit = async () => {
    if (!form.customerId) {
      toast.error("Customer is required");
      return;
    }
    if (!form.amount || form.amount <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Payment recorded");
      onOpenChange(false);
      onSuccess();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label className="text-xs">Customer *</Label>
            <Select
              value={form.customerId}
              onValueChange={(v) =>
                setForm({ ...form, customerId: v, vehicleId: "" })
              }
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
            <Label className="text-xs">Vehicle (optional)</Label>
            <Select
              value={form.vehicleId}
              onValueChange={(v) =>
                setForm({ ...form, vehicleId: v === "none" ? "" : v })
              }
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="None — account-level payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No specific vehicle</SelectItem>
                {customerVehicles.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.vin} — {v.make} {v.model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Amount *</Label>
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
          <div>
            <Label className="text-xs">Notes</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
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
            {saving ? "Saving…" : "Record Payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
