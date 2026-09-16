import Link from "next/link";
import { UserX } from "lucide-react";

export const metadata = { title: "Account Suspended — PetSquare" };

export default function AccountSuspendedPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-5 text-center">
      <UserX className="h-10 w-10 text-coral" />
      <h1 className="mt-4 font-display text-2xl text-navy">Your account is suspended</h1>
      <p className="mt-2 text-sm text-navy/60">
        A PetSquare administrator has suspended access to your dashboard. If you think this is a
        mistake, contact support and we&apos;ll take a look.
      </p>
      <Link href="/" className="mt-6 rounded-full bg-abyss px-6 py-3 text-sm font-semibold text-white">
        Back to PetSquare
      </Link>
    </div>
  );
}
