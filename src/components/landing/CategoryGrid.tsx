"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { categories, serviceCategories } from "@/lib/mock-data";

export default function CategoryGrid() {
  const all = [...categories, ...serviceCategories];
  return (
    <section className="bg-surface py-16">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <p className="font-data text-xs uppercase tracking-widest text-sage">🐾 Explore PetSquare</p>
        <h2 className="mt-1 font-display text-3xl text-navy">Browse by Category</h2>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {all.map((c, i) => (
            <motion.a
              key={c.id}
              href={`/deals?category=${c.id}`}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.04 }}
              whileHover={{ y: -4 }}
              className="group relative h-36 overflow-hidden rounded-2xl"
            >
              <Image src={c.image} alt={c.label} fill sizes="200px" className="object-cover transition-transform duration-500 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-abyss/80 via-abyss/10 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3">
                <span className="text-xl">{c.emoji}</span>
                <p className="mt-0.5 font-display text-sm leading-tight text-white">{c.label}</p>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
