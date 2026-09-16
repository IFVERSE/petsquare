"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import {
  Eye, MousePointerClick, Phone, Navigation, Heart, Plus, Trash2,
  Mail, MailOpen, Clock, ExternalLink,
} from "lucide-react";
import { createProduct, updateProductStatus, deleteProduct, markMessageRead } from "@/app/dashboard/business/actions";

type Vendor = {
  id: string; slug: string; name: string; category: string; status: string;
  website: string | null; phone: string | null; address: string | null; business_status: string | null;
};
type Product = {
  id: string; name: string; image_url: string | null; original_price: number; discount_price: number;
  discount_percent: number; currency: string; availability: string; status: string;
  deal_ends_at: string | null; source: string; last_checked: string;
};
type Message = {
  id: string; message: string; read_at: string | null; created_at: string; sender_id: string;
  sender: { full_name: string | null; email: string } | null;
};
type Analytics = { profile_view: number; website_click: number; contact_click: number; directions_click: number; saved: number };

const statusCopy: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending Review", color: "bg-sunshine/20 text-tangerine" },
  verified: { label: "Live on PetSquare", color: "bg-sage-light text-sage" },
  suspended: { label: "Suspended", color: "bg-coral/10 text-coral" },
  rejected: { label: "Rejected", color: "bg-coral/10 text-coral" },
};

