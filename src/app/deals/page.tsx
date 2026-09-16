import DiscoveryFeed from "@/components/landing/DiscoveryFeed";
import { Suspense } from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import DealsDirectory from "@/components/vendors/DealsDirectory";
import { getDeals } from "@/lib/data/deals";
import { getVendors } from "@/lib/data/vendors";

export const metadata = { title: "Deals — PetSquare" };

export default async function DealsPage() {
  const [deals, vendors] = await Promise.all([getDeals(), getVendors()]);
  return (
    <>
      <Navbar />
      <main className="min-h-[70vh] bg-paper">
        <DiscoveryFeed dealsOnly />
        <Suspense fallback={null}>
          <DealsDirectory deals={deals} vendors={vendors} />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
