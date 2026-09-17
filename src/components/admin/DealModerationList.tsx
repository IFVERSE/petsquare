"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Ban, Trash2, XCircle } from "lucide-react";
import { setProductStatus, deleteProductAdmin } from "@/app/admin/deals/actions";

type Product = {
  id: string; name: string; discount_price: number; original_price: number;
  discount_percent: number; currency: string; status: string; source: string;
  last_checked: string; vendor_name: string; vendor_slug: string;
};

const statusColor: Record<string, string> = {
  active: "bg-sage-light text-sage",
  pending_verification: "bg-sunshine/20 text-tangerine",
  expired: "bg-paper text-navy/50",
  rejected: "bg-coral/10 text-coral",
  suspended: "bg-coral/10 text-coral",
};

const filters = ["all", "active", "pending_verification", "expired", "rejected", "suspended"] as const;

export default function DealModerationList({ products }: { products: Product[] }) {
  const [rows, setRows] = useState(products);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<(typeof filters)[number]>("all");
  const [pending, startTransition] = useTransition();

  function act(id: string, status: "active" | "expired" | "rejected" | "suspended") {
    startTransition(async () => {
      const result = await setProductStatus(id, status);
      if (result?.error) { setError(result.error); return; }
      setRows((r) => r.map((p) => (p.id === id ? { ...p, status } : p)));
    });
  }

  function remove(id: string) {
    if (!confirm("Delete this deal permanently?")) return;
    startTransition(async () => {
      const result = await deleteProductAdmin(id);
      if (result?.error) { setError(result.error); return; }
      setRows((r) => r.filter((p) => p.id !== id));
    });
  }

  const visible = filter === "all" ? rows : rows.filter((p) => p.status === filter);

  return (
    <div className="mt-6">
      {error && <p role="alert" className="mb-3 text-sm text-coral">{error}</p>}
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-medium capitalize ${
              filter === f ? "bg-abyss text-white" : "bg-surface border border-paper-dim text-navy/60"
            }`}
          >
            {f.replace("_", " ")}
          </button>
        ))}
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl bg-surface shadow-[var(--shadow-card)]">
        <table className="admin-card-table admin-deals-table w-full min-w-[640px] text-left text-sm">
          <thead className="bg-paper text-xs uppercase tracking-wide text-navy/40">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Vendor</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((p) => (
              <tr key={p.id} className="border-t border-paper-dim">
                <td className="px-4 py-3 text-navy">{p.name}</td>
                <td className="px-4 py-3 text-navy/60">
                  <a href={`/vendors/${p.vendor_slug}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    {p.vendor_name}
                  </a>
                  {p.source === "vendor_submitted" && <span className="ml-1 text-xs text-navy/40">(self-submitted)</span>}
                </td>
                <td className="px-4 py-3 font-data text-navy/70">
                  {p.currency} {Number(p.discount_price).toFixed(2)} · -{p.discount_percent}%
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[p.status] ?? ""}`}>
                    {p.status.replace("_", " ")}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    {p.status !== "active" && (
                      <button onClick={() => act(p.id, "active")} disabled={pending} className="flex min-h-11 min-w-11 items-center justify-center rounded-xl text-sage disabled:opacity-50" aria-label={`Activate ${p.name}`}>
                        <CheckCircle2 className="h-4 w-4" />
                      </button>
                    )}
                    {p.status === "active" && (
                      <button onClick={() => act(p.id, "expired")} disabled={pending} className="flex min-h-11 min-w-11 items-center justify-center rounded-xl text-navy/70 disabled:opacity-50" aria-label={`Mark ${p.name} expired`}>
                        <Ban className="h-4 w-4" />
                      </button>
                    )}
                    {p.status !== "rejected" && (
                      <button onClick={() => act(p.id, "rejected")} disabled={pending} className="flex min-h-11 min-w-11 items-center justify-center rounded-xl text-coral disabled:opacity-50" aria-label={`Reject ${p.name}`}>
                        <XCircle className="h-4 w-4" />
                      </button>
                    )}
                    <button onClick={() => remove(p.id)} disabled={pending} className="text-coral/70 hover:text-coral disabled:opacity-50" aria-label="Delete">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-navy/40">No deals match this filter.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
