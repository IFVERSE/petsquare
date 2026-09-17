"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const countries = ["DE", "FR", "IT", "ES", "PL", "RO", "CZ", "HU", "AT", "SE", "PT", "GB"];
const categories = ["retailer", "veterinary", "grooming", "boarding", "training", "walking", "shelter", "memorial", "breeding"];

export default function ScraperControls() {
  const router = useRouter();
  const [country, setCountry] = useState("DE");
  const [category, setCategory] = useState("retailer");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function run(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/scrape", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ country, category }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Discovery failed.");
      setMessage(`Scanned ${result.scanned} places. Published ${result.accepted} validated vendors and ${result.deals} deals.${result.errors ? ` ${result.errors} sites failed validation.` : ""}`);
      router.refresh();
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Discovery failed.");
    } finally { setBusy(false); }
  }

  return <form onSubmit={run} className="mt-6 grid gap-3 rounded-2xl bg-surface p-4 shadow-[var(--shadow-card)] sm:grid-cols-[1fr_1fr_auto] sm:items-end">
    <label className="min-w-0 text-sm font-medium text-navy">Country
      <select value={country} onChange={event => setCountry(event.target.value)} className="mt-1 block w-full rounded-xl border border-paper-dim bg-surface px-3 py-3 text-navy">
        {countries.map(code => <option key={code} value={code}>{code}</option>)}
      </select>
    </label>
    <label className="min-w-0 text-sm font-medium text-navy">Category
      <select value={category} onChange={event => setCategory(event.target.value)} className="mt-1 block w-full rounded-xl border border-paper-dim bg-surface px-3 py-3 capitalize text-navy">
        {categories.map(value => <option key={value} value={value}>{value}</option>)}
      </select>
    </label>
    <button type="submit" disabled={busy} className="min-h-12 rounded-xl bg-tangerine px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Discovering…" : "Fetch and publish"}</button>
    {message && <p role="status" aria-live="polite" className="break-words text-sm text-navy sm:col-span-3">{message}</p>}
  </form>;
}
