"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, XCircle, ShieldOff, ExternalLink, Pencil, Trash2 } from "lucide-react";
import { setVendorStatus, updateVendorDetails, deleteVendor } from "@/app/admin/vendors/actions";

type Vendor = {
  id: string; name: string; category: string; status: string; source: string;
  address: string | null; phone: string | null; website: string | null;
  created_at: string; owner_email?: string | null; product_count?: number;
};

const statusColor: Record<string, string> = {
  pending: "bg-sunshine/20 text-tangerine",
  verified: "bg-sage-light text-sage",
  rejected: "bg-coral/10 text-coral",
  suspended: "bg-coral/10 text-coral",
};

const categories = ["retailer", "veterinary", "grooming", "boarding", "training", "memorial"];

export default function VendorApprovalList({ vendors }: { vendors: Vendor[] }) {
  const [rows, setRows] = useState(vendors);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function act(id: string, status: "verified" | "rejected" | "suspended") {
    startTransition(async () => {
      await setVendorStatus(id, status);
      setRows((r) => r.map((v) => (v.id === id ? { ...v, status } : v)));
    });
  }

  function handleEdit(id: string, formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await updateVendorDetails(id, formData);
      if (res?.error) {
        setError(res.error);
        return;
      }
      setRows((r) =>
        r.map((v) =>
          v.id === id
            ? {
                ...v,
                name: String(formData.get("name")),
                category: String(formData.get("category")),
                phone: String(formData.get("phone") || "") || null,
                website: String(formData.get("website") || "") || null,
                address: String(formData.get("address") || "") || null,
              }
            : v
        )
      );
      setEditingId(null);
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this vendor permanently? This also deletes their products.")) return;
    startTransition(async () => {
      await deleteVendor(id);
      setRows((r) => r.filter((v) => v.id !== id));
    });
  }

  const pendingFirst = [...rows].sort((a, b) => (a.status === "pending" ? -1 : 1) - (b.status === "pending" ? -1 : 1));

  return (
    <div className="mt-6 space-y-3">
      {pendingFirst.map((v) => (
        <div key={v.id} className="rounded-2xl bg-surface p-5 shadow-[var(--shadow-card)]">
          {editingId === v.id ? (
            <form action={(fd) => handleEdit(v.id, fd)} className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <input name="name" defaultValue={v.name} required className="rounded-xl border border-paper-dim px-3 py-2 text-sm sm:col-span-2" />
              <select name="category" defaultValue={v.category} className="rounded-xl border border-paper-dim px-3 py-2 text-sm">
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <input name="phone" defaultValue={v.phone ?? ""} placeholder="Phone" className="rounded-xl border border-paper-dim px-3 py-2 text-sm" />
              <input name="website" defaultValue={v.website ?? ""} placeholder="Website" className="rounded-xl border border-paper-dim px-3 py-2 text-sm sm:col-span-2" />
              <input name="address" defaultValue={v.address ?? ""} placeholder="Address" className="rounded-xl border border-paper-dim px-3 py-2 text-sm sm:col-span-2" />
              {error && <p className="text-sm text-coral sm:col-span-2">{error}</p>}
              <div className="flex gap-2 sm:col-span-2">
                <button disabled={pending} className="rounded-full bg-tangerine px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-50">Save</button>
                <button type="button" onClick={() => setEditingId(null)} className="rounded-full border border-paper-dim px-4 py-1.5 text-xs text-navy/60">Cancel</button>
              </div>
            </form>
          ) : (
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-display text-base text-navy">{v.name}</p>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[v.status] ?? ""}`}>{v.status}</span>
                  {v.source === "vendor_submitted" && (
                    <span className="rounded-full bg-paper px-2 py-0.5 text-xs text-navy/50">vendor-submitted</span>
                  )}
                </div>
                <p className="mt-1 text-sm text-navy/50">
                  {v.category} · {v.address || "no address"} · {v.phone || "no phone"}
                  {typeof v.product_count === "number" && ` · ${v.product_count} products`}
                </p>
                {v.owner_email && <p className="mt-0.5 text-xs text-navy/40">Owner: {v.owner_email}</p>}
                {v.website && (
                  <a href={v.website} target="_blank" rel="noopener noreferrer" className="mt-1 flex items-center gap-1 text-xs text-tangerine hover:underline">
                    <ExternalLink className="h-3 w-3" /> {v.website}
                  </a>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {v.status === "pending" && (
                  <>
                    <button onClick={() => act(v.id, "verified")} disabled={pending} className="flex items-center gap-1 rounded-full bg-sage px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                    </button>
                    <button onClick={() => act(v.id, "rejected")} disabled={pending} className="flex items-center gap-1 rounded-full border border-paper-dim px-3 py-1.5 text-xs font-medium text-navy/60 disabled:opacity-50">
                      <XCircle className="h-3.5 w-3.5" /> Reject
                    </button>
                  </>
                )}
                {v.status === "verified" && (
                  <button onClick={() => act(v.id, "suspended")} disabled={pending} className="flex items-center gap-1 rounded-full border border-paper-dim px-3 py-1.5 text-xs font-medium text-navy/60 disabled:opacity-50">
                    <ShieldOff className="h-3.5 w-3.5" /> Suspend
                  </button>
                )}
                {v.status === "suspended" && (
                  <button onClick={() => act(v.id, "verified")} disabled={pending} className="flex items-center gap-1 rounded-full bg-sage px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Reactivate
                  </button>
                )}
                <button onClick={() => setEditingId(v.id)} className="flex items-center gap-1 rounded-full border border-paper-dim px-3 py-1.5 text-xs font-medium text-navy/60">
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
                <button onClick={() => handleDelete(v.id)} disabled={pending} className="flex items-center gap-1 rounded-full border border-paper-dim px-3 py-1.5 text-xs font-medium text-coral disabled:opacity-50">
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
      {rows.length === 0 && <p className="text-sm text-navy/40">No vendors yet.</p>}
    </div>
  );
}
