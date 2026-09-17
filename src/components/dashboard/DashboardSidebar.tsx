import { LayoutDashboard, PawPrint, Heart, Bell, Sparkles, ExternalLink, Store, Menu, ChevronDown } from "lucide-react";
import Link from "next/link";
import Logo from "@/components/ui/Logo";

const nav = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/pets", label: "My Pets", icon: PawPrint },
  { href: "/dashboard/saved", label: "Saved Vendors & Deals", icon: Heart },
  { href: "/dashboard/alerts", label: "Price Alerts", icon: Bell },
  { href: "/dashboard/assistant", label: "Pawspero", icon: Sparkles },
  { href: "/dashboard/business", label: "My Business", icon: Store },
];

export default function DashboardSidebar({
  name,
  email,
  accountType,
}: {
  name: string;
  email: string;
  accountType: string;
}) {
  return (
    <>
    <details className="group w-full border-b border-paper-dim bg-surface p-4 lg:hidden">
      <summary className="flex min-h-12 cursor-pointer list-none items-center gap-3 rounded-xl bg-abyss px-4 py-3 text-sm font-semibold text-white shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-tangerine focus-visible:ring-offset-2 focus-visible:ring-offset-surface [&::-webkit-details-marker]:hidden">
        <Menu aria-hidden="true" className="h-5 w-5 shrink-0" />
        <span className="flex-1">{accountType === "vendor" ? "Vendor dashboard menu" : "My dashboard menu"}</span>
        <ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" />
      </summary>
      <nav className="mt-3 flex max-h-[70dvh] flex-col gap-1 overflow-y-auto border-t border-paper-dim pt-3">
        {nav.map((item) => (
          <Link key={item.href} href={item.href} className="flex items-center gap-2.5 rounded-xl px-3 py-3 text-sm font-medium text-navy/80 hover:bg-paper">
            <item.icon className="h-4 w-4" /> {item.label}
          </Link>
        ))}
        <Link href="/" className="flex items-center gap-2.5 rounded-xl px-3 py-3 text-sm text-navy/70"><ExternalLink className="h-4 w-4" /> Back to site</Link>
        <div className="rounded-xl bg-sage-light p-3 text-xs text-sage">{name} · {email}</div>
      </nav>
    </details>
    <aside className="hidden w-64 shrink-0 flex-col border-r border-paper-dim bg-surface p-5 lg:flex">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <Logo size={32} />
        <span className="font-display text-lg text-navy">
          Pet<span className="text-tangerine">Square</span>
        </span>
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-navy/70 transition-colors hover:bg-paper hover:text-navy"
          >
            <item.icon className="h-4 w-4" /> {item.label}
          </Link>
        ))}

        {accountType === "vendor" && (
          <div className="mt-4 rounded-xl bg-paper p-3 text-xs text-navy/40">
            Registered as a Vendor account — set up your business under
            &ldquo;My Business&rdquo; above.
          </div>
        )}
      </nav>

      <Link href="/" className="mb-3 flex items-center gap-2 text-xs text-navy/40 hover:text-navy/60">
        <ExternalLink className="h-3.5 w-3.5" /> Back to site
      </Link>

      <div className="flex items-center gap-2 rounded-xl bg-sage-light p-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sage text-sm text-white">
          {name.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-sage">{name}</p>
          <p className="truncate text-xs text-navy/50">{email}</p>
        </div>
      </div>
    </aside>
    </>
  );
}
