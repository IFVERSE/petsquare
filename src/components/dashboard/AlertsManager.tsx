"use client";

import { useState, useTransition } from "react";
import { Bell, Trash2, Plus } from "lucide-react";
import { addPriceAlert, removePriceAlert } from "@/app/dashboard/alerts/actions";

function one<T>(v: T | T[] | null | undefined): T | null {
  return Array.isArray(v) ? v[0] ?? null : v ?? null;
}

type SavedProduct = { id: string; name: string; discount_price: number };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Alert = { id: string; target_price: number; products: any };

export default function AlertsManager({
  initialAlerts,
  savedProducts,
}: {
  initialAlerts: Alert[];
  savedProducts: SavedProduct[];
}) {
  const [alerts, setAlerts] = useState(initialAlerts);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleAdd(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await addPriceAlert(formData);
      if (res?.error) {
        setError(res.error);
        return;
      }
      const product = savedProducts.find((p) => p.id === formData.get("product_id"));
      setAlerts((a) => [
        {
          id: crypto.randomUUID(),
          target_price: Number(formData.get("target_price")),
          products: product,
        },
        ...a,
      ]);
      setShowForm(false);
    });
  }

  function handleRemove(id: string) {
    startTransition(async () => {
      await removePriceAlert(id);
      setAlerts((a) => a.filter((al) => al.id !== id));
    });
  }

  return (
    <div className="mt-6">
      <div className="space-y-3">
        {alerts.map((alert) => {
          const product = one(alert.products);
          const met = product && Number(product.discount_price) <= Number(alert.target_price);
          return (
            <div key={alert.id} className="flex items-center justify-between rounded-2xl bg-surface p-4 shadow-[var(--shadow-card)]">
              <div className="flex items-center gap-3">
                <span className={`flex h-9 w-9 items-center justify-center rounded-full ${met ? "bg-sage-light text-sage" : "bg-paper text-navy/40"}`}>
                  <Bell className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-display text-sm text-navy">{product?.name ?? "Product no longer available"}</p>
                  <p className="text-xs text-navy/50">
                    Alert at €{Number(alert.target_price).toFixed(2)}
                    {product && ` · currently €${Number(product.discount_price).toFixed(2)}`}
                    {met && <span className="ml-1 font-medium text-sage">— target reached!</span>}
                  </p>
                </div>
              </div>
              <button onClick={() => handleRemove(alert.id)} disabled={pending} className="text-navy/30 hover:text-coral disabled:opacity-50">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          );
        })}

        {alerts.length === 0 && !showForm && (
          <p className="text-sm text-navy/50">No price alerts yet.</p>
        )}
      </div>

      {savedProducts.length === 0 ? (
        <p className="mt-4 text-sm text-navy/50">
          Save a deal first (tap the heart on any deal card), then come back here to set a price alert for it.
        </p>
      ) : !showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="mt-4 flex items-center gap-1.5 rounded-full border-2 border-dashed border-paper-dim px-4 py-2 text-sm text-navy/50 hover:border-tangerine hover:text-tangerine"
        >
          <Plus className="h-4 w-4" /> New Price Alert
        </button>
      ) : (
        <form action={handleAdd} className="mt-4 flex flex-col gap-3 rounded-2xl bg-surface p-5 shadow-[var(--shadow-card)] sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="text-xs font-medium text-navy/50">Saved product</label>
            <select name="product_id" required className="mt-1 w-full rounded-xl border border-paper-dim px-3 py-2.5 text-sm">
              {savedProducts.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-navy/50">Alert me at or below (€)</label>
            <input name="target_price" type="number" step="0.01" required className="mt-1 w-32 rounded-xl border border-paper-dim px-3 py-2.5 text-sm" />
          </div>
          <button disabled={pending} className="rounded-xl bg-tangerine px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
            Create Alert
          </button>
        </form>
      )}
      {error && <p className="mt-2 text-sm text-coral">{error}</p>}
    </div>
  );
}
