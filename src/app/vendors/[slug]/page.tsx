import { notFound } from "next/navigation";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import VendorProfile from "@/components/vendors/VendorProfile";
import { vendors as mockVendors } from "@/lib/mock-data";
import { getVendorBySlug } from "@/lib/data/vendors";
import { getDealsForVendor } from "@/lib/data/deals";

// Pre-render the Phase 1 demo vendor pages at build time; real scraped
// vendors render on-demand (dynamicParams defaults to true in the App
// Router), since their slugs aren't known until the scraper has run.
export function generateStaticParams() {
  return mockVendors.map((v) => ({ slug: v.slug }));
}

export default async function VendorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const vendor = await getVendorBySlug(slug);
  if (!vendor) notFound();
  const vendorDeals = await getDealsForVendor(vendor.id);

  return (
    <>
      <Navbar />
      <main className="min-h-[70vh] bg-paper">
        <VendorProfile vendor={vendor} deals={vendorDeals} />
      </main>
      <Footer />
    </>
  );
}
