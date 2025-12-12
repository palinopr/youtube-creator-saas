import HomeRedirect from "@/components/home/HomeRedirect";
import Header from "@/components/landing/Header";
import HeroSection from "@/components/landing/HeroSection";
import LogoCarousel from "@/components/landing/LogoCarousel";
import FeaturesTabs from "@/components/landing/FeaturesTabs";
import HowItWorksTabs from "@/components/landing/HowItWorksTabs";
import SocialProofSection from "@/components/landing/SocialProofSection";
import TestimonialCarousel from "@/components/landing/TestimonialCarousel";
import PricingSection from "@/components/landing/PricingSection";
import FAQSection from "@/components/landing/FAQSection";
import FinalCTA from "@/components/landing/FinalCTA";
import Footer from "@/components/landing/Footer";

export default function HomePage() {
  return (
    <main className="landing-bg min-h-screen">
      <HomeRedirect />
      <Header />
      <HeroSection />
      <LogoCarousel />
      <FeaturesTabs />
      <HowItWorksTabs />
      <SocialProofSection />
      <TestimonialCarousel />
      <PricingSection />
      <FAQSection />
      <FinalCTA />
      <Footer />
    </main>
  );
}

