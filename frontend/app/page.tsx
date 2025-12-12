import HomeRedirect from "@/components/home/HomeRedirect";
import type { Metadata } from "next";
import Header from "@/components/landing/Header";
import HeroSection from "@/components/landing/HeroSection";
import LogoCarousel from "@/components/landing/LogoCarousel";
import FeaturesTabs from "@/components/landing/FeaturesTabs";
import HowItWorksTabs from "@/components/landing/HowItWorksTabs";
import SocialProofSection from "@/components/landing/SocialProofSection";
import TestimonialCarousel from "@/components/landing/TestimonialCarousel";
import FAQSection from "@/components/landing/FAQSection";
import FinalCTA from "@/components/landing/FinalCTA";
import Footer from "@/components/landing/Footer";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

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
      <FAQSection />
      <FinalCTA />
      <Footer />
    </main>
  );
}
