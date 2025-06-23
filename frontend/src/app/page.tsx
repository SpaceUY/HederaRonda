import dynamic from 'next/dynamic';

import { Footer } from '@/components/layout/footer';
import { FeaturesSection } from '@/components/sections/features';
import { HeroSection } from '@/components/sections/hero';
import { HowItWorksSection } from '@/components/sections/how-it-works';
import { SecuritySection } from '@/components/sections/security';
import { BoltBadge } from '@/components/ui/bolt-badge';

// Dynamically import Header to avoid SSR issues with Wagmi hooks
const Header = dynamic(() => import('@/components/layout/header').then(mod => ({ default: mod.Header })), {
  ssr: false,
});

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
      <BoltBadge />
    </div>
  );
}