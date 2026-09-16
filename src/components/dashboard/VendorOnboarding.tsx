"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createVendorListing } from "@/app/dashboard/business/actions";

const categories = [
  { value: "retailer", label: "Pet Retailer" },
  { value: "veterinary", label: "Veterinary & Wellness" },
  { value: "grooming", label: "Grooming" },
  { value: "boarding", label: "Care & Boarding" },
  { value: "training", label: "Training" },
  { value: "memorial", label: "Memorial Services" },
];

export default function VendorOnboarding() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await createVendorListing(formData);
      if (res?.error) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <form action={handleSubmit} className="mt-6 grid grid-cols-1 gap-3 rounded-2xl bg-surface p-6 shadow-[var(--shadow-card)] sm:grid-cols-2">
      <input name="name" required placeholder="Business name" className="rounded-xl border border-paper-dim px-3 py-2.5 text-sm sm:col-span-2" />
      <select name="category" required className="rounded-xl border border-paper-dim px-3 py-2.5 text-sm">
        <option value="">Category...</option>
        {categories.map((c) => (
          <option key={c.value} value={c.value}>{c.label}</option>
        ))}
      </select>
      <input name="phone" placeholder="Phone" className="rounded-xl border border-paper-dim px-3 py-2.5 text-sm" />
      <input name="website" placeholder="Website (https://...)" className="rounded-xl border border-paper-dim px-3 py-2.5 text-sm sm:col-span-2" />
      <input name="address" placeholder="Full address" className="rounded-xl border border-paper-dim px-3 py-2.5 text-sm sm:col-span-2" />

      <fieldset className="sm:col-span-2">
        <legend className="mb-1 text-xs font-medium text-navy/50">Species you serve</legend>
        <div className="flex flex-wrap gap-3">
          {["dog", "cat", "bird", "fish", "exotic"].map((s) => (
            <label key={s} className="flex items-center gap-1.5 text-sm capitalize text-navy/70">
              <input type="checkbox" name="species" value={s} className="rounded" /> {s}
            </label>
          ))}
        </div>
      </fieldset>

      {error && <p className="text-sm text-coral sm:col-span-2">{error}</p>}

      <button disabled={pending} className="mt-1 rounded-xl bg-tangerine px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50 sm:col-span-2">
        Submit for Review
      </button>
      <p className="text-xs text-navy/40 sm:col-span-2">
        A PetSquare admin reviews new business listings before they appear publicly — this
        usually happens quickly, but there&apos;s no fixed timeline in this build.
      </p>
    </form>
  );
}
