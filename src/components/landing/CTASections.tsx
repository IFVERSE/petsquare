"use client";
import Link from "next/link";

import { motion } from "framer-motion";

const petIcons = [
  { emoji: "🐶", label: "Dog" }, { emoji: "🐱", label: "Cat" }, { emoji: "🐦", label: "Bird" },
  { emoji: "🐟", label: "Fish" }, { emoji: "🐰", label: "Small Mammal" }, { emoji: "🦎", label: "Exotic" },
];

export function PersonalizeCTA() {
  return (
    <section className="bg-sage-light py-16">
      <div className="mx-auto max-w-3xl px-5 text-center lg:px-8">
        <h2 className="font-display text-3xl text-navy">💙 Make PetSquare Personal</h2>
        <p className="mt-2 text-navy/70">
          Tell us about your pet and we&apos;ll help you discover relevant products, services and deals.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {petIcons.map((p) => (
            <span key={p.label} className="flex items-center gap-1.5 rounded-full bg-surface px-4 py-2 text-sm text-navy shadow-sm">
              {p.emoji} {p.label}
            </span>
          ))}
        </div>
        <Link
          href="/auth/sign-up"
          className="mt-7 inline-block rounded-full bg-sage px-7 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
        >
          Personalize My PetSquare →
        </Link>
        <p className="mt-2 text-xs text-navy/40">Sign in required — this builds your pet&apos;s profile.</p>
      </div>
    </section>
  );
}

export function VendorCTA() {
  const benefits = ["Business profile", "Product listings", "Deal promotion", "Customer discovery", "Analytics", "Referral visibility"];
  return (
    <section className="bg-abyss py-16">
      <div className="mx-auto max-w-5xl px-5 text-center lg:px-8">
        <h2 className="font-display text-3xl text-white">🏪 Are You a Pet Business?</h2>
        <p className="mx-auto mt-2 max-w-xl text-white/60">
          Get discovered by pet owners actively looking for products, services and great deals.
        </p>
        <div className="mx-auto mt-6 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-3">
          {benefits.map((b) => (
            <span key={b} className="rounded-xl bg-white/10 px-3 py-2 text-sm text-white/80">{b}</span>
          ))}
        </div>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link href="/vendors/list-your-business" className="rounded-full bg-tangerine px-6 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5">
            List Your Business
          </Link>
          <Link href="/vendors/partner" className="rounded-full border border-white/25 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10">
            Partner With PetSquare
          </Link>
        </div>
        <p className="mt-2 text-xs text-white/40">Sign up required before your business can be listed.</p>
      </div>
    </section>
  );
}

export function FinalCTA() {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="bg-tangerine py-16 text-center"
    >
      <div className="mx-auto max-w-2xl px-5 lg:px-8">
        <h2 className="font-display text-3xl text-white">🐾 Your Pet Deserves the Best.</h2>
        <p className="mt-2 text-white/85">
          Discover trusted pet businesses, products, services and deals — all in one place.
        </p>
        <Link href="/deals" className="mt-6 inline-block rounded-full bg-abyss px-8 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5">
          Explore PetSquare →
        </Link>
      </div>
    </motion.section>
  );
}
