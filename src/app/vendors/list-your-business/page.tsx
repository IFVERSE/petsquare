import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

export const metadata = { title: "List Your Business — PetSquare" };

export default function ListBusinessPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-5 text-center">
        <h1 className="font-display text-3xl text-navy">🏪 List Your Business on PetSquare</h1>
        <p className="mt-3 text-navy/60">
          Vendor sign-up, the Vendor Dashboard, and deal management tools are part of the Phase 2 backend build
          (Supabase + role-based accounts). For now, this is a placeholder route reserved for that flow.
        </p>
        <a href="/auth/sign-up" className="mt-6 rounded-full bg-tangerine px-6 py-3 text-sm font-semibold text-white">
          Continue to sign up →
        </a>
      </main>
      <Footer />
    </>
  );
}
