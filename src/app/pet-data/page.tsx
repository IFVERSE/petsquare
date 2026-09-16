import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import PetDataExplorer from '@/components/pet-data/PetDataExplorer';
import { readProductFeed } from '@/lib/products/feed';
import { Suspense } from 'react';
export const metadata = { title: 'Pet Product Finder — Compare & Save | PetSquare', description: 'Find products for your pet, compare package prices and save your favourites. Browse recently checked offers from pet retailers.' };
export const dynamic = 'force-dynamic';
export default async function PetDataPage() {
  const feed = await readProductFeed();
  return <><Navbar /><main className="min-h-[70vh] bg-paper"><Suspense fallback={<p className="p-8 text-navy/60">Loading your product finder…</p>}><PetDataExplorer initialFeed={feed} /></Suspense></main><Footer /></>;
}
