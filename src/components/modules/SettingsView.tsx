"use client";

import { useEffect, useState } from "react";
import { Building2, Save, Settings, Truck, Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { PAYMENT_METHODS, VEHICLE_STATUSES } from "@/lib/types";

const initialSettings = {
  companyName: "JACXI Shipping",
  companyEmail: "",
  companyPhone: "",
  companyAddress: "",
  logoUrl: "",
  currency: "USD",
  taxRate: 0,
  invoicePrefix: "INV",
  defaultVehicleStatus: "PENDING",
  defaultPaymentMethod: "Bank Transfer",
};

export function SettingsView() {
  const [settings, setSettings] = useState(initialSettings);
  const [vendors, setVendors] = useState<any[]>([]);
  const [vendorName, setVendorName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([fetch("/api/settings"), fetch("/api/vendors")])
      .then(async ([settingsRes, vendorsRes]) => {
        if (!settingsRes.ok || !vendorsRes.ok) throw new Error("Failed to load settings");
        setSettings(await settingsRes.json());
        setVendors(await vendorsRes.json());
      })
      .catch((error) => toast.error(error.message))
      .finally(() => setLoading(false));
  }, []);

  const update = (field: string, value: string | number) => {
    setSettings((current) => ({ ...current, [field]: value }));
  };

  const save = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!response.ok) throw new Error("Failed to save settings");
      setSettings(await response.json());
      toast.success("Settings saved");
    } catch (error: any) {
      toast.error(error.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const addVendor = async () => {
    if (!vendorName.trim()) return;
    const response = await fetch("/api/vendors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: vendorName }),
    });
    if (!response.ok) {
      toast.error("Failed to add vendor");
      return;
    }
    const vendor = await response.json();
    setVendors((current) => [...current, vendor]);
    setVendorName("");
    toast.success("Vendor added");
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Settings"
        subtitle="Configure company identity, billing defaults, and operating partners"
        icon={Settings}
      />

      {loading ? (
        <div className="rounded-md border bg-white p-8 text-sm text-[#6B7280]">Loading settings…</div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
          <section className="rounded-md border bg-white p-5">
            <div className="mb-5 flex items-center gap-3 border-b pb-4">
              <Building2 className="h-5 w-5 text-[#D4AF37]" />
              <div>
                <h2 className="font-semibold">Company profile</h2>
                <p className="text-xs text-[#6B7280]">Used on invoices and customer statements.</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Company name" value={settings.companyName} onChange={(value) => update("companyName", value)} />
              <Field label="Company email" value={settings.companyEmail} onChange={(value) => update("companyEmail", value)} type="email" />
              <Field label="Company phone" value={settings.companyPhone} onChange={(value) => update("companyPhone", value)} />
              <Field label="Logo URL" value={settings.logoUrl} onChange={(value) => update("logoUrl", value)} placeholder="https://…" />
              <div className="sm:col-span-2">
                <Label>Company address</Label>
                <Textarea value={settings.companyAddress} onChange={(event) => update("companyAddress", event.target.value)} className="mt-1" rows={2} />
              </div>
            </div>

            <div className="mb-5 mt-8 flex items-center gap-3 border-b pb-4">
              <Truck className="h-5 w-5 text-[#D4AF37]" />
              <div>
                <h2 className="font-semibold">Billing and workflow defaults</h2>
                <p className="text-xs text-[#6B7280]">Keep new records consistent across the workspace.</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Currency" value={settings.currency} onChange={(value) => update("currency", value.toUpperCase())} maxLength={3} />
              <Field label="Tax rate (%)" value={String(settings.taxRate)} onChange={(value) => update("taxRate", Number(value) || 0)} type="number" />
              <Field label="Invoice prefix" value={settings.invoicePrefix} onChange={(value) => update("invoicePrefix", value.toUpperCase())} />
              <SelectField label="Default vehicle status" value={settings.defaultVehicleStatus} options={VEHICLE_STATUSES} onChange={(value) => update("defaultVehicleStatus", value)} />
              <SelectField label="Default payment method" value={settings.defaultPaymentMethod} options={PAYMENT_METHODS} onChange={(value) => update("defaultPaymentMethod", value)} />
            </div>
            <Button className="mt-6 gap-2" onClick={save} disabled={saving}><Save className="h-4 w-4" />{saving ? "Saving…" : "Save settings"}</Button>
          </section>

          <section className="rounded-md border bg-white p-5">
            <h2 className="font-semibold">Vendors</h2>
            <p className="mt-1 text-xs text-[#6B7280]">Assign vendors to vehicle expenses and keep costs traceable.</p>
            <div className="mt-4 flex gap-2">
              <Input value={vendorName} onChange={(event) => setVendorName(event.target.value)} placeholder="Vendor name" onKeyDown={(event) => event.key === "Enter" && addVendor()} />
              <Button size="icon" onClick={addVendor} aria-label="Add vendor"><Plus className="h-4 w-4" /></Button>
            </div>
            <div className="mt-4 divide-y">
              {vendors.map((vendor) => <div key={vendor.id} className="flex items-center justify-between py-3 text-sm"><span>{vendor.name}</span><span className="text-xs text-[#6B7280]">{vendor._count?.expenses || 0} expenses</span></div>)}
              {vendors.length === 0 && <p className="py-6 text-center text-sm text-[#6B7280]">No vendors yet.</p>}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder, maxLength }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string; maxLength?: number }) {
  return <div><Label>{label}</Label><Input className="mt-1" type={type} value={value} placeholder={placeholder} maxLength={maxLength} onChange={(event) => onChange(event.target.value)} /></div>;
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: readonly string[]; onChange: (value: string) => void }) {
  return <div><Label>{label}</Label><select className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option key={option} value={option}>{option.replace(/_/g, " ")}</option>)}</select></div>;
}
