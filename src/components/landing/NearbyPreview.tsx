"use client";

import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { vendors } from "@/lib/mock-data";

const services = ["Pet Stores", "Veterinarians", "Groomers", "Pet Hotels", "Dog Walkers", "Training"];

// Rough relative positions for a stylized (non-Google) map preview.
const pins = [
  { top: "28%", left: "38%" }, { top: "55%", left: "62%" }, { top: "40%", left: "70%" },
  { top: "68%", left: "30%" }, { top: "20%", left: "58%" }, { top: "60%", left: "48%" },
];

export default function NearbyPreview() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative h-80 overflow-hidden rounded-3xl bg-sage-light lg:h-96"
        >
          <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(circle,_#16264A_1px,_transparent_1px)] [background-size:22px_22px]" />
          {pins.map((p, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, type: "spring", stiffness: 250 }}
              style={{ top: p.top, left: p.left }}
              className="absolute flex -translate-x-1/2 -translate-y-full flex-col items-center"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-abyss text-white shadow-md">
                <MapPin className="h-4.5 w-4.5" fill="currentColor" />
              </div>
            </motion.div>
          ))}
          <div className="absolute bottom-4 left-4 rounded-xl bg-surface/95 px-3 py-2 text-xs font-medium text-navy shadow-md">
            {vendors.length} vendors nearby · map preview
          </div>
        </motion.div>

        <div>
          <p className="font-data text-xs uppercase tracking-widest text-navy/50">📍 Around you</p>
          <h2 className="mt-1 font-display text-3xl text-navy">Pet Services & Stores Near You</h2>
          <ul className="mt-5 grid grid-cols-2 gap-3">
            {services.map((s) => (
              <li key={s} className="flex items-center gap-2 text-sm text-navy/70">
                <span className="h-1.5 w-1.5 rounded-full bg-tangerine" /> {s}
              </li>
            ))}
          </ul>
          <a
            href="/auth/sign-in?next=/vendors?view=map"
            className="mt-6 inline-block rounded-full bg-abyss px-6 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
          >
            Explore Vendors Near Me →
          </a>
          <p className="mt-2 text-xs text-navy/40">Full map & directions unlock after sign-in.</p>
        </div>
      </div>
    </section>
  );
}
