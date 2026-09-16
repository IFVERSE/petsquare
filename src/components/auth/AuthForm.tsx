"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Info, Loader2 } from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import Logo from "@/components/ui/Logo";
import { localeFromPathname } from "@/i18n/config";

const configured = isSupabaseConfigured;

export default function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedNext = searchParams.get("next");
  const next = requestedNext?.startsWith("/") && !requestedNext.startsWith("//")
    ? requestedNext : "/dashboard";

  const [accountType, setAccountType] = useState<"owner" | "vendor">("owner");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    if (!supabase) {
      setError("Supabase isn't configured yet — see the note below.");
      setLoading(false);
      return;
    }

    try {
      if (mode === "sign-up") {
        const locale = localeFromPathname(window.location.pathname) || "en";
        const response = await fetch("/api/auth/sign-up", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName,
            email,
            password,
            accountType: accountType === "owner" ? "pet_owner" : "vendor",
          }),
        });

        const result = (await response.json()) as { error?: string };
        if (!response.ok) {
          throw new Error(result.error || "We could not create your account.");
        }

        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });
        if (signInError) throw signInError;

        router.replace(`/${locale}/dashboard`);
        router.refresh();
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        router.replace(next);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-5 py-16">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <Logo size={36} />
        <span className="font-display text-xl font-semibold text-navy">
          Pet<span className="text-tangerine">Square</span>
        </span>
      </Link>

      <h1 className="font-display text-2xl text-navy">
        {mode === "sign-in" ? "Welcome back" : "Create your account"}
      </h1>
      <p className="mt-1 text-sm text-navy/60">
        {mode === "sign-in"
          ? "Sign in to unlock the full vendor directory, map and deals."
          : "Join PetSquare as a pet owner or list your business."}
      </p>

      {mode === "sign-up" && <div className="mt-6 flex rounded-2xl border border-paper-dim bg-surface p-1">
        <button
          type="button"
          onClick={() => setAccountType("owner")}
          className={`flex-1 rounded-xl py-2 text-sm font-medium transition-colors ${accountType === "owner" ? "bg-abyss text-white" : "text-navy/60"}`}
        >
          🐾 Pet Owner
        </button>
        <button
          type="button"
          onClick={() => setAccountType("vendor")}
          className={`flex-1 rounded-xl py-2 text-sm font-medium transition-colors ${accountType === "vendor" ? "bg-abyss text-white" : "text-navy/60"}`}
        >
          🏪 Vendor
        </button>
      </div>}

      <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3">
        {mode === "sign-up" && (
          <input
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Full name"
            className="rounded-xl border border-paper-dim px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-tangerine/30"
          />
        )}
        <input
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address"
          type="email"
          className="rounded-xl border border-paper-dim px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-tangerine/30"
        />
        <div className="relative">
          <input
            id="auth-password"
            aria-label="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            type={showPassword ? "text" : "password"}
            autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
            spellCheck={false}
            autoCapitalize="none"
            minLength={6}
            className="w-full rounded-xl border border-paper-dim px-4 py-3 pr-14 text-sm focus:outline-none focus:ring-2 focus:ring-tangerine/30"
          />
          <button
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-controls="auth-password"
            title={showPassword ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-navy/60 hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tangerine/50"
          >
            {showPassword ? <EyeOff aria-hidden="true" className="h-5 w-5" /> : <Eye aria-hidden="true" className="h-5 w-5" />}
          </button>
        </div>

        {error && <p className="text-sm text-coral">{error}</p>}
        <button
          type="submit"
          disabled={loading || !configured}
          className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-tangerine py-3 text-sm font-semibold text-white transition-colors hover:bg-tangerine-light disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {mode === "sign-in" ? "Sign in" : "Create account"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-navy/50">
        {mode === "sign-in" ? (
          <>Don&apos;t have an account? <a href="/auth/sign-up" className="font-medium text-tangerine">Sign up</a></>
        ) : (
          <>Already have an account? <a href="/auth/sign-in" className="font-medium text-tangerine">Sign in</a></>
        )}
      </p>

      {!configured && (
        <div className="mt-5 flex items-start gap-2 rounded-xl bg-sage-light p-3 text-xs text-navy/60">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-sage" />
          <p>
            Supabase isn&apos;t configured yet — copy <code>.env.example</code> to{" "}
            <code>.env.local</code> and add your project URL/anon key to enable real sign-in.
            See the README for the full Phase 2 setup steps.
          </p>
        </div>
      )}
    </div>
  );
}
