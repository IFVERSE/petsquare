"use client";

import { motion } from "framer-motion";
import { Search, PiggyBank, MapPinned, Globe2, RefreshCw, ShieldCheck } from "lucide-react";

const items = [
  { icon: Search, title: "Discover", body: "Find pet products, services and businesses in one place." },
  { icon: PiggyBank, title: "Save", body: "Discover current deals and promotional offers." },
  { icon: MapPinned, title: "Find Nearby", body: "Locate pet businesses and get directions." },
  { icon: Globe2, title: "Explore Globally", body: "Discover vendors across multiple European markets." },
  { icon: RefreshCw, title: "Fresh Information", body: "Deal and vendor information is periodically checked and updated." },
  { icon: ShieldCheck, title: "Make Informed Decisions", body: "See vendor ratings, product information and details before visiting or purchasing." },
];

export default function WhyPetSquare() {
  return (
    <section className="bg-surface py-16">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <h2 className="font-display text-3xl text-navy">Why Pet Owners Choose PetSquare</h2>
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it, i) => (
            <motion.div
              key={it.title}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="rounded-2xl bg-paper p-6"
            >
              <it.icon className="h-6 w-6 text-tangerine" />
              <h3 className="mt-3 font-display text-lg text-navy">{it.title}</h3>
              <p className="mt-1 text-sm text-navy/60">{it.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
