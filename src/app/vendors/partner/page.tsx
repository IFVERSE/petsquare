import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

export const metadata = { title: "Partner With PetSquare" };

export default function PartnerPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-5 text-center">
        <h1 className="font-display text-3xl text-navy">🤝 Partner With PetSquare</h1>
        <p className="mt-3 text-navy/60">
          Reach out to our partnerships team once the vendor backend is live — this route is reserved for that flow.
        </p>
        <a href="mailto:partners@petsquare.example" className="mt-6 rounded-full border border-navy/15 px-6 py-3 text-sm font-semibold text-navy">
          partners@petsquare.example
        </a>
      </main>
      <Footer />
    </>
  );
}
