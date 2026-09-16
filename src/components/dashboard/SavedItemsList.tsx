"use client";
import Link from "next/link";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Heart, Store, Trash2 } from "lucide-react";
import { removeSavedItem } from "@/app/dashboard/saved/actions";

function one<T>(v: T | T[] | null | undefined): T | null {
  return Array.isArray(v) ? v[0] ?? null : v ?? null;
}

type Item = {
  id: string;
  type: "vendor" | "product" | "deal" | "service";
  // These come straight from Supabase joins, so keep them loosely typed here.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  vendor?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  product?: any;
};

export default function SavedItemsList({ items }: { items: Item[] }) {
  const [rows, setRows] = useState(items);
  const [pending, startTransition] = useTransition();

  function handleRemove(id: string) {
    startTransition(async () => {
      await removeSavedItem(id);
      setRows((r) => r.filter((row) => row.id !== id));
    });
  }

  if (rows.length === 0) {
    return (
      <div className="mt-8 rounded-2xl border border-dashed border-paper-dim bg-surface p-8 text-center">
        <Heart className="mx-auto h-8 w-8 text-navy/30" />
        <p className="mt-3 font-display text-lg text-navy">Nothing saved yet</p>
        <p className="mt-1 text-sm text-navy/50">
          Browse <Link href="/deals" className="font-medium text-tangerine hover:underline">deals</Link> or{" "}
          <Link href="/vendors" className="font-medium text-tangerine hover:underline">vendors</Link> and tap the heart to save them here.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 grid grid-cols-1 gap-3">
      {rows.map((item) => {
        const vendor = one(item.vendor);
        const product = one(item.product);
        const vendorOfProduct = product ? one(product.vendors) : null;

        return (
          <div key={item.id} className="flex items-center justify-between gap-4 rounded-2xl bg-surface p-4 shadow-[var(--shadow-card)]">
            <Link
              href={vendor ? `/vendors/${vendor.slug}` : vendorOfProduct ? `/vendors/${vendorOfProduct.slug}` : "#"}
              className="flex min-w-0 flex-1 items-center gap-3"
            >
              <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-paper">
                {vendor?.logo_url || product?.image_url ? (
                  <Image src={vendor?.logo_url || product?.image_url} alt="" fill sizes="48px" className="object-cover" />
                ) : (
                  <Store className="m-auto h-full w-6 text-navy/30" />
                )}
              </span>
              <div className="min-w-0">
                <p className="truncate font-display text-sm text-navy">
                  {vendor?.name || product?.name || "Removed listing"}
                </p>
                <p className="truncate text-xs text-navy/50">
                  {item.type === "vendor"
                    ? "Vendor"
                    : product
                    ? `€${Number(product.discount_price).toFixed(2)} at ${vendorOfProduct?.name ?? "vendor"}`
                    : "Deal"}
                </p>
              </div>
            </Link>
            <button
              onClick={() => handleRemove(item.id)}
              disabled={pending}
              className="shrink-0 text-navy/30 hover:text-coral disabled:opacity-50"
              aria-label="Remove from saved"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
