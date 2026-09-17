"use client";

import VendorImagery from "./VendorImagery";
import { motion } from "framer-motion";
import { MapPin, Star, Heart } from "lucide-react";
import { Deal, Vendor, timeAgo } from "@/lib/mock-data";
import { useSaveItem } from "@/lib/hooks/use-save-item";
import CountdownTimer from "./CountdownTimer";

export default function DealCard({ deal, vendor }: { deal: Deal; vendor: Vendor }) {
  const { saved, toggle } = useSaveItem("deal", deal.id);

  return (
    <motion.a
      href={deal.sourceUrl || `/vendors/${vendor.slug}`}
      target={deal.sourceUrl ? "_blank" : undefined}
      rel="noopener noreferrer"
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className="tag-card group flex w-72 max-w-full shrink-0 flex-col overflow-hidden bg-surface shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-shadow"
    >
      <div className="relative h-52 w-full overflow-hidden bg-paper-dim">
        <VendorImagery images={deal.imageUrl ? [deal.imageUrl] : []} category={vendor.category} name={deal.productName} />
        <span className="absolute left-3 top-3 rounded-full bg-coral px-2.5 py-1 font-data text-xs font-semibold text-white shadow-sm">
          -{deal.discountPercent}%
        </span>
        {deal.source === "vendor_submitted" && (
          <span className="absolute left-3 bottom-3 rounded-full bg-surface/90 px-2 py-0.5 text-[10px] font-medium text-navy/70 shadow-sm">
            🏪 Vendor-submitted
          </span>
        )}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggle();
          }}
          aria-label={saved ? "Remove from saved" : "Save this deal"}
          className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-surface/90 shadow-sm transition-transform hover:scale-110"
        >
          <Heart className={`h-3.5 w-3.5 ${saved ? "fill-coral text-coral" : "text-navy/50"}`} />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-display text-base leading-tight text-navy">{deal.productName}</h3>

        <div className="flex items-baseline gap-2">
          <span className="font-data text-lg font-semibold text-navy">
            €{deal.discountPrice.toFixed(2)}
          </span>
          <span className="font-data text-sm text-navy/40 line-through">
            €{deal.originalPrice.toFixed(2)}
          </span>
        </div>

        {vendor.rating > 0 && <div className="flex items-center gap-1.5 text-xs text-navy/60">
          <Star className="h-3.5 w-3.5 fill-sunshine text-sunshine" />
          <span>{vendor.rating} · {vendor.reviewCount} reviews</span>
        </div>}
        <div className="flex items-center gap-1.5 text-xs text-navy/60">
          <MapPin className="h-3.5 w-3.5" />
          <span>{vendor.city}, {vendor.country}</span>
        </div>

        <p className="text-xs text-navy/50">Confirm the current price and offer on the vendor website.</p>
        <div className="mt-1 flex items-center justify-between border-t border-paper-dim pt-2">
          {deal.dealEndsAt ? (
            <CountdownTimer endsAt={deal.dealEndsAt} />
          ) : (
            <span className="font-data text-xs text-navy/40">Verified {timeAgo(deal.lastChecked)}</span>
          )}
          <span className="font-display text-sm font-medium text-tangerine group-hover:underline">
            View deal →
          </span>
        </div>
      </div>
    </motion.a>
  );
}
