import { Navbar } from "@/components/locatomed/landing/navbar";
import { HeroSection } from "@/components/locatomed/landing/hero-section";
import { TrustStrip } from "@/components/locatomed/landing/trust-strip";
import { FeaturesSection } from "@/components/locatomed/landing/features-section";
import { HowItWorks } from "@/components/locatomed/landing/how-it-works";
import { WhyChooseUs } from "@/components/locatomed/landing/why-choose-us";
import { BusinessTeaser } from "@/components/locatomed/landing/business-teaser";
import { Testimonials } from "@/components/locatomed/landing/testimonials";
import { FinalCta } from "@/components/locatomed/landing/final-cta";
import { Footer } from "@/components/locatomed/landing/footer";

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <TrustStrip />
        <FeaturesSection />
        <HowItWorks />
        <WhyChooseUs />
        <BusinessTeaser />
        <Testimonials />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
