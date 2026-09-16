import Link from "next/link";
import {
  LayoutDashboard, Users, ShieldCheck, ExternalLink, Store, Package,
  ShieldAlert, MessageSquare, UserCog, Bot, ScrollText,
} from "lucide-react";
import Logo from "@/components/ui/Logo";

const navGroups = [
  {
    label: "Overview",
    items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Marketplace",
    items: [
      { href: "/admin/vendors", label: "Vendors", icon: Store },
      { href: "/admin/deals", label: "Deals", icon: Package },
      { href: "/admin/scraper", label: "Scraper Monitor", icon: Bot },
    ],
  },
  {
    label: "Community",
    items: [
      { href: "/admin/reports", label: "Reports", icon: ShieldAlert },
      { href: "/admin/comments", label: "Comments", icon: MessageSquare },
      { href: "/admin/users", label: "Users", icon: UserCog },
    ],
  },
  {
    label: "Platform",
    items: [
      { href: "/admin/access", label: "Admin Access", icon: Users },
      { href: "/admin/audit-logs", label: "Audit Logs", icon: ScrollText },
    ],
  },
];

export default function AdminSidebar({ roleLabel, email }: { roleLabel: string; email: string }) {
  return (
    <>
    <details className="w-full border-b border-paper-dim bg-surface p-4 lg:hidden">
      <summary className="cursor-pointer rounded-xl px-2 py-2 text-sm font-semibold text-navy">Admin menu</summary>
      <nav className="mt-3 flex max-h-[70dvh] flex-col gap-3 overflow-y-auto border-t border-paper-dim pt-3">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="px-3 text-xs font-semibold uppercase text-navy/50">{group.label}</p>
            {group.items.map((item) => (
              <Link key={item.href} href={item.href} className="flex items-center gap-2.5 rounded-xl px-3 py-3 text-sm font-medium text-navy/80 hover:bg-paper">
                <item.icon className="h-4 w-4" /> {item.label}
              </Link>
            ))}
          </div>
        ))}
        <Link href="/" className="flex items-center gap-2.5 rounded-xl px-3 py-3 text-sm text-navy/70"><ExternalLink className="h-4 w-4" /> Back to site</Link>
        <div className="rounded-xl bg-sage-light p-3 text-xs text-sage">{roleLabel} · {email}</div>
      </nav>
    </details>
    <aside className="hidden w-64 shrink-0 flex-col overflow-y-auto border-r border-paper-dim bg-surface p-5 lg:flex">
      <Link href="/" className="mb-6 flex items-center gap-2">
        <Logo size={32} />
        <span className="font-display text-lg text-navy">
          Pet<span className="text-tangerine">Square</span>
        </span>
      </Link>

      <nav className="flex flex-1 flex-col gap-4">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="px-3 text-[10px] font-semibold uppercase tracking-wide text-navy/30">{group.label}</p>
            <div className="mt-1 flex flex-col gap-0.5">
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-navy/70 transition-colors hover:bg-paper hover:text-navy"
                >
                  <item.icon className="h-4 w-4" /> {item.label}
                </Link>
              ))}
            </div>
          </div>
        ))}

        <div className="rounded-xl bg-paper p-3 text-xs text-navy/40">
          CMS (blog/pages), newsletters, country/language management and a
          notification center aren&apos;t built yet — see the README for what&apos;s
          still Phase 7+.
        </div>
      </nav>

      <Link href="/" className="mb-3 mt-4 flex items-center gap-2 text-xs text-navy/40 hover:text-navy/60">
        <ExternalLink className="h-3.5 w-3.5" /> Back to site
      </Link>

      <div className="flex items-center gap-2 rounded-xl bg-sage-light p-3">
        <ShieldCheck className="h-4 w-4 shrink-0 text-sage" />
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-sage">{roleLabel}</p>
          <p className="truncate text-xs text-navy/50">{email}</p>
        </div>
      </div>
    </aside>
    </>
  );
}