export default function BusinessDashboard({
  vendor, products, messages, analytics,
}: { vendor: Vendor; products: Product[]; messages: Message[]; analytics: Analytics }) {
  const [tab, setTab] = useState<"overview" | "deals" | "messages">("overview");
  const [productList, setProductList] = useState(products);
  const [messageList, setMessageList] = useState(messages);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const unreadCount = messageList.filter((m) => !m.read_at).length;
  const badge = statusCopy[vendor.status] ?? statusCopy.pending;

  function handleCreateProduct(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await createProduct(vendor.id, formData);
      if (res?.error) {
        setError(res.error);
        return;
      }
      setProductList((p) => [
        {
          id: crypto.randomUUID(),
          name: String(formData.get("name")),
          image_url: String(formData.get("image_url") || "") || null,
          original_price: Number(formData.get("original_price")),
          discount_price: Number(formData.get("discount_price")),
          discount_percent: +(((Number(formData.get("original_price")) - Number(formData.get("discount_price"))) / Number(formData.get("original_price"))) * 100).toFixed(2),
          currency: String(formData.get("currency") || "EUR"),
          availability: String(formData.get("availability") || "in_stock"),
          status: "active",
          deal_ends_at: null,
          source: "vendor_submitted",
          last_checked: new Date().toISOString(),
        },
        ...p,
      ]);
      setShowForm(false);
    });
  }

  function handleDeleteProduct(id: string) {
    startTransition(async () => {
      await deleteProduct(id);
      setProductList((p) => p.filter((x) => x.id !== id));
    });
  }

  function handleToggleExpire(id: string, current: string) {
    const next = current === "active" ? "expired" : "active";
    startTransition(async () => {
      await updateProductStatus(id, next as "active" | "expired");
      setProductList((p) => p.map((x) => (x.id === id ? { ...x, status: next } : x)));
    });
  }

  function handleMarkRead(id: string) {
    startTransition(async () => {
      await markMessageRead(id);
      setMessageList((m) => m.map((x) => (x.id === id ? { ...x, read_at: new Date().toISOString() } : x)));
    });
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-navy">🏪 {vendor.name}</h1>
          <p className="mt-1 text-sm text-navy/50">{vendor.category} · {vendor.address || "No address set"}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badge.color}`}>{badge.label}</span>
      </div>

      {vendor.status === "pending" && (
        <div className="mt-4 rounded-2xl bg-sunshine/10 p-4 text-sm text-navy/70">
          Your listing is awaiting admin approval and isn&apos;t visible to pet owners yet. You can still
          add deals now — they&apos;ll go live as soon as your business is approved.
        </div>
      )}

      <div className="mt-6 flex gap-2 border-b border-paper-dim">
        {(["overview", "deals", "messages"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`relative rounded-t-xl px-4 py-2 text-sm font-medium capitalize transition-colors ${
              tab === t ? "bg-abyss text-white" : "text-navy/60 hover:bg-paper"
            }`}
          >
            {t}
            {t === "messages" && unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-coral text-[10px] text-white">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Stat icon={Eye} label="Profile Views" value={analytics.profile_view} />
          <Stat icon={MousePointerClick} label="Website Clicks" value={analytics.website_click} />
          <Stat icon={Phone} label="Contact Clicks" value={analytics.contact_click} />
          <Stat icon={Navigation} label="Directions Requested" value={analytics.directions_click} />
          <Stat icon={Heart} label="Saved by Pet Owners" value={analytics.saved} />
          <div className="col-span-full rounded-2xl border border-dashed border-paper-dim p-4 text-xs text-navy/40">
            These counts come from real visitor activity on your public profile (
            <code>vendor_events</code> + <code>saved_items</code>). Deal Views and per-product
            analytics aren&apos;t tracked yet — a good Phase 6 addition.
          </div>
        </div>
      )}

      {tab === "deals" && (
        <div className="mt-6">
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 rounded-full bg-tangerine px-4 py-2.5 text-sm font-semibold text-white"
            >
              <Plus className="h-4 w-4" /> Add Deal
            </button>
          )}

          {showForm && (
            <form action={handleCreateProduct} className="mt-4 grid grid-cols-1 gap-3 rounded-2xl bg-surface p-5 shadow-[var(--shadow-card)] sm:grid-cols-2">
              <input name="name" required placeholder="Product name" className="rounded-xl border border-paper-dim px-3 py-2.5 text-sm sm:col-span-2" />
              <textarea name="description" required placeholder="Description" rows={2} className="rounded-xl border border-paper-dim px-3 py-2.5 text-sm sm:col-span-2" />
              <input name="image_url" placeholder="Image URL" className="rounded-xl border border-paper-dim px-3 py-2.5 text-sm sm:col-span-2" />
              <input name="original_price" type="number" step="0.01" required placeholder="Original price" className="rounded-xl border border-paper-dim px-3 py-2.5 text-sm" />
              <input name="discount_price" type="number" step="0.01" required placeholder="Discount price" className="rounded-xl border border-paper-dim px-3 py-2.5 text-sm" />
              <select name="currency" className="rounded-xl border border-paper-dim px-3 py-2.5 text-sm">
                <option value="EUR">EUR €</option><option value="RON">RON</option><option value="PLN">PLN</option>
                <option value="CZK">CZK</option><option value="HUF">HUF</option><option value="GBP">GBP £</option>
                <option value="SEK">SEK</option>
              </select>
              <select name="availability" className="rounded-xl border border-paper-dim px-3 py-2.5 text-sm">
                <option value="in_stock">In Stock</option>
                <option value="limited">Limited</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-navy/50">Deal end date (optional)</label>
                <input name="deal_ends_at" type="datetime-local" className="mt-1 w-full rounded-xl border border-paper-dim px-3 py-2.5 text-sm" />
              </div>
              {error && <p className="text-sm text-coral sm:col-span-2">{error}</p>}
              <div className="flex gap-2 sm:col-span-2">
                <button disabled={pending} className="rounded-xl bg-tangerine px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                  Publish Deal
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-paper-dim px-5 py-2.5 text-sm text-navy/60">
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="mt-4 grid grid-cols-1 gap-3">
            {productList.map((p) => (
              <div key={p.id} className="flex items-center gap-4 rounded-2xl bg-surface p-4 shadow-[var(--shadow-card)]">
                <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-paper">
                  {p.image_url && <Image src={p.image_url} alt="" fill sizes="56px" className="object-cover" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-sm text-navy">{p.name}</p>
                  <p className="text-xs text-navy/50">
                    {p.currency} {Number(p.discount_price).toFixed(2)}{" "}
                    <span className="line-through">{p.currency} {Number(p.original_price).toFixed(2)}</span>
                    {" · "}-{p.discount_percent}% · {p.status}
                    {p.source === "vendor_submitted" && " · vendor-submitted"}
                  </p>
                </div>
                <button onClick={() => handleToggleExpire(p.id, p.status)} disabled={pending} className="shrink-0 text-xs font-medium text-navy/50 hover:text-navy disabled:opacity-50">
                  Mark {p.status === "active" ? "expired" : "active"}
                </button>
                <button onClick={() => handleDeleteProduct(p.id)} disabled={pending} className="shrink-0 text-navy/30 hover:text-coral disabled:opacity-50">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            {productList.length === 0 && <p className="text-sm text-navy/40">No deals yet — add your first one above.</p>}
          </div>
        </div>
      )}

      {tab === "messages" && (
        <div className="mt-6 space-y-3">
          {messageList.map((m) => (
            <div key={m.id} className={`rounded-2xl p-4 shadow-[var(--shadow-card)] ${m.read_at ? "bg-surface" : "bg-sage-light"}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-navy">{m.sender?.full_name || m.sender?.email || "PetSquare user"}</p>
                  <p className="mt-1 text-sm text-navy/70">{m.message}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-navy/40">
                    <Clock className="h-3 w-3" /> {new Date(m.created_at).toLocaleString()}
                  </p>
                </div>
                {!m.read_at && (
                  <button onClick={() => handleMarkRead(m.id)} disabled={pending} className="flex shrink-0 items-center gap-1 text-xs font-medium text-sage hover:underline disabled:opacity-50">
                    <MailOpen className="h-3.5 w-3.5" /> Mark read
                  </button>
                )}
              </div>
            </div>
          ))}
          {messageList.length === 0 && (
            <div className="rounded-2xl border border-dashed border-paper-dim p-8 text-center text-sm text-navy/40">
              <Mail className="mx-auto mb-2 h-6 w-6" /> No inquiries yet.
            </div>
          )}
        </div>
      )}

      {vendor.website && (
        <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="mt-8 flex items-center gap-1.5 text-xs text-navy/40 hover:text-navy/60">
          <ExternalLink className="h-3 w-3" /> {vendor.website}
        </a>
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Eye; label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-surface p-5 shadow-[var(--shadow-card)]">
      <Icon className="h-5 w-5 text-tangerine" />
      <p className="mt-3 font-data text-3xl font-semibold text-navy">{value}</p>
      <p className="mt-1 text-sm text-navy/50">{label}</p>
    </div>
  );
}
