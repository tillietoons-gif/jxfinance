"use client";

import { useEffect, useState, useCallback } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { ExportButtons } from "@/components/shared/ExportButtons";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { TypeBadge } from "@/components/shared/StatusBadge";
import {
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  ChevronRight,
  Building2,
  User,
  FileText,
  ArrowDownCircle,
  ArrowUpCircle,
  Wallet,
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
import { toast } from "sonner";
import { formatCurrency, formatDateTime, LEDGER_TYPES } from "@/lib/types";
import { exportToExcel } from "@/lib/excel";
import { generateLedgerStatementPdf } from "@/lib/pdf";

interface Ledger {
  id: string;
  name: string;
  type: string;
  balance: number;
  customerId?: string;
  customer?: { name: string };
  _count?: { transactions: number };
  transactions?: any[];
  updatedAt: string;
}

export function LedgersView() {
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Ledger | null>(null);
  const [detailLedger, setDetailLedger] = useState<Ledger | null>(null);
  const [detailData, setDetailData] = useState<any>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [lRes, cRes] = await Promise.all([
        fetch("/api/ledgers"),
        fetch("/api/customers"),
      ]);
      if (!lRes.ok || !cRes.ok) throw new Error("Failed to load ledgers");
      const l = await lRes.json();
      const c = await cRes.json();
      setLedgers(l);
      setCustomers(c);
    } catch (e) {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openDetail = async (l: Ledger) => {
    setDetailLedger(l);
    const res = await fetch(`/api/ledgers/${l.id}`);
    const d = await res.json();
    setDetailData(d);
  };

  const refreshDetail = async () => {
    if (!detailLedger) return;
    const res = await fetch(`/api/ledgers/${detailLedger.id}`);
    const d = await res.json();
    setDetailData(d);
    load();
  };

  const filtered = ledgers.filter(
    (l) => typeFilter === "all" || l.type === typeFilter
  );
  const totalCustomer = ledgers
    .filter((l) => l.type === "CUSTOMER")
    .reduce((s, l) => s + l.balance, 0);
  const totalCompany = ledgers
    .filter((l) => l.type === "COMPANY")
    .reduce((s, l) => s + l.balance, 0);
  const ledgerBalance = totalCustomer - totalCompany;

  const handleExcel = async () => {
    await exportToExcel({
      filename: `Ledgers_${new Date().toISOString().slice(0, 10)}`,
      sheetName: "Ledgers",
      title: "Ledger Directory",
      columns: [
        { header: "Name", key: "name", width: 28 },
        { header: "Type", key: "type", width: 12 },
        { header: "Customer", key: "customerName", width: 22 },
        { header: "Balance", key: "balance", width: 16 },
        { header: "Transactions", key: "txCount", width: 14 },
        { header: "Updated", key: "updatedAt", width: 22 },
      ],
      rows: filtered.map((l) => ({
        ...l,
        customerName: l.customer?.name || "—",
        txCount: l._count?.transactions || 0,
        updatedAt: formatDateTime(l.updatedAt),
      })),
      totals: [
        {
          label: "Customer Ledgers Total",
          value: formatCurrency(totalCustomer),
        },
        {
          label: "Company Ledgers Total",
          value: formatCurrency(totalCompany),
        },
      ],
    });
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Ledgers"
        subtitle="Dual-ledger accounting for customers & company"
        icon={BookOpen}
        actions={
          <>
            <ExportButtons
              onExcel={handleExcel}
              onPdf={
                detailData
                  ? () => generateLedgerStatementPdf(detailData)
                  : undefined
              }
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
              Add Ledger
            </Button>
          </>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        <div className="rounded-lg border border-[#D4AF37]/30 bg-violet-50 p-4">
          <div className="flex items-center gap-2 mb-1">
            <User className="h-4 w-4 text-[#92730E]" />
            <p className="text-xs uppercase tracking-wider font-semibold text-[#92730E]">
              Customer Ledgers
            </p>
          </div>
          <p className="text-xl font-bold text-violet-900">
            {formatCurrency(totalCustomer)}
          </p>
          <p className="text-[10px] text-violet-600 mt-0.5">
            Net customer balance
          </p>
        </div>
        <div className="rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-4">
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="h-4 w-4 text-[#374151]" />
            <p className="text-xs uppercase tracking-wider font-semibold text-[#374151]">
              Company Ledgers
            </p>
          </div>
          <p className="text-xl font-bold text-black">
            {formatCurrency(totalCompany)}
          </p>
          <p className="text-[10px] text-[#6B7280] mt-0.5">Net company balance</p>
        </div>
        <div className="rounded-lg border border-[#D4AF37]/30 bg-[#D4AF37]/10 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="h-4 w-4 text-[#92730E]" />
            <p className="text-xs uppercase tracking-wider font-semibold text-[#92730E]">
              Receivables (A/R)
            </p>
          </div>
          <p className="text-xl font-bold text-[#92730E]">
            {formatCurrency(
              ledgers
                .filter((l) => l.balance > 0)
                .reduce((s, l) => s + l.balance, 0)
            )}
          </p>
          <p className="text-[10px] text-[#92730E] mt-0.5">
            Outstanding from customers
          </p>
        </div>
        <div className="rounded-lg border border-[#111827]/15 bg-[#111827] p-4 text-white">
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="h-4 w-4 text-[#D4AF37]" />
            <p className="text-xs uppercase tracking-wider font-semibold text-[#D4AF37]">
              Balance
            </p>
          </div>
          <p className="text-xl font-bold">
            {formatCurrency(ledgerBalance)}
          </p>
          <p className="text-[10px] text-white/70 mt-0.5">
            Customers total minus company total
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {LEDGER_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t.charAt(0) + t.slice(1).toLowerCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border border-[#E5E7EB] bg-white overflow-hidden">
        {loading ? (
          <TableSkeleton rows={6} />
        ) : error ? (
          <ErrorState onRetry={load} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No ledgers yet"
            description="Customer ledgers are created automatically. Company ledgers can be added manually."
          />
        ) : (
          <div className="overflow-x-auto thin-scroll">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#F9FAFB] hover:bg-[#F9FAFB]">
                  <TableHead className="w-[60px]"></TableHead>
                  <TableHead>Ledger Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead className="text-center">Transactions</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((l) => (
                  <TableRow
                    key={l.id}
                    className="cursor-pointer hover:bg-[#F9FAFB]"
                    onClick={() => openDetail(l)}
                  >
                    <TableCell>
                      <div
                        className={`h-8 w-8 rounded-md flex items-center justify-center ${
                          l.type === "CUSTOMER"
                            ? "bg-[#D4AF37]/15"
                            : "bg-[#F3F4F6]"
                        }`}
                      >
                        {l.type === "CUSTOMER" ? (
                          <User className="h-3.5 w-3.5 text-[#92730E]" />
                        ) : (
                          <Building2 className="h-3.5 w-3.5 text-[#374151]" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-sm">{l.name}</div>
                      <div className="text-xs text-[#6B7280]">
                        Updated {formatDateTime(l.updatedAt)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <TypeBadge type={l.type} />
                    </TableCell>
                    <TableCell className="text-sm text-[#4B5563]">
                      {l.customer?.name || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={`text-sm font-mono font-semibold ${
                          l.balance > 0
                            ? "text-[#DC2626]"
                            : l.balance < 0
                            ? "text-[#92730E]"
                            : "text-[#374151]"
                        }`}
                      >
                        {formatCurrency(l.balance)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center text-sm text-[#4B5563]">
                      {l._count?.transactions || 0}
                    </TableCell>
                    <TableCell>
                      <ChevronRight className="h-4 w-4 text-[#9CA3AF]" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <LedgerFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        customers={customers}
        onSuccess={load}
      />

      {/* Detail Sheet */}
      <Sheet
        open={!!detailLedger}
        onOpenChange={(o) => {
          if (!o) {
            setDetailLedger(null);
            setDetailData(null);
          }
        }}
      >
        <SheetContent
          side="right"
          className="w-full sm:max-w-2xl p-0 overflow-y-auto thin-scroll"
        >
          <SheetHeader className="px-5 py-4 border-b border-[#E5E7EB] bg-white sticky top-0 z-10">
            <SheetTitle className="text-base">{detailLedger?.name}</SheetTitle>
            <div className="flex items-center gap-3 text-xs">
              <TypeBadge type={detailLedger?.type || "CUSTOMER"} />
              <span className="text-[#6B7280]">
                Balance:{" "}
                <span className="font-semibold">
                  {formatCurrency(detailData?.balance || 0)}
                </span>
              </span>
            </div>
          </SheetHeader>

          {detailData ? (
            <LedgerDetail
              ledger={detailData}
              onChanged={refreshDetail}
            />
          ) : (
            <div className="p-6 space-y-3">
              <div className="h-4 w-1/3 bg-[#F3F4F6] rounded animate-pulse" />
              <div className="h-4 w-2/3 bg-[#F3F4F6] rounded animate-pulse" />
              <div className="h-4 w-1/2 bg-[#F3F4F6] rounded animate-pulse" />
              <div className="h-4 w-3/4 bg-[#F3F4F6] rounded animate-pulse" />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function LedgerDetail({
  ledger,
  onChanged,
}: {
  ledger: any;
  onChanged: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    amount: 0,
    type: "DEBIT",
    description: "",
  });
  const [saving, setSaving] = useState(false);
  const [editingTx, setEditingTx] = useState<any>(null);

  const submit = async () => {
    if (!form.amount || form.amount <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }
    setSaving(true);
    try {
      const url = editingTx
        ? `/api/ledgers/${ledger.id}/transactions/${editingTx.id}`
        : `/api/ledgers/${ledger.id}/transactions`;
      const method = editingTx ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success(editingTx ? "Transaction updated" : "Transaction added");
      setForm({ amount: 0, type: "DEBIT", description: "" });
      setEditingTx(null);
      setShowForm(false);
      onChanged();
    } finally {
      setSaving(false);
    }
  };

  const openAdd = () => {
    setEditingTx(null);
    setForm({ amount: 0, type: "DEBIT", description: "" });
    setShowForm(true);
  };

  const openEdit = (tx: any) => {
    setEditingTx(tx);
    setForm({
      amount: tx.amount,
      type: tx.type,
      description: tx.description,
    });
    setShowForm(true);
  };

  // compute running balance (newest first)
  const txs = ledger.transactions || [];
  const withRunning: any[] = [];
  let running = ledger.balance;
  for (const t of txs) {
    withRunning.push({ ...t, runningBalance: running });
    running = t.type === "DEBIT" ? running - t.amount : running + t.amount;
  }

  return (
    <div className="px-5 py-4 space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-xs text-[#6B7280]">
          {txs.length} transaction(s) •{" "}
          {formatCurrency(ledger.balance)} current balance
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => generateLedgerStatementPdf(ledger)}
          >
            <FileText className="h-3.5 w-3.5" />
            Statement PDF
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={openAdd}
          >
            <Plus className="h-3.5 w-3.5" />
            Add Transaction
          </Button>
        </div>
      </div>

      {showForm && (
        <div className="rounded-lg border border-[#E5E7EB] p-3 space-y-2 bg-[#F9FAFB]">
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
              <Label className="text-xs">Type</Label>
              <Select
                value={form.type}
                onValueChange={(v) => setForm({ ...form, type: v })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DEBIT">DEBIT (_increase owed_)</SelectItem>
                  <SelectItem value="CREDIT">
                    CREDIT (_decrease owed_)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs">Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="mt-1"
              rows={2}
              placeholder="e.g., Customs charge, Payment received, Adjustments…"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowForm(false);
                setEditingTx(null);
              }}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={submit} disabled={saving}>
              {saving ? "Saving…" : editingTx ? "Update" : "Add"}
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-md border border-[#E5E7EB] divide-y divide-[#F3F4F6]">
        {withRunning.map((t) => (
          <div key={t.id} className="p-3 hover:bg-[#F9FAFB]">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2.5 min-w-0">
                <div
                  className={`h-7 w-7 rounded-md flex items-center justify-center shrink-0 ${
                    t.type === "DEBIT"
                      ? "bg-[#DC2626]/15"
                      : "bg-[#D4AF37]/15"
                  }`}
                >
                  {t.type === "DEBIT" ? (
                    <ArrowUpCircle className="h-3.5 w-3.5 text-[#991B1B]" />
                  ) : (
                    <ArrowDownCircle className="h-3.5 w-3.5 text-[#92730E]" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {t.description}
                  </p>
                  <p className="text-xs text-[#6B7280]">
                    {formatDateTime(t.createdAt)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p
                  className={`text-sm font-mono font-semibold ${
                    t.type === "DEBIT" ? "text-[#DC2626]" : "text-[#92730E]"
                  }`}
                >
                  {t.type === "DEBIT" ? "+" : "−"}
                  {formatCurrency(t.amount)}
                </p>
                <p className="text-[10px] text-[#9CA3AF] font-mono">
                  Bal: {formatCurrency(t.runningBalance)}
                </p>
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  onClick={() => openEdit(t)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 text-[#DC2626]"
                  onClick={async () => {
                    if (!confirm("Delete this transaction?")) return;
                    await fetch(
                      `/api/ledgers/${ledger.id}/transactions/${t.id}`,
                      { method: "DELETE" }
                    );
                    toast.success("Transaction deleted");
                    onChanged();
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ))}
        {txs.length === 0 && (
          <div className="p-6 text-center text-sm text-[#9CA3AF]">
            No transactions yet
          </div>
        )}
      </div>
    </div>
  );
}

function LedgerFormDialog({
  open,
  onOpenChange,
  editing,
  customers,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing: Ledger | null;
  customers: any[];
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    name: "",
    type: "COMPANY" as string,
    customerId: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editing) {
      setForm({
        name: editing.name,
        type: editing.type,
        customerId: editing.customerId || "",
      });
    } else {
      setForm({
        name: "",
        type: "COMPANY",
        customerId: "",
      });
    }
  }, [editing, open]);

  const submit = async () => {
    if (!form.name) {
      toast.error("Ledger name is required");
      return;
    }
    setSaving(true);
    try {
      const url = editing ? `/api/ledgers/${editing.id}` : "/api/ledgers";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success(editing ? "Ledger updated" : "Ledger added");
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
          <DialogTitle>{editing ? "Edit Ledger" : "Add Ledger"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label className="text-xs">Name *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mt-1"
              placeholder="e.g., Operating Account, Main Cash Account"
            />
          </div>
          {!editing && (
            <>
              <div>
                <Label className="text-xs">Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => setForm({ ...form, type: v })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COMPANY">Company Ledger</SelectItem>
                    <SelectItem value="CUSTOMER">Customer Ledger</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.type === "CUSTOMER" && (
                <div>
                  <Label className="text-xs">Customer</Label>
                  <Select
                    value={form.customerId}
                    onValueChange={(v) =>
                      setForm({ ...form, customerId: v })
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
              )}
            </>
          )}
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
            {saving ? "Saving…" : editing ? "Update" : "Add Ledger"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
