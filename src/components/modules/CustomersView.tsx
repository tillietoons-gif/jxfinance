"use client";

import { useEffect, useState, useCallback } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { ExportButtons } from "@/components/shared/ExportButtons";
import { EmptyState } from "@/components/shared/EmptyState";
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
import { toast } from "sonner";
import { formatDate, formatCurrency } from "@/lib/types";
import { exportToExcel } from "@/lib/excel";

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
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/customers");
    const data = await res.json();
    setCustomers(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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

      {filtered.length === 0 ? (
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
              className="rounded-xl border border-[#E5E7EB] bg-white p-4 hover:shadow-sm transition-shadow"
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
                    onClick={() => {
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
                    onClick={async () => {
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
    </div>
  );
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
