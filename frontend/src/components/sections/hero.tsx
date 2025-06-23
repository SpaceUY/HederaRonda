'use client';

import { ArrowRight, Play } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { useVerification } from '@/hooks/use-verification';

export function HeroSection() {
  const { verificationState } = useVerification();

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse-subtle" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse-subtle" style={{ animationDelay: '1s' }} />
      </div>

      <div className="container-max container-padding relative z-10">
        <div className="text-center space-y-8 max-w-4xl mx-auto">
          {/* Main Headline */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-balance leading-tight">
            Your secure and{' '}
            <span className="text-primary">decentralized</span>{' '}
            digital RONDA
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-muted-foreground text-balance max-w-3xl mx-auto">
            Save, access liquidity, and build trust with blockchain technology. 
            Join rotating savings groups without intermediaries.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button size="lg" className="text-lg px-8 py-6 group" asChild>
              <Link href={verificationState.isReadyToJoin ? "/dashboard" : "/auth"}>
                {verificationState.isReadyToJoin ? "Go to Dashboard" : "Login with World ID"}
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="text-lg px-8 py-6 group"
              onClick={() => scrollToSection('how-it-works')}
            >
              <Play className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
              See how it works
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="pt-16 space-y-6">
            <p className="text-sm text-muted-foreground">Trusted by RONDAs worldwide</p>
            <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                  <span className="text-primary font-bold text-xs">CL</span>
                </div>
                <span className="text-sm font-medium">Chainlink</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xs">W</span>
                </div>
                <span className="text-sm font-medium">World ID</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-success/20 rounded-lg flex items-center justify-center">
                  <span className="text-success font-bold text-xs">✓</span>
                </div>
                <span className="text-sm font-medium">Audited</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-info/20 rounded-lg flex items-center justify-center">
                  <span className="text-info font-bold text-xs">🔒</span>
                </div>
                <span className="text-sm font-medium">Secure</span>
              </div>
            </div>
            
            {/* Powered by badges */}
            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <div className="inline-flex items-center px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-sm font-medium text-primary">
                <span className="w-2 h-2 bg-primary rounded-full mr-2 animate-pulse" />
                Powered by Chainlink
              </div>
              <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500/10 to-purple-600/10 border border-blue-500/20 rounded-full text-sm font-medium text-blue-600">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse" />
                Secured by World ID
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}