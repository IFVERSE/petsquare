// PetSquare — Phase 1 mock data
//
// Shaped to match the Supabase schema that will replace it in Phase 2
// (see /supabase/schema.sql once the backend build lands). Every field here
// maps 1:1 to a scraper-verified column so swapping mock -> live data later
// is a drop-in.

export type ProductCategory =
  | "consumables"
  | "gear"
  | "housing"
  | "hygiene"
  | "enrichment";

export type ServiceCategory =
  | "medical"
  | "grooming"
  | "care"
  | "training"
  | "memorial";

export type Species = "dog" | "cat" | "bird" | "fish" | "exotic";

export type VerificationBadge =
  | "business_verified"
  | "website_verified"
  | "deal_verified"
  | "community_reported";

export interface Vendor {
  id: string;
  slug: string;
  name: string;
  category: string; // "retailer" | "veterinary" | "grooming" | "boarding" | "training" | "memorial" in practice
  species: Species[];
  logoUrl: string;
  coverImageUrl: string;
  rating: number;
  reviewCount: number;
  city: string;
  country: string;
  countryCode?: string;
  address: string;
  lat: number;
  lng: number;
  phone: string;
  website: string;
  placeId: string;
  businessStatus: string;
  badges: VerificationBadge[];
  activeDealCount: number;
  productCount: number;
  maxDiscountPercent: number;
  lastVerified: string; // ISO timestamp
}

export interface Deal {
  id: string;
  vendorId: string;
  productName: string;
  description: string;
  imageUrl: string;
  category: string; // one of the ProductCategory ids in practice, or unset for real scraped rows without a mapped category
  species: Species[];
  originalPrice: number;
  discountPrice: number;
  discountPercent: number;
  currency: string;
  availability: "in_stock" | "limited" | "out_of_stock";
  dealEndsAt: string | null; // null when the vendor gave no explicit end date
  sourceUrl: string;
  source?: "scraped" | "vendor_submitted";
  lastChecked: string; // ISO timestamp
}

