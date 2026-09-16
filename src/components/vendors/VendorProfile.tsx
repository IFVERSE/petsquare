"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star, MapPin, Phone, Globe, Heart, Navigation, BadgeCheck,
  ShieldAlert, X, Send, CheckCircle2,
} from "lucide-react";
import { Vendor, Deal, timeAgo } from "@/lib/mock-data";
import { useSaveItem } from "@/lib/hooks/use-save-item";
import { useTrackProfileView, trackVendorEvent } from "@/lib/hooks/use-track-event";
import { createClient } from "@/lib/supabase/client";
import DealCard from "@/components/ui/DealCard";

const badgeCopy: Record<string, { label: string; desc: string; color: string }> = {
  business_verified: { label: "Business Verified", desc: "Google Business information successfully matched.", color: "text-sage" },
  website_verified: { label: "Website Verified", desc: "Website is active and associated with the business.", color: "text-navy" },
  deal_verified: { label: "Deal Verified", desc: "Product/price information was recently checked.", color: "text-tangerine" },
  community_reported: { label: "Community Reported", desc: "Users have submitted information requiring review.", color: "text-coral" },
};

const reportReasons = [
  "Business permanently closed", "Incorrect information", "Fake listing", "Wrong location",
  "Incorrect price", "Expired discount", "Website unavailable", "Misleading information", "Other",
];

type Comment = { name: string; text: string; date: string };

