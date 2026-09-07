"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Pencil,
  Trash2,
  TrendingUp,
  Receipt as ReceiptIcon,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/types";
import { toast } from "sonner";

export function VehicleDetailExpenses({
  vehicle,
  onChanged,
}: {
  vehicle: any;
  onChanged: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({
    title: "",
    customerCharge: 0,
    companyCost: 0,
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  const openAdd = () => {
    setEditing(null);
    setForm({ title: "", customerCharge: 0, companyCost: 0, notes: "" });
    setShowForm(true);
  };

  const openEdit = (e: any) => {
    setEditing(e);
    setForm({
      title: e.title,
      customerCharge: e.customerCharge,
      companyCost: e.companyCost,
      notes: e.notes || "",
    });
    setShowForm(true);
  };

  const submit = async () => {
    if (!form.title) {
      toast.error("Title is required");
      return;
    }
    setSaving(true);
    try {
      const url = editing ? `/api/expenses/${editing.id}` : "/api/expenses";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          vehicleId: vehicle.id,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success(editing ? "Expense updated" : "Expense added");
      setShowForm(false);
      onChanged();
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this expense? Ledger entries will be reversed."))
      return;
    await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    toast.success("Expense deleted");
    onChanged();
  };

  const computedProfit = Number(form.customerCharge || 0) - Number(form.companyCost || 0);

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <p className="text-xs text-slate-500">
          {vehicle.expenses?.length || 0} expense(s) •{" "}
          {formatCurrency(vehicle.totalCharge)} charged •{" "}
          {formatCurrency(vehicle.totalCost)} cost
        </p>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          onClick={openAdd}
        >
          <Plus className="h-3.5 w-3.5" />
          Add Expense
        </Button>
      </div>

      {showForm && (
        <div className="rounded-lg border border-slate-200 p-3 space-y-2 bg-slate-50">
          <div>
            <Label className="text-xs">Title *</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g., Ocean freight, Customs clearance"
              className="mt-1"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-emerald-700">
                Customer Charge
              </Label>
              <Input
                type="number"
                value={form.customerCharge || ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    customerCharge: Number(e.target.value),
                  })
                }
                placeholder="0.00"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-rose-700">Company Cost</Label>
              <Input
                type="number"
                value={form.companyCost || ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    companyCost: Number(e.target.value),
                  })
                }
                placeholder="0.00"
                className="mt-1"
              />
            </div>
          </div>
          <div className="rounded-md bg-emerald-50 border border-emerald-200 px-3 py-1.5 flex items-center justify-between">
            <span className="text-xs text-emerald-700 font-medium">
              Auto Profit
            </span>
            <span className="text-sm font-bold text-emerald-900">
              {formatCurrency(computedProfit)}
            </span>
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
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={submit} disabled={saving}>
              {saving ? "Saving…" : editing ? "Update" : "Add Expense"}
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-md border border-slate-200 divide-y divide-slate-100">
        {(vehicle.expenses || []).map((e: any) => (
          <div
            key={e.id}
            className="flex items-center justify-between p-2.5 hover:bg-slate-50"
          >
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-md bg-slate-100 flex items-center justify-center">
                <ReceiptIcon className="h-3.5 w-3.5 text-slate-500" />
              </div>
              <div>
                <p className="text-sm font-medium">{e.title}</p>
                <p className="text-xs text-slate-500">{formatDate(e.createdAt)}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="text-emerald-700">
                +{formatCurrency(e.customerCharge)}
              </span>
              <span className="text-rose-600">−{formatCurrency(e.companyCost)}</span>
              <span className="font-semibold text-emerald-900 inline-flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {formatCurrency(e.profit)}
              </span>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  onClick={() => openEdit(e)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 text-rose-500"
                  onClick={() => remove(e.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ))}
        {(vehicle.expenses || []).length === 0 && (
          <div className="p-6 text-center text-sm text-slate-400">
            No expenses recorded — add one to start tracking profit
          </div>
        )}
      </div>
    </div>
  );
}
