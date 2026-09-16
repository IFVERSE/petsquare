import Link from "next/link";
import { ShieldX } from "lucide-react";

export const metadata = { title: "Unauthorized — PetSquare Admin" };

export default function UnauthorizedPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-5 text-center">
      <ShieldX className="h-10 w-10 text-coral" />
      <h1 className="mt-4 font-display text-2xl text-navy">Admin access required</h1>
      <p className="mt-2 text-sm text-navy/60">
        Your account either isn&apos;t authorized as a PetSquare administrator, or
        Supabase hasn&apos;t been configured yet for this project (see the README for
        Phase 2 setup). Only emails the Super Admin has explicitly authorized can
        access the Admin Panel.
      </p>
      <Link href="/" className="mt-6 rounded-full bg-abyss px-6 py-3 text-sm font-semibold text-white">
        Back to PetSquare
      </Link>
    </div>
  );
}