export default function VendorProfile({ vendor, deals }: { vendor: Vendor; deals: Deal[] }) {
  const [tab, setTab] = useState<"all" | "deals" | "services">("all");
  const { saved, toggle: toggleSaved } = useSaveItem("vendor", vendor.id);
  useTrackProfileView(vendor.id);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState<string | null>(null);
  const [reportSent, setReportSent] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [contactMsg, setContactMsg] = useState("");
  const [contactSent, setContactSent] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);
  const [contactSending, setContactSending] = useState(false);
  const [comments, setComments] = useState<Comment[]>([
    { name: "Sarah", text: "Deal was still available when I visited — great service too.", date: "2 days ago" },
  ]);
  const [commentText, setCommentText] = useState("");

  const isService = ["veterinary", "grooming", "boarding", "training", "memorial"].includes(vendor.category);
  const visibleDeals = tab === "services" ? [] : deals;

  function submitComment() {
    if (!commentText.trim()) return;
    setComments((c) => [{ name: "You", text: commentText.trim(), date: "just now" }, ...c]);
    setCommentText("");
  }

  async function sendContactMessage() {
    if (!contactMsg.trim()) return;
    setContactError(null);

    const supabase = createClient();
    if (!supabase) {
      // Not configured — keep the Phase 1 demo experience working locally.
      setContactSent(true);
      return;
    }

    setContactSending(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = `/auth/sign-in?next=${encodeURIComponent(window.location.pathname)}`;
      return;
    }

    const { error } = await supabase
      .from("vendor_messages")
      .insert({ vendor_id: vendor.id, sender_id: user.id, message: contactMsg.trim() });

    setContactSending(false);
    if (error) {
      setContactError("Couldn't send your message — please try again.");
      return;
    }
    setContactSent(true);
  }

  return (
    <div className="pb-16">
      {/* Header */}
      <div className="relative h-64 w-full overflow-hidden sm:h-80">
        <Image unoptimized src={vendor.coverImageUrl || "/images/categories/retailer.jpg"} alt="" fill sizes="100vw" className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-abyss/80 via-abyss/20 to-transparent" />
      </div>

      <div className="mx-auto max-w-5xl px-5 lg:px-8">
        <div className="-mt-16 flex flex-col items-start gap-4 sm:flex-row sm:items-end">
          <div className="h-28 w-28 overflow-hidden rounded-3xl border-4 border-white bg-surface shadow-lg">
            <Image unoptimized src={vendor.logoUrl} alt={vendor.name} width={112} height={112} className="h-full w-full object-cover" />
          </div>
          <div className="flex-1 pb-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl text-navy sm:text-3xl">{vendor.name}</h1>
              {vendor.badges.includes("business_verified") && (
                <span className="flex items-center gap-1 rounded-full bg-sage-light px-2.5 py-1 text-xs font-medium text-sage">
                  <BadgeCheck className="h-3.5 w-3.5" /> Verified Business
                </span>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-navy/60">
              <span className="flex items-center gap-1"><Star className="h-4 w-4 fill-sunshine text-sunshine" /> {vendor.rating} · {vendor.reviewCount} reviews</span>
              <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {vendor.city}, {vendor.country}</span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-5 flex flex-wrap gap-2.5">
          <a
            href={vendor.website}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackVendorEvent(vendor.id, "website_click")}
            className="flex items-center gap-1.5 rounded-full bg-abyss px-4 py-2.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
          >
            <Globe className="h-4 w-4" /> Visit Website
          </a>
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${vendor.lat},${vendor.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackVendorEvent(vendor.id, "directions_click")}
            className="flex items-center gap-1.5 rounded-full border border-navy/15 px-4 py-2.5 text-sm font-semibold text-navy hover:bg-navy/5"
          >
            <Navigation className="h-4 w-4" /> Directions
          </a>
          <button
            onClick={() => {
              trackVendorEvent(vendor.id, "contact_click");
              setContactOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-full border border-navy/15 px-4 py-2.5 text-sm font-semibold text-navy hover:bg-navy/5"
          >
            <Phone className="h-4 w-4" /> Contact
          </button>
          <button
            onClick={toggleSaved}
            className={`flex items-center gap-1.5 rounded-full border px-4 py-2.5 text-sm font-semibold transition-colors ${
              saved ? "border-coral bg-coral/10 text-coral" : "border-navy/15 text-navy hover:bg-navy/5"
            }`}
          >
            <Heart className={`h-4 w-4 ${saved ? "fill-coral" : ""}`} /> {saved ? "Saved" : "Save Vendor"}
          </button>
        </div>

        {/* Info grid */}
        <div className="mt-8 grid grid-cols-1 gap-4 rounded-3xl bg-surface p-6 shadow-[var(--shadow-card)] sm:grid-cols-2 lg:grid-cols-4">
          <InfoItem label="Address" value={vendor.address} />
          <InfoItem label="Phone" value={vendor.phone} />
          <InfoItem label="Website" value={vendor.website.replace("https://", "")} />
          <InfoItem label="Business status" value="Operational" />
          <InfoItem label="Products" value={`${vendor.productCount}`} />
          <InfoItem label="Active deals" value={`${vendor.activeDealCount}`} />
          <InfoItem label="Google Place ID" value={vendor.placeId} mono />
          <InfoItem label="Last verified" value={timeAgo(vendor.lastVerified)} mono />
        </div>

        {/* Verification badges */}
        <div className="mt-8">
          <h2 className="font-display text-xl text-navy">Vendor Verification</h2>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {vendor.badges.map((b) => (
              <div key={b} className="rounded-2xl border border-paper-dim bg-surface p-4">
                <p className={`flex items-center gap-1.5 text-sm font-semibold ${badgeCopy[b].color}`}>
                  <CheckCircle2 className="h-4 w-4" /> {badgeCopy[b].label}
                </p>
                <p className="mt-1 text-xs text-navy/50">{badgeCopy[b].desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Products / Deals / Services */}
        <div className="mt-8">
          <div className="flex flex-wrap gap-2 border-b border-paper-dim pb-2">
            {(["all", "deals", ...(isService ? (["services"] as const) : [])] as ("all" | "deals" | "services")[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded-t-xl px-4 py-2 text-sm font-medium capitalize transition-colors ${
                  tab === t ? "bg-abyss text-white" : "text-navy/60 hover:bg-paper"
                }`}
              >
                {t === "all" ? "All Products" : t}
              </button>
            ))}
          </div>

          <div className="mt-6">
            {tab === "services" ? (
              <div className="rounded-2xl border border-paper-dim bg-surface p-6">
                <h3 className="font-display text-lg text-navy">🐾 Services Offered</h3>
                <ul className="mt-3 space-y-2 text-sm text-navy/70">
                  <li className="flex items-center justify-between border-b border-paper-dim pb-2">
                    <span>Professional consultation</span><span className="font-data">From €35</span>
                  </li>
                  <li className="flex items-center justify-between border-b border-paper-dim pb-2">
                    <span>Full service package</span><span className="font-data">From €60</span>
                  </li>
                  <li className="flex items-center justify-between pb-2">
                    <span>Mobile / on-site visits</span><span className="font-data">Available</span>
                  </li>
                </ul>
                <button onClick={() => setContactOpen(true)} className="mt-4 rounded-full bg-tangerine px-5 py-2.5 text-sm font-semibold text-white">
                  Book / Contact Vendor →
                </button>
              </div>
            ) : visibleDeals.length > 0 ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {visibleDeals.map((d) => (
                  <DealCard key={d.id} deal={d} vendor={vendor} />
                ))}
              </div>
            ) : (
              <p className="py-10 text-center text-navy/40">No products in this view yet.</p>
            )}
          </div>
        </div>

        {/* Reviews / comments */}
        <div className="mt-10">
          <h2 className="font-display text-xl text-navy">⭐ Pet Owner Feedback</h2>
          <p className="mt-1 text-sm text-navy/50">
            Comments stay on this profile after moderation. Want it public on Google too?{" "}
            <a href="#" className="font-medium text-tangerine hover:underline">Leave a Google review</a> independently.
          </p>

          <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-paper-dim bg-surface p-4 sm:flex-row">
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitComment()}
              placeholder="Share your experience with this vendor..."
              className="w-full rounded-xl border border-paper-dim px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-tangerine/30"
            />
            <button onClick={submitComment} className="flex items-center justify-center gap-1.5 rounded-xl bg-abyss px-4 py-2 text-sm font-semibold text-white">
              <Send className="h-4 w-4" /> Post
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {comments.map((c, i) => (
              <div key={i} className="rounded-2xl bg-paper p-4">
                <p className="text-sm text-navy/80">&ldquo;{c.text}&rdquo;</p>
                <p className="mt-1 text-xs text-navy/40">— {c.name} · PetSquare Member · {c.date}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Report */}
        <div className="mt-10 flex justify-center">
          <button onClick={() => setReportOpen(true)} className="flex items-center gap-1.5 text-sm text-navy/50 hover:text-coral">
            <ShieldAlert className="h-4 w-4" /> Report Vendor
          </button>
        </div>
      </div>

      {/* Contact modal */}
      <AnimatePresence>
        {contactOpen && (
          <Modal onClose={() => { setContactOpen(false); setContactSent(false); setContactMsg(""); setContactError(null); }}>
            {!contactSent ? (
              <>
                <h3 className="font-display text-lg text-navy">Contact {vendor.name}</h3>
                <p className="mt-1 text-sm text-navy/50">
                  Your message is sent through PetSquare — the vendor won&apos;t see your personal email.
                </p>
                <textarea
                  value={contactMsg}
                  onChange={(e) => setContactMsg(e.target.value)}
                  rows={4}
                  placeholder="Hi, is this deal still available?"
                  className="mt-3 w-full rounded-xl border border-paper-dim p-3 text-sm focus:outline-none focus:ring-2 focus:ring-tangerine/30"
                />
                <button
                  onClick={sendContactMessage}
                  disabled={!contactMsg.trim() || contactSending}
                  className="mt-3 w-full rounded-xl bg-tangerine py-2.5 text-sm font-semibold text-white disabled:opacity-40"
                >
                  {contactSending ? "Sending…" : "Send Message"}
                </button>
                {contactError && <p className="mt-2 text-sm text-coral">{contactError}</p>}
              </>
            ) : (
              <div className="py-4 text-center">
                <CheckCircle2 className="mx-auto h-8 w-8 text-sage" />
                <p className="mt-2 font-display text-lg text-navy">Message sent!</p>
                <p className="mt-1 text-sm text-navy/50">{vendor.name} will reply via PetSquare messaging.</p>
              </div>
            )}
          </Modal>
        )}
      </AnimatePresence>

      {/* Report modal */}
      <AnimatePresence>
        {reportOpen && (
          <Modal onClose={() => { setReportOpen(false); setReportReason(null); setReportSent(false); }}>
            {!reportSent ? (
              <>
                <h3 className="font-display text-lg text-navy">Report this vendor</h3>
                <p className="mt-1 text-sm text-navy/50">Reports enter moderation before affecting the public profile.</p>
                <div className="mt-3 grid grid-cols-1 gap-2">
                  {reportReasons.map((r) => (
                    <button
                      key={r}
                      onClick={() => setReportReason(r)}
                      className={`rounded-xl border px-3 py-2 text-left text-sm transition-colors ${
                        reportReason === r ? "border-coral bg-coral/10 text-coral" : "border-paper-dim text-navy/70"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setReportSent(true)}
                  disabled={!reportReason}
                  className="mt-4 w-full rounded-xl bg-coral py-2.5 text-sm font-semibold text-white disabled:opacity-40"
                >
                  Submit Report
                </button>
              </>
            ) : (
              <div className="py-4 text-center">
                <CheckCircle2 className="mx-auto h-8 w-8 text-sage" />
                <p className="mt-2 font-display text-lg text-navy">Thanks — we&apos;ll take a look.</p>
                <p className="mt-1 text-sm text-navy/50">Our moderation team will review this report shortly.</p>
              </div>
            )}
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

function InfoItem({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-navy/40">{label}</p>
      <p className={`mt-0.5 text-sm text-navy ${mono ? "font-data" : ""}`}>{value}</p>
    </div>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-abyss/40 p-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md rounded-3xl bg-surface p-6 shadow-2xl"
      >
        <button onClick={onClose} className="absolute right-4 top-4 text-navy/30 hover:text-navy" aria-label="Close">
          <X className="h-5 w-5" />
        </button>
        {children}
      </motion.div>
    </motion.div>
  );
}
