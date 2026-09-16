import Logo from "@/components/ui/Logo";

const columns = [
  { title: "PetSquare", links: ["About", "Contact", "Careers", "Blog"] },
  { title: "Discover", links: ["Pet Deals", "Vendors", "Products", "Services", "Locations"] },
  { title: "For Vendors", links: ["List Your Business", "Vendor Dashboard", "Promote a Deal", "Partner With Us"] },
  { title: "Support", links: ["Help Center", "Report a Vendor", "Report Incorrect Information", "Privacy", "Terms", "Cookies"] },
];

export default function Footer() {
  return (
    <footer className="bg-abyss pt-16">
      <div className="mx-auto max-w-7xl px-5 pb-10 lg:px-8">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="font-display text-sm text-white">{col.title}</h4>
              <ul className="mt-3 space-y-2">
                {col.links.map((l) => (
                  <li key={l}>
                    <a href="#" className="text-sm text-white/50 hover:text-white/80">{l}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 sm:flex-row">
          <p className="flex items-center gap-2 text-sm text-white/40">
            <Logo size={28} />
            © 2026 PetSquare. All rights reserved.
          </p>
          <p className="text-xs text-white/30">
            Location data ? <a href="https://www.openstreetmap.org/copyright" className="underline">OpenStreetMap contributors</a>.{" "}
            PetSquare aggregates publicly available vendor and product information for discovery purposes.
            Prices, availability and promotions may change — verify directly with the vendor.
          </p>
        </div>
      </div>
    </footer>
  );
}
