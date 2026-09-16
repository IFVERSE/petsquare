"use client";

import VendorImagery from "./VendorImagery";
import { motion } from "framer-motion";
import { MapPin, Star } from "lucide-react";
import { Vendor } from "@/lib/mock-data";

const categoryLabel: Record<Vendor["category"], string> = {
  retailer: "Pet Retailer",
  veterinary: "Veterinary & Wellness",
  grooming: "Grooming",
  boarding: "Care & Boarding",
  training: "Training",
  memorial: "Memorial Services",
};

export default function VendorCard({ vendor }: { vendor: Vendor }) {
  return (
    <motion.a
      href={`/vendors/${vendor.slug}`}
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className="group flex w-80 max-w-full shrink-0 flex-col overflow-hidden rounded-3xl bg-surface shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-shadow"
    >
      <VendorImagery images={vendor.coverImageUrl ? [vendor.coverImageUrl] : []} category={vendor.category} name={vendor.name} />

      <div className="flex flex-1 flex-col gap-1.5 px-4 pb-4 pt-8">
        <span className="font-data text-[11px] uppercase tracking-wide text-navy/40">
          {categoryLabel[vendor.category] || vendor.category}
        </span>
        <h3 className="font-display text-lg leading-tight text-navy">{vendor.name}</h3>

        {vendor.rating > 0 && <div className="flex items-center gap-1.5 text-sm text-navy/70">
          <Star className="h-4 w-4 fill-sunshine text-sunshine" />
          <span>{vendor.rating}</span>
          <span className="text-navy/40">· {vendor.reviewCount} reviews</span>
        </div>}
        <div className="flex items-center gap-1.5 text-sm text-navy/60">
          <MapPin className="h-4 w-4" />
          <span>{vendor.city}, {vendor.country}</span>
        </div>

        <div className="mt-2 flex items-center justify-between border-t border-paper-dim pt-3 text-sm">
          <span className="text-navy/60">{vendor.productCount} products · {vendor.activeDealCount} deals</span>
          {vendor.maxDiscountPercent > 0 && (
            <span className="font-data font-semibold text-tangerine">Up to {vendor.maxDiscountPercent}% off</span>
          )}
        </div>
      </div>
    </motion.a>
  );
}
