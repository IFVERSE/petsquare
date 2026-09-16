"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Search, MapPin } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";

const languages = ["🇬🇧 English", "🇩🇪 Deutsch", "🇫🇷 Français", "🇮🇹 Italiano", "🇪🇸 Español", "🇵🇱 Polski", "🇷🇴 Română", "🇨🇿 Čeština", "🇭🇺 Magyar", "🇵🇹 Português"];

export default function Hero() {
  const { t, href } = useI18n();
  const [query, setQuery] = useState("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) window.location.href = href(`/vendors?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <section className="relative overflow-hidden bg-abyss pb-24 pt-14 lg:pt-20">
      {/* ambient collage imagery */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.14]">
        <Image src="https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=1600&q=60" alt="" fill className="object-cover" />
      </div>

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 gap-12 px-5 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
        <div className="flex flex-col justify-center">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="font-display text-4xl leading-[1.08] text-white sm:text-5xl lg:text-6xl"
          >
            {t("heroOne")}
            <br />
            {t("heroTwo")}
            <br />
            <span className="text-sunshine">{t("heroThree")}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-5 max-w-lg text-lg text-white/70"
          >
            {t("heroBody")}
          </motion.p>

          <motion.form
            onSubmit={handleSearch}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-8 flex items-center gap-2 rounded-2xl bg-surface p-2 shadow-xl"
          >
            <Search className="ml-3 h-5 w-5 shrink-0 text-navy/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="w-full bg-transparent py-2.5 text-sm text-navy placeholder:text-navy/40 focus:outline-none"
            />
            <button
              type="submit"
              className="shrink-0 rounded-xl bg-tangerine px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-tangerine-light"
            >
              {t("search")}
            </button>
          </motion.form>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-6 flex flex-wrap gap-x-4 gap-y-2"
          >
            {languages.map((l) => (
              <span key={l} className="text-xs text-white/50">{l}</span>
            ))}
          </motion.div>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={href("/deals")}
              className="rounded-full bg-tangerine px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-tangerine/20 transition-transform hover:-translate-y-0.5"
            >
              🔎 {t("exploreDeals")}
            </a>
            <a
              href={href("/auth/sign-in?next=/vendors")}
              className="flex items-center gap-1.5 rounded-full border border-white/25 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              <MapPin className="h-4 w-4" /> {t("findVendors")}
            </a>
          </div>
          <p className="mt-3 text-xs text-white/40">{t("signInDirectory")}</p>
        </div>

        <div className="relative hidden lg:block">
          <motion.div
            initial={{ opacity: 0, scale: 0.92, rotate: -3 }}
            animate={{ opacity: 1, scale: 1, rotate: -3 }}
            transition={{ duration: 0.7 }}
            className="absolute right-10 top-0 h-72 w-56 overflow-hidden rounded-[2rem] border-4 border-white/10 shadow-2xl"
          >
            <Image src="https://images.unsplash.com/photo-1552053831-71594a27632d?w=600&q=80" alt={t("dog")} fill className="object-cover" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.92, rotate: 4 }}
            animate={{ opacity: 1, scale: 1, rotate: 4 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="absolute left-4 top-24 h-64 w-52 overflow-hidden rounded-[2rem] border-4 border-white/10 shadow-2xl"
          >
            <Image src="https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=600&q=80" alt={t("cat")} fill className="object-cover" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="tag-card absolute bottom-2 left-16 flex items-center gap-3 bg-surface px-4 py-3 shadow-xl"
          >
            <span className="rounded-full bg-coral px-2 py-1 font-data text-xs font-semibold text-white">-35%</span>
            <div>
              <p className="font-display text-sm text-navy">{t("dogFoodBerlin")}</p>
              <p className="font-data text-xs text-navy/50">{t("verifiedAgo")}</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
