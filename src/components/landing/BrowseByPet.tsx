"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { petTypes } from "@/lib/mock-data";

export default function BrowseByPet() {
  return (
    <section id="for-pets" className="bg-surface py-16">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <p className="font-data text-xs uppercase tracking-widest text-tangerine">🐶 Personalize your search</p>
        <h2 className="mt-1 font-display text-3xl text-navy">What Kind of Pet Do You Have?</h2>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {petTypes.map((p, i) => (
            <motion.a
              key={p.id}
              href={`/deals?species=${p.id}`}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              whileHover={{ y: -4 }}
              className="group flex flex-col overflow-hidden rounded-2xl border border-paper-dim"
            >
              <div className="relative h-32 w-full overflow-hidden">
                <Image src={p.image} alt={p.label} fill sizes="240px" className="object-cover transition-transform duration-500 group-hover:scale-110" />
              </div>
              <div className="p-4">
                <h3 className="font-display text-base text-navy">{p.label}</h3>
                <p className="mt-1 text-xs text-navy/50">{p.tags.join(" · ")}</p>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
