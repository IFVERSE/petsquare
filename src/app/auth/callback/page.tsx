"use client";

import { useEffect, useState } from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

function Confirmation() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function confirm() {
      const code = params.get("code");
      const nextParam = params.get("next");
      const next = nextParam?.startsWith("/") && !nextParam.startsWith("//") && !nextParam.startsWith("/api/")
        ? nextParam : "/dashboard";
      const supabase = createClient();
      if (!supabase || !code) { setError("This confirmation link is invalid. Please sign in or request a new link."); return; }
      const { error: confirmationError } = await supabase.auth.exchangeCodeForSession(code);
      if (!active) return;
      if (confirmationError) { setError("This confirmation link expired or was opened in a different browser. Please sign in or request a new link."); return; }
      router.replace(next);
      router.refresh();
    }
    void confirm();
    return () => { active = false; };
  }, [params, router]);

  return <main className="mx-auto min-h-[60vh] max-w-md px-5 py-20 text-center">
    <h1 className="font-display text-2xl text-navy">Confirming your account</h1>
    {error ? <><p role="alert" className="mt-4 text-sm text-coral">{error}</p><Link href="/auth/sign-in" className="mt-5 inline-block text-sm font-semibold text-tangerine">Go to sign in</Link></>
      : <p className="mt-4 text-sm text-navy/60">Please wait while we sign you in.</p>}
  </main>;
}

export default function AuthCallbackPage() {
  return <Suspense fallback={<p className="p-10 text-center">Confirming your account…</p>}><Confirmation /></Suspense>;
}