export const categories: { id: ProductCategory; label: string; emoji: string; image: string }[] = [
  { id: "consumables", label: "Food & Treats", emoji: "🍖", image: "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=800&q=80" },
  { id: "gear", label: "Gear & Accessories", emoji: "🦴", image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800&q=80" },
  { id: "housing", label: "Beds & Housing", emoji: "🏠", image: "https://images.unsplash.com/photo-1601758125946-6ac8acedf9db?w=800&q=80" },
  { id: "hygiene", label: "Hygiene & Care", emoji: "🧼", image: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800&q=80" },
  { id: "enrichment", label: "Toys & Enrichment", emoji: "🧸", image: "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=800&q=80" },
];

export const serviceCategories: { id: ServiceCategory; label: string; emoji: string; image: string }[] = [
  { id: "medical", label: "Medical & Wellness", emoji: "🏥", image: "https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=800&q=80" },
  { id: "grooming", label: "Grooming", emoji: "✂️", image: "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=800&q=80" },
  { id: "care", label: "Boarding & Daycare", emoji: "🏨", image: "https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?w=800&q=80" },
  { id: "training", label: "Training", emoji: "🎓", image: "https://images.unsplash.com/photo-1587764379873-97837921fd44?w=800&q=80" },
  { id: "memorial", label: "Memorial Services", emoji: "🕊️", image: "https://images.unsplash.com/photo-1544568100-847a948585b9?w=800&q=80" },
];

export const petTypes: { id: Species; label: string; tags: string[]; image: string }[] = [
  { id: "dog", label: "Dogs", tags: ["Food", "Toys", "Grooming", "Training", "Veterinary"], image: "https://images.unsplash.com/photo-1552053831-71594a27632d?w=800&q=80" },
  { id: "cat", label: "Cats", tags: ["Food", "Litter", "Toys", "Grooming", "Veterinary"], image: "https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=800&q=80" },
  { id: "bird", label: "Birds", tags: ["Cages", "Food", "Toys", "Accessories"], image: "https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=800&q=80" },
  { id: "fish", label: "Fish", tags: ["Aquariums", "Filters", "Food", "Equipment"], image: "https://images.unsplash.com/photo-1524704796725-9fc3044a58b2?w=800&q=80" },
  { id: "exotic", label: "Small & Exotic Pets", tags: ["Rabbits", "Hamsters", "Guinea Pigs", "Reptiles"], image: "https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=800&q=80" },
];

export const vendors: Vendor[] = [
  {
    id: "v1", slug: "happy-paws-berlin", name: "Happy Paws Berlin", category: "retailer",
    species: ["dog", "cat"],
    logoUrl: "https://images.unsplash.com/photo-1601758003122-53c40e686a19?w=200&q=80",
    coverImageUrl: "https://images.unsplash.com/photo-1583512603805-3cc6b41f3edb?w=1200&q=80",
    rating: 4.8, reviewCount: 327, city: "Berlin", country: "Germany",
    address: "Torstraße 42, 10119 Berlin, Germany", lat: 52.5296, lng: 13.4013,
    phone: "+49 30 1234567", website: "https://example-happypaws.de",
    placeId: "ChIJ_happy_paws_berlin", businessStatus: "OPERATIONAL",
    badges: ["business_verified", "website_verified", "deal_verified"],
    activeDealCount: 24, productCount: 186, maxDiscountPercent: 40,
    lastVerified: "2026-08-29T06:12:00Z",
  },
  {
    id: "v2", slug: "petworld-munich", name: "PetWorld Munich", category: "retailer",
    species: ["dog", "cat", "bird"],
    logoUrl: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=200&q=80",
    coverImageUrl: "https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=1200&q=80",
    rating: 4.7, reviewCount: 1245, city: "Munich", country: "Germany",
    address: "Sendlinger Str. 18, 80331 München, Germany", lat: 48.1351, lng: 11.5820,
    phone: "+49 89 7654321", website: "https://example-petworld.de",
    placeId: "ChIJ_petworld_munich", businessStatus: "OPERATIONAL",
    badges: ["business_verified", "website_verified", "deal_verified"],
    activeDealCount: 12, productCount: 240, maxDiscountPercent: 28,
    lastVerified: "2026-08-29T05:40:00Z",
  },
  {
    id: "v3", slug: "kot-i-pies-warsaw", name: "Kot i Pies Warsaw", category: "retailer",
    species: ["dog", "cat"],
    logoUrl: "https://images.unsplash.com/photo-1550697851-920b181d8ca8?w=200&q=80",
    coverImageUrl: "https://images.unsplash.com/photo-1517849845537-4d257902861a?w=1200&q=80",
    rating: 4.6, reviewCount: 210, city: "Warsaw", country: "Poland",
    address: "ul. Marszałkowska 100, 00-026 Warszawa, Poland", lat: 52.2297, lng: 21.0122,
    phone: "+48 22 555 0102", website: "https://example-kotipies.pl",
    placeId: "ChIJ_kotipies_warsaw", businessStatus: "OPERATIONAL",
    badges: ["business_verified", "website_verified", "deal_verified"],
    activeDealCount: 18, productCount: 126, maxDiscountPercent: 40,
    lastVerified: "2026-08-29T04:55:00Z",
  },
  {
    id: "v4", slug: "vetcare-vienna", name: "VetCare Vienna", category: "veterinary",
    species: ["dog", "cat", "exotic"],
    logoUrl: "https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=200&q=80",
    coverImageUrl: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=1200&q=80",
    rating: 4.9, reviewCount: 156, city: "Vienna", country: "Austria",
    address: "Mariahilfer Str. 77, 1060 Wien, Austria", lat: 48.1990, lng: 16.3489,
    phone: "+43 1 987654", website: "https://example-vetcarevienna.at",
    placeId: "ChIJ_vetcare_vienna", businessStatus: "OPERATIONAL",
    badges: ["business_verified", "website_verified"],
    activeDealCount: 3, productCount: 14, maxDiscountPercent: 15,
    lastVerified: "2026-08-28T22:10:00Z",
  },
  {
    id: "v5", slug: "aqua-nova-prague", name: "Aqua Nova Prague", category: "retailer",
    species: ["fish"],
    logoUrl: "https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?w=200&q=80",
    coverImageUrl: "https://images.unsplash.com/photo-1524704796725-9fc3044a58b2?w=1200&q=80",
    rating: 4.5, reviewCount: 98, city: "Prague", country: "Czechia",
    address: "Vodičkova 30, 110 00 Praha, Czechia", lat: 50.0810, lng: 14.4270,
    phone: "+420 234 567 890", website: "https://example-aquanova.cz",
    placeId: "ChIJ_aquanova_prague", businessStatus: "OPERATIONAL",
    badges: ["business_verified", "website_verified", "deal_verified"],
    activeDealCount: 9, productCount: 88, maxDiscountPercent: 30,
    lastVerified: "2026-08-29T03:20:00Z",
  },
  {
    id: "v6", slug: "groom-and-glow-lisbon", name: "Groom & Glow Lisbon", category: "grooming",
    species: ["dog", "cat"],
    logoUrl: "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=200&q=80",
    coverImageUrl: "https://images.unsplash.com/photo-1591946614720-90a587da4a36?w=1200&q=80",
    rating: 4.8, reviewCount: 74, city: "Lisbon", country: "Portugal",
    address: "R. Augusta 120, 1100-053 Lisboa, Portugal", lat: 38.7107, lng: -9.1366,
    phone: "+351 21 345 6789", website: "https://example-groomglow.pt",
    placeId: "ChIJ_groomglow_lisbon", businessStatus: "OPERATIONAL",
    badges: ["business_verified", "website_verified"],
    activeDealCount: 5, productCount: 22, maxDiscountPercent: 20,
    lastVerified: "2026-08-28T19:05:00Z",
  },
];

export const deals: Deal[] = [
  {
    id: "d1", vendorId: "v1", productName: "Premium Adult Dog Food 15kg",
    description: "Grain-inclusive dry kibble for adult dogs of all breeds, made with real chicken as the first ingredient and fortified with omega fatty acids for coat health.",
    imageUrl: "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=800&q=80",
    category: "consumables", species: ["dog"], originalPrice: 45.99, discountPrice: 29.99,
    discountPercent: 35, currency: "EUR", availability: "in_stock",
    dealEndsAt: "2026-09-03T22:00:00Z", sourceUrl: "https://example-happypaws.de/products/adult-dog-food-15kg",
    lastChecked: "2026-08-29T06:12:00Z",
  },
  {
    id: "d2", vendorId: "v1", productName: "Orthopedic Memory Foam Dog Bed",
    description: "Supportive orthopedic bed designed for senior and large-breed dogs, with a removable, machine-washable cover.",
    imageUrl: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800&q=80",
    category: "housing", species: ["dog"], originalPrice: 79.0, discountPrice: 59.25,
    discountPercent: 25, currency: "EUR", availability: "in_stock",
    dealEndsAt: null, sourceUrl: "https://example-happypaws.de/products/ortho-bed",
    lastChecked: "2026-08-29T06:12:00Z",
  },
  {
    id: "d3", vendorId: "v3", productName: "Interactive Puzzle Feeder Toy",
    description: "Slow-feed puzzle toy that reduces bloating risk and keeps dogs mentally stimulated during mealtime.",
    imageUrl: "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=800&q=80",
    category: "enrichment", species: ["dog", "cat"], originalPrice: 24.0, discountPrice: 14.4,
    discountPercent: 40, currency: "EUR", availability: "limited",
    dealEndsAt: "2026-08-31T21:00:00Z", sourceUrl: "https://example-kotipies.pl/produkty/puzzle-feeder",
    lastChecked: "2026-08-29T04:55:00Z",
  },
  {
    id: "d4", vendorId: "v2", productName: "Clumping Cat Litter 10L",
    description: "Low-dust, fast-clumping unscented litter suitable for multi-cat households.",
    imageUrl: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800&q=80",
    category: "hygiene", species: ["cat"], originalPrice: 18.5, discountPrice: 13.32,
    discountPercent: 28, currency: "EUR", availability: "in_stock",
    dealEndsAt: null, sourceUrl: "https://example-petworld.de/produkte/katzenstreu-10l",
    lastChecked: "2026-08-29T05:40:00Z",
  },
  {
    id: "d5", vendorId: "v5", productName: "60L Freshwater Aquarium Starter Kit",
    description: "Complete starter kit including tank, filter, LED lighting and a water conditioner sample.",
    imageUrl: "https://images.unsplash.com/photo-1524704796725-9fc3044a58b2?w=800&q=80",
    category: "housing", species: ["fish"], originalPrice: 120.0, discountPrice: 90.0,
    discountPercent: 25, currency: "EUR", availability: "in_stock",
    dealEndsAt: "2026-09-10T20:00:00Z", sourceUrl: "https://example-aquanova.cz/produkty/60l-starter-kit",
    lastChecked: "2026-08-29T03:20:00Z",
  },
  {
    id: "d6", vendorId: "v1", productName: "Reflective Nylon Dog Harness",
    description: "Adjustable, padded harness with reflective stitching for safe evening walks, available in five sizes.",
    imageUrl: "https://images.unsplash.com/photo-1601758125946-6ac8acedf9db?w=800&q=80",
    category: "gear", species: ["dog"], originalPrice: 22.5, discountPrice: 16.88,
    discountPercent: 25, currency: "EUR", availability: "in_stock",
    dealEndsAt: null, sourceUrl: "https://example-happypaws.de/products/reflective-harness",
    lastChecked: "2026-08-29T06:12:00Z",
  },
  {
    id: "d7", vendorId: "v3", productName: "Joint Support Chews for Senior Dogs",
    description: "Glucosamine and chondroitin soft chews formulated to support joint mobility in senior and large-breed dogs.",
    imageUrl: "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=800&q=80",
    category: "consumables", species: ["dog"], originalPrice: 32.0, discountPrice: 27.2,
    discountPercent: 15, currency: "EUR", availability: "in_stock",
    dealEndsAt: "2026-09-01T18:00:00Z", sourceUrl: "https://example-kotipies.pl/produkty/joint-chews",
    lastChecked: "2026-08-29T04:55:00Z",
  },
  {
    id: "d8", vendorId: "v2", productName: "Large Parrot Cage with Play Top",
    description: "Powder-coated steel cage with a fold-out play top, feeding stations and a slide-out cleaning tray.",
    imageUrl: "https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=800&q=80",
    category: "housing", species: ["bird"], originalPrice: 210.0, discountPrice: 168.0,
    discountPercent: 20, currency: "EUR", availability: "in_stock",
    dealEndsAt: null, sourceUrl: "https://example-petworld.de/produkte/papageienkaefig",
    lastChecked: "2026-08-29T05:40:00Z",
  },
];

export function vendorById(id: string) {
  return vendors.find((v) => v.id === id);
}

export function dealsForVendor(vendorId: string) {
  return deals.filter((d) => d.vendorId === vendorId);
}

export function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}
