import Link from "next/link";
import { getVendors } from "@/lib/data/vendors";
import VendorCard from "@/components/ui/VendorCard";

export default async function TrustedVendors() {
  const vendors = await getVendors();

  return (
    <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="font-data text-xs uppercase tracking-widest text-sage">⭐ Verified businesses</p>
          <h2 className="mt-1 font-display text-3xl text-navy">Discover Trusted Pet Vendors</h2>
        </div>
        <Link href="/vendors" className="hidden font-medium text-tangerine hover:underline sm:block">
          Browse all vendors →
        </Link>
      </div>

      <div className="rail -mx-5 flex gap-5 overflow-x-auto px-5 pb-4 lg:mx-0 lg:px-0">
        {vendors.map((v) => (
          <VendorCard key={v.id} vendor={v} />
        ))}
      </div>
    </section>
  );
}
