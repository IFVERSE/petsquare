import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import VendorDirectory from "@/components/vendors/VendorDirectory";
import { getVendors } from "@/lib/data/vendors";
import { getDeals } from "@/lib/data/deals";
import { Suspense } from "react";

export const metadata = { title: "Vendors — PetSquare" };

export default async function VendorsPage() {
  const [vendors, deals] = await Promise.all([getVendors(), getDeals()]);
  return (
    <>
      <Navbar />
      <main className="min-h-[70vh] bg-paper">
        <Suspense fallback={<div className="mx-auto max-w-7xl px-5 py-10">Loading vendors…</div>}><VendorDirectory vendors={vendors} deals={deals} /></Suspense>
      </main>
      <Footer />
    </>
  );
}
