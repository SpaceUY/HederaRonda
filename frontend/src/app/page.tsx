import { Footer } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';
import { FeaturesSection } from '@/components/sections/features';
import { HeroSection } from '@/components/sections/hero';
import { HowItWorksSection } from '@/components/sections/how-it-works';
import { SecuritySection } from '@/components/sections/security';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <SecuritySection />
      </main>
      <Footer />
    </div>
  );
}