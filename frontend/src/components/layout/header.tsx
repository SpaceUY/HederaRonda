'use client';

import { useState, useEffect } from 'react';
import { Menu, X, Eye } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useVerification } from '@/hooks/use-verification';

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { verificationState } = useVerification();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    // Only scroll if we're on the home page
    if (pathname === '/') {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        setIsMobileMenuOpen(false);
      }
    } else {
      // Navigate to home page with hash
      window.location.href = `/#${sectionId}`;
    }
  };

  const isHomePage = pathname === '/';
  const isUserLoggedIn = verificationState.isWorldIdVerified && verificationState.isWalletConnected;

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled || !isHomePage
          ? 'bg-background/95 backdrop-blur-md border-b border-border shadow-sm'
          : 'bg-transparent'
      )}
    >
      <div className="container-max container-padding">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">R</span>
            </div>
            <span className="text-xl font-bold text-foreground">
              RONDA Web3
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => scrollToSection('about')}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              About
            </button>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              How it Works
            </button>
            <button
              onClick={() => scrollToSection('explore')}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Explore Circles
            </button>
            <button
              onClick={() => scrollToSection('security')}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Security
            </button>
          </nav>

          {/* CTA Button - Only show if user is not logged in */}
          <div className="hidden md:block">
            {!isUserLoggedIn ? (
              <Button asChild>
                <Link href="/auth">
                  Login with World ID
                </Link>
              </Button>
            ) : (
              <Button asChild variant="outline">
                <Link href="/dashboard">
                  <Eye className="h-4 w-4 mr-2" />
                  Dashboard
                </Link>
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-md">
            <nav className="flex flex-col space-y-4 p-4">
              <button
                onClick={() => scrollToSection('about')}
                className="text-left text-muted-foreground hover:text-foreground transition-colors"
              >
                About
              </button>
              <button
                onClick={() => scrollToSection('how-it-works')}
                className="text-left text-muted-foreground hover:text-foreground transition-colors"
              >
                How it Works
              </button>
              <button
                onClick={() => scrollToSection('explore')}
                className="text-left text-muted-foreground hover:text-foreground transition-colors"
              >
                Explore Circles
              </button>
              <button
                onClick={() => scrollToSection('security')}
                className="text-left text-muted-foreground hover:text-foreground transition-colors"
              >
                Security
              </button>
              
              {/* Mobile CTA Button - Only show if user is not logged in */}
              {!isUserLoggedIn ? (
                <Button asChild className="w-full mt-4">
                  <Link href="/auth">
                    Login with World ID
                  </Link>
                </Button>
              ) : (
                <Button asChild variant="outline" className="w-full mt-4">
                  <Link href="/dashboard">
                    <Eye className="h-4 w-4 mr-2" />
                    Dashboard
                  </Link>
                </Button>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}