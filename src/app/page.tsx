import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import TrendingDeals from "@/components/landing/TrendingDeals";
import LeashDivider from "@/components/landing/LeashDivider";
import CategoryGrid from "@/components/landing/CategoryGrid";
import NearbyPreview from "@/components/landing/NearbyPreview";
import BrowseByPet from "@/components/landing/BrowseByPet";
import DealsEndingSoon from "@/components/landing/DealsEndingSoon";
import TrustedVendors from "@/components/landing/TrustedVendors";
import WhyPetSquare from "@/components/landing/WhyPetSquare";
import HowItWorks from "@/components/landing/HowItWorks";
import { PersonalizeCTA, VendorCTA, FinalCTA } from "@/components/landing/CTASections";
import Footer from "@/components/landing/Footer";
import RecentOsmResults from "@/components/landing/RecentOsmResults";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <RecentOsmResults />
        <TrendingDeals />
        <RecentOsmResults dealsOnly />
        <LeashDivider />
        <CategoryGrid />
        <NearbyPreview />
        <BrowseByPet />
        <DealsEndingSoon />
        <TrustedVendors />
        <WhyPetSquare />
        <HowItWorks />
        <PersonalizeCTA />
        <VendorCTA />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
