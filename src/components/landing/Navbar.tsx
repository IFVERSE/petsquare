"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, Store, Menu, X, LogOut, ShieldCheck, LayoutDashboard } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Logo from "@/components/ui/Logo";
import ThemeToggle from "@/components/theme/ThemeToggle";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import { useI18n } from "@/i18n/I18nProvider";

export default function Navbar() {
  const { t, href } = useI18n();
  const links = [
    { label: t("discover"), href: "/" },
    { label: t("deals"), href: "/deals" },
    { label: "Live products", href: "/pet-data" },
    { label: t("vendors"), href: "/vendors" },
    { label: t("services"), href: "/vendors?type=service" },
    { label: t("forPets"), href: "/#for-pets" },
    { label: t("locations"), href: "/vendors?view=map" },
  ];
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setEmail(user?.email ?? null);
      if (user) {
        const { data } = await supabase
          .from("admin_access")
          .select("status")
          .eq("user_id", user.id)
          .eq("status", "active")
          .maybeSingle();
        setIsAdmin(!!data);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
      if (!session) setIsAdmin(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    router.push(href("/"));
    router.refresh();
  }

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-paper-dim bg-paper">
      <nav className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-3.5 lg:px-8">
        <a href={href("/")} className="flex shrink-0 items-center gap-2">
          <Logo size={36} />
          <span className="font-display text-xl font-semibold text-navy">
            Pet<span className="text-tangerine">Square</span>
          </span>
        </a>

        <div className="order-3 hidden w-full flex-wrap items-center justify-center gap-x-8 gap-y-3 border-t border-paper-dim pt-3 lg:flex">
          {links.map((l) => (
            <a
              key={l.label}
              href={href(l.href)}
              className="whitespace-nowrap text-sm font-medium text-navy/70 transition-colors hover:text-navy"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="hidden flex-wrap items-center justify-end gap-x-4 gap-y-3 lg:flex">
          <LanguageSwitcher />
          <ThemeToggle />
          <a href={href('/dashboard/saved')} className="flex items-center gap-1.5 whitespace-nowrap text-sm text-navy/70 hover:text-navy">
            <Heart className="h-4 w-4" /> {t("saved")}
          </a>

          {isAdmin && (
            <a href={href("/admin")} className="flex items-center gap-1.5 whitespace-nowrap text-sm font-medium text-sage hover:text-sage/80">
              <ShieldCheck className="h-4 w-4" /> {t("admin")}
            </a>
          )}

          {email && (
            <a href={href("/dashboard")} className="flex items-center gap-1.5 whitespace-nowrap text-sm font-medium text-navy/70 hover:text-navy">
              <LayoutDashboard className="h-4 w-4" /> {t("myPetSquare")}
            </a>
          )}

          {email ? (
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 whitespace-nowrap rounded-full border border-navy/15 px-4 py-2 text-sm font-medium text-navy hover:bg-navy/5"
            >
              <LogOut className="h-3.5 w-3.5" /> {t("signOut")}
            </button>
          ) : (
            <a
              href={href("/auth/sign-in")}
              className="whitespace-nowrap rounded-full border border-navy/15 px-4 py-2 text-sm font-medium text-navy hover:bg-navy/5"
            >
              {t("signIn")}
            </a>
          )}
          <a
            href={href("/vendors/list-your-business")}
            className="flex items-center gap-1.5 whitespace-nowrap rounded-full bg-tangerine px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-tangerine-light"
          >
            <Store className="h-4 w-4" /> {t("forVendors")}
          </a>
        </div>

        <div className="flex items-center gap-3 lg:hidden">
          <ThemeToggle compact />
          <LanguageSwitcher compact />
          <button onClick={() => setOpen((o) => !o)} aria-label={t("toggleMenu")} aria-expanded={open} aria-controls="mobile-navigation" className="flex h-11 w-11 items-center justify-center">
            {open ? <X className="h-6 w-6 text-navy" /> : <Menu className="h-6 w-6 text-navy" />}
          </button>
        </div>
      </nav>

      {open && (
        <div id="mobile-navigation" className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-paper-dim bg-paper px-5 py-4 lg:hidden">
          <div className="flex flex-col gap-4">
            <a href={href('/dashboard/saved')} className="flex items-center gap-1.5 text-sm font-medium text-navy/80">
              <Heart className="h-4 w-4" /> {t("saved")}
            </a>
            {links.map((l) => (
              <a key={l.label} href={href(l.href)} className="text-sm font-medium text-navy/80">
                {l.label}
              </a>
            ))}
            {isAdmin && (
              <a href={href("/admin")} className="flex items-center gap-1.5 text-sm font-medium text-sage">
                <ShieldCheck className="h-4 w-4" /> {t("admin")}
              </a>
            )}
            {email && (
              <a href={href("/dashboard")} className="flex items-center gap-1.5 text-sm font-medium text-navy/80">
                <LayoutDashboard className="h-4 w-4" /> {t("myPetSquare")}
              </a>
            )}
            <div className="mt-2 flex flex-wrap gap-3">
              {email ? (
                <button onClick={handleSignOut} className="flex-1 rounded-full border border-navy/15 px-4 py-2 text-center text-sm font-medium text-navy">
                  {t("signOut")}
                </button>
              ) : (
                <a href={href("/auth/sign-in")} className="flex-1 rounded-full border border-navy/15 px-4 py-2 text-center text-sm font-medium text-navy">
                  {t("signIn")}
                </a>
              )}
              <a href={href("/vendors/list-your-business")} className="flex-1 rounded-full bg-tangerine px-4 py-2 text-center text-sm font-semibold text-white">
                {t("forVendors")}
              </a>
            </div>
          </div>
        </div>
      )}
      </header>
    </>
  );
}
