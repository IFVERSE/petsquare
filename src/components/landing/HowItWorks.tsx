"use client";

import { motion } from "framer-motion";

const steps = [
  { n: "01", title: "Search", body: "Search for a product, service, breed or vendor." },
  { n: "02", title: "Compare", body: "Compare prices, discounts, ratings, locations and available information." },
  { n: "03", title: "Discover & Shop", body: "Visit the vendor, contact them or get directions." },
];

export default function HowItWorks() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
      <h2 className="font-display text-3xl text-navy">How PetSquare Works</h2>
      <div className="relative mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3">
        <div className="absolute left-0 right-0 top-6 hidden h-px bg-paper-dim sm:block" />
        {steps.map((s, i) => (
          <motion.div
            key={s.n}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.15 }}
            className="relative"
          >
            <span className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-abyss font-data text-sm font-semibold text-white">
              {s.n}
            </span>
            <h3 className="mt-4 font-display text-xl text-navy">{s.title}</h3>
            <p className="mt-1 text-sm text-navy/60">{s.body}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
