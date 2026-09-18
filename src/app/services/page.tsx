import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import ServiceFinder from "@/components/services/ServiceFinder";
import { getVendors } from "@/lib/data/vendors";

export const metadata = { title: "Pet services and care finder — PetSquare", description: "Find the right pet care service, prepare for a visit, and compare local providers." };

export default async function ServicesPage() {
  const vendors = await getVendors();
  return <><Navbar /><main className="min-h-[70vh] bg-paper"><ServiceFinder vendors={vendors} /></main><Footer /></>;
}
