"use client";

import { useEffect, useState, useCallback } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { ExportButtons } from "@/components/shared/ExportButtons";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import {
  Users,
  Plus,
  Search,
  Pencil,
  Trash2,
  Mail,
  Phone,
  Building2,
  MapPin,
  Car,
  FileText,
  CreditCard,
  Eye,
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { formatDate, formatCurrency } from "@/lib/types";
import { exportToExcel } from "@/lib/excel";
import { generateCustomerStatementPdf } from "@/lib/pdf";

interface Customer {
  id: string;
  name: string;
  companyName?: string;
  email?: string;
  phone?: string;
  address?: string;
  createdAt: string;
  _count?: { vehicles: number; invoices: number; payments: number };
}

export function CustomersView() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [detailCustomer, setDetailCustomer] = useState<Customer | null>(null);
  const [detailData, setDetailData] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/customers");
      if (!res.ok) throw new Error("Failed to load customers");
      const data = await res.json();
      setCustomers(data);
    } catch (e) {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openDetail = async (customer: Customer) => {
    setDetailCustomer(customer);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/customers/${customer.id}`);
      if (!res.ok) throw new Error("Failed to load customer details");
      setDetailData(await res.json());
    } catch (e: any) {
      toast.error(e?.message || "Failed to load customer details");
      setDetailCustomer(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const filtered = customers.filter((c) => {
    const s = search.toLowerCase();
    return (
      !s ||
      c.name.toLowerCase().includes(s) ||
      (c.companyName || "").toLowerCase().includes(s) ||
      (c.email || "").toLowerCase().includes(s) ||
      (c.phone || "").toLowerCase().includes(s)
    );
  });

  const handleExcel = async () => {
    await exportToExcel({
      filename: `Customers_${new Date().toISOString().slice(0, 10)}`,
      sheetName: "Customers",
      title: "Customer Directory",
      columns: [
        { header: "Name", key: "name", width: 22 },
        { header: "Company", key: "companyName", width: 22 },
        { header: "Email", key: "email", width: 28 },
        { header: "Phone", key: "phone", width: 16 },
        { header: "Address", key: "address", width: 32 },
        { header: "Vehicles", key: "vehicles", width: 10 },
        { header: "Invoices", key: "invoices", width: 10 },
        { header: "Payments", key: "payments", width: 10 },
        { header: "Created", key: "createdAt", width: 14 },
      ],
      rows: filtered.map((c) => ({
        ...c,
        companyName: c.companyName || "",
        email: c.email || "",
        phone: c.phone || "",
        address: c.address || "",
        vehicles: c._count?.vehicles || 0,
        invoices: c._count?.invoices || 0,
        payments: c._count?.payments || 0,
        createdAt: formatDate(c.createdAt),
      })),
    });
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Customers"
        subtitle="Manage client profiles and account relationships"
        icon={Users}
        actions={
          <>
            <ExportButtons onExcel={handleExcel} />
            <Button
              size="sm"
              className="gap-1.5"
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Add Customer
            </Button>
          </>
        }
      />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
        <Input
          placeholder="Search customers…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="rounded-xl border border-[#E5E7EB] bg-white">
          <TableSkeleton rows={6} />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-[#E5E7EB] bg-white">
          <ErrorState onRetry={load} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-[#E5E7EB] bg-white">
          <EmptyState
            icon={Users}
            title="No customers yet"
            description="Add your first customer to start tracking vehicles, expenses, and invoices."
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
                Add Customer
              </Button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <div
              key={c.id}
              className="rounded-xl border border-[#E5E7EB] bg-white p-4 hover:shadow-sm transition-shadow cursor-pointer"
              role="button"
              tabIndex={0}
              onClick={() => openDetail(c)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") openDetail(c);
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-[#374151] to-black text-white flex items-center justify-center text-sm font-semibold shrink-0">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{c.name}</p>
                    {c.companyName && (
                      <p className="text-xs text-[#6B7280] truncate">
                        {c.companyName}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditing(c);
                      setDialogOpen(true);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-[#DC2626]"
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (!confirm(`Delete ${c.name}?`)) return;
                      await fetch(`/api/customers/${c.id}`, {
                        method: "DELETE",
                      });
                      toast.success("Customer deleted");
                      load();
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="space-y-1.5 text-xs text-[#4B5563]">
                {c.email && (
                  <div className="flex items-center gap-1.5">
                    <Mail className="h-3 w-3 text-[#9CA3AF]" />
                    <span className="truncate">{c.email}</span>
                  </div>
                )}
                {c.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-3 w-3 text-[#9CA3AF]" />
                    <span>{c.phone}</span>
                  </div>
                )}
                {c.companyName && (
                  <div className="flex items-center gap-1.5">
                    <Building2 className="h-3 w-3 text-[#9CA3AF]" />
                    <span className="truncate">{c.companyName}</span>
                  </div>
                )}
                {c.address && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3 w-3 text-[#9CA3AF]" />
                    <span className="truncate">{c.address}</span>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100">
                <div className="text-center">
                  <Car className="h-3.5 w-3.5 mx-auto text-[#9CA3AF] mb-0.5" />
                  <p className="text-xs font-semibold">
                    {c._count?.vehicles || 0}
                  </p>
                  <p className="text-[10px] text-[#9CA3AF] uppercase">Vehicles</p>
                </div>
                <div className="text-center">
                  <FileText className="h-3.5 w-3.5 mx-auto text-[#9CA3AF] mb-0.5" />
                  <p className="text-xs font-semibold">
                    {c._count?.invoices || 0}
                  </p>
                  <p className="text-[10px] text-[#9CA3AF] uppercase">Invoices</p>
                </div>
                <div className="text-center">
                  <CreditCard className="h-3.5 w-3.5 mx-auto text-[#9CA3AF] mb-0.5" />
                  <p className="text-xs font-semibold">
                    {c._count?.payments || 0}
                  </p>
                  <p className="text-[10px] text-[#9CA3AF] uppercase">Payments</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-end gap-1 text-xs text-[#6B7280]">
                <Eye className="h-3.5 w-3.5" />
                View customer details
              </div>
            </div>
          ))}
        </div>
      )}

      <CustomerFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        onSuccess={load}
      />

      <CustomerDetailSheet
        customer={detailCustomer}
        data={detailData}
        loading={detailLoading}
        onOpenChange={(open) => {
          if (!open) {
            setDetailCustomer(null);
            setDetailData(null);
          }
        }}
      />
    </div>
  );
}

function CustomerDetailSheet({
  customer,
  data,
  loading,
  onOpenChange,
}: {
  customer: Customer | null;
  data: any;
  loading: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const invoices = data?.invoices || [];
  const payments = data?.payments || [];
  const vehicles = data?.vehicles || [];
  const ledgers = data?.ledgers || [];
  const [notes, setNotes] = useState<any[]>([]);
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  useEffect(() => {
    setNotes(data?.notes || []);
    setNoteText("");
  }, [data]);
  const totalInvoiced = invoices.reduce(
    (sum: number, invoice: any) =>
      invoice.status === "DRAFT" ? sum : sum + Number(invoice.total || 0),
    0
  );
  const totalPaid = payments.reduce(
    (sum: number, payment: any) => sum + Number(payment.amount || 0),
    0
  );

  return (
    <Sheet open={!!customer} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{customer?.name}</SheetTitle>
          {customer?.companyName && (
            <p className="text-sm text-[#6B7280]">{customer.companyName}</p>
          )}
        </SheetHeader>

        {loading ? (
          <div className="py-10 text-center text-sm text-[#6B7280]">
            Loading customer details…
          </div>
        ) : data ? (
          <div className="space-y-5 py-5">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <DetailMetric label="Vehicles" value={vehicles.length} />
              <DetailMetric label="Invoices" value={invoices.length} />
              <DetailMetric label="Invoiced" value={formatCurrency(totalInvoiced)} />
              <DetailMetric label="Paid" value={formatCurrency(totalPaid)} />
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => generateCustomerStatementPdf(data)}
            >
              Download customer statement PDF
            </Button>

            <div className="space-y-1 text-sm text-[#4B5563]">
              {customer?.email && <p>{customer.email}</p>}
              {customer?.phone && <p>{customer.phone}</p>}
              {customer?.address && <p>{customer.address}</p>}
            </div>

            <Tabs defaultValue="invoices">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="invoices">Invoices</TabsTrigger>
                <TabsTrigger value="payments">Payments</TabsTrigger>
                <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
                <TabsTrigger value="ledgers">Ledgers</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
              </TabsList>

              <TabsContent value="invoices" className="mt-4 space-y-2">
                {invoices.length === 0 ? (
                  <DetailEmpty text="No invoices for this customer" />
                ) : invoices.map((invoice: any) => (
                  <div key={invoice.id} className="rounded-lg border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{invoice.invoiceNumber}</p>
                        <p className="text-xs text-[#6B7280]">
                          Due {formatDate(invoice.dueDate)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(invoice.total)}</p>
                        <p className="text-xs text-[#6B7280]">{invoice.status}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="payments" className="mt-4 space-y-2">
                {payments.length === 0 ? (
                  <DetailEmpty text="No payments for this customer" />
                ) : payments.map((payment: any) => (
                  <div key={payment.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="font-medium">{payment.method}</p>
                      <p className="text-xs text-[#6B7280]">
                        {formatDate(payment.createdAt)}{payment.referenceNo ? ` • ${payment.referenceNo}` : ""}
                      </p>
                    </div>
                    <p className="font-semibold text-emerald-700">{formatCurrency(payment.amount)}</p>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="vehicles" className="mt-4 space-y-2">
                {vehicles.length === 0 ? (
                  <DetailEmpty text="No vehicles for this customer" />
                ) : vehicles.map((vehicle: any) => (
                  <div key={vehicle.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="font-medium">{vehicle.year} {vehicle.make} {vehicle.model}</p>
                      <p className="font-mono text-xs text-[#6B7280]">{vehicle.vin}</p>
                    </div>
                    <p className="text-xs text-[#6B7280]">{vehicle.status}</p>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="ledgers" className="mt-4 space-y-2">
                {ledgers.length === 0 ? (
                  <DetailEmpty text="No ledgers for this customer" />
                ) : ledgers.map((ledger: any) => (
                  <div key={ledger.id} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{ledger.name}</p>
                      <p className="font-semibold">{formatCurrency(ledger.balance)}</p>
                    </div>
                    <p className="mt-1 text-xs text-[#6B7280]">
                      {ledger.transactions?.length || 0} transaction(s)
                    </p>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="notes" className="mt-4 space-y-3">
                <div className="flex gap-2">
                  <Textarea
                    value={noteText}
                    onChange={(event) => setNoteText(event.target.value)}
                    placeholder="Add a customer note…"
                    rows={2}
                  />
                  <Button
                    className="self-end"
                    disabled={!noteText.trim() || savingNote}
                    onClick={async () => {
                      if (!customer) return;
                      setSavingNote(true);
                      try {
                        const response = await fetch(`/api/customers/${customer.id}/notes`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ content: noteText }),
                        });
                        if (!response.ok) throw new Error("Failed to save note");
                        const note = await response.json();
                        setNotes((current) => [note, ...current]);
                        setNoteText("");
                        toast.success("Note added");
                      } catch (error: any) {
                        toast.error(error.message || "Failed to save note");
                      } finally {
                        setSavingNote(false);
                      }
                    }}
                  >
                    {savingNote ? "Saving…" : "Add"}
                  </Button>
                </div>
                {notes.length === 0 ? (
                  <DetailEmpty text="No notes for this customer" />
                ) : notes.map((note: any) => (
                  <div key={note.id} className="rounded-lg border p-3">
                    <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                    <p className="mt-2 text-xs text-[#6B7280]">{formatDate(note.createdAt)}</p>
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function DetailMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border bg-slate-50 p-3">
      <p className="text-xs text-[#6B7280]">{label}</p>
      <p className="mt-1 text-sm font-semibold truncate">{value}</p>
    </div>
  );
}

function DetailEmpty({ text }: { text: string }) {
  return <p className="rounded-lg border border-dashed p-6 text-center text-sm text-[#6B7280]">{text}</p>;
}

function CustomerFormDialog({
  open,
  onOpenChange,
  editing,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing: Customer | null;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    name: "",
    companyName: "",
    email: "",
    phone: "",
    address: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editing) {
      setForm({
        name: editing.name,
        companyName: editing.companyName || "",
        email: editing.email || "",
        phone: editing.phone || "",
        address: editing.address || "",
      });
    } else {
      setForm({
        name: "",
        companyName: "",
        email: "",
        phone: "",
        address: "",
      });
    }
  }, [editing, open]);

  const submit = async () => {
    if (!form.name) {
      toast.error("Customer name is required");
      return;
    }
    setSaving(true);
    try {
      const url = editing
        ? `/api/customers/${editing.id}`
        : "/api/customers";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success(editing ? "Customer updated" : "Customer added");
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
          <DialogTitle>
            {editing ? "Edit Customer" : "Add Customer"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label className="text-xs">Name *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Company Name</Label>
            <Input
              value={form.companyName}
              onChange={(e) =>
                setForm({ ...form, companyName: e.target.value })
              }
              className="mt-1"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Phone</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs">Address</Label>
            <Textarea
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
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
            {saving ? "Saving…" : editing ? "Update" : "Add Customer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
