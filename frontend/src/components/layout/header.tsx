'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, ChevronDown, Coins, Copy, Eye, LogOut, Menu, Network, User, Wallet, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useDisconnect } from 'wagmi';
import { usePathname } from 'next/navigation';
import { useVerification } from '@/hooks/use-verification';
import { useWagmiReady } from '@/hooks/use-wagmi-ready';
import { useWalletInfo } from '@/hooks/use-wallet-info';

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const pathname = usePathname();
  const isWagmiReady = useWagmiReady();
  const { verificationState } = useVerification();
  const { address, chainId, chainName, isConnected, balance, connector } = useWalletInfo();
  
  const { disconnect } = useDisconnect();

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

  const handleCopyAddress = async () => {
    if (address) {
      try {
        await navigator.clipboard.writeText(address);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy address:', error);
      }
    }
  };

  const handleDisconnect = () => {
    disconnect();
  };

  const isHomePage = pathname === '/';
  const isUserVerified = verificationState.isWorldIdVerified && verificationState.isWalletConnected;

  const getNetworkBadgeColor = () => {
    const isTestnet = chainId && [11155111, 421614, 80001, 97, 43113, 4002, 420, 421613].includes(chainId);
    const isMainnet = chainId && [1, 137, 56, 43114, 250, 10, 42161].includes(chainId);
    
    if (isMainnet) {return 'bg-success/10 text-success border-success/20';}
    if (isTestnet) {return 'bg-warning/10 text-warning border-warning/20';}
    return 'bg-muted text-muted-foreground border-border';
  };

  const getNetworkType = () => {
    const isTestnet = chainId && [11155111, 421614, 80001, 97, 43113, 4002, 420, 421613].includes(chainId);
    const isMainnet = chainId && [1, 137, 56, 43114, 250, 10, 42161].includes(chainId);
    
    if (isMainnet) {return 'Mainnet';}
    if (isTestnet) {return 'Testnet';}
    return 'Unknown';
  };

  const renderUserSection = () => {
    if (!isUserVerified) {
      return (
        <Button asChild>
          <Link href="/auth">
            Login with World ID
          </Link>
        </Button>
      );
    }

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
              <User className="h-4 w-4" />
            </div>
            <span className="hidden sm:inline">Account</span>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel>User Information</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {/* Verification Status */}
          <div className="p-3">
            <div className="space-y-3">
              {/* World ID Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-xs">W</span>
                  </div>
                  <span className="text-sm font-medium">World ID</span>
                </div>
                <Badge 
                  variant="outline" 
                  className="bg-success/10 text-success border-success/20"
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              </div>

              {/* Wallet Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Wallet className="h-4 w-4 text-success" />
                  <span className="text-sm font-medium">Wallet</span>
                </div>
                <Badge 
                  variant="outline" 
                  className="bg-success/10 text-success border-success/20"
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              </div>
            </div>
          </div>

          <DropdownMenuSeparator />

          {/* Wallet Details */}
          <div className="p-3 space-y-3">
            <div className="text-sm font-medium">Wallet Details</div>
            
            {/* Wallet Type */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Wallet Type:</span>
              <span className="font-medium">{connector || 'Unknown'}</span>
            </div>

            {/* Address */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Address:</span>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyAddress}
                  className="h-6 w-6 p-0"
                >
                  {copied ? (
                    <CheckCircle className="h-3 w-3 text-success" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>

            {/* Network */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Network:</span>
              <div className="flex items-center space-x-2">
                <span className="font-medium text-xs">{chainName}</span>
                <Badge 
                  variant="outline" 
                  className={`text-xs ${getNetworkBadgeColor()}`}
                >
                  {getNetworkType()}
                </Badge>
              </div>
            </div>

            {/* Chain ID */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Chain ID:</span>
              <span className="font-medium">{chainId}</span>
            </div>

            {/* Balance */}
            {balance && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Balance:</span>
                <span className="font-medium">
                  {parseFloat(balance).toFixed(6)} ETH
                </span>
              </div>
            )}
          </div>

          <DropdownMenuSeparator />

          {/* Actions */}
          <DropdownMenuItem asChild>
            <Link href="/dashboard" className="flex items-center">
              <Eye className="h-4 w-4 mr-2" />
              Dashboard
            </Link>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={handleDisconnect} className="text-destructive">
            <LogOut className="h-4 w-4 mr-2" />
            Disconnect Wallet
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const renderMobileUserSection = () => {
    if (!isUserVerified) {
      return (
        <Button asChild className="w-full mt-4">
          <Link href="/auth">
            Login with World ID
          </Link>
        </Button>
      );
    }

    return (
      <div className="mt-4 space-y-4">
        {/* User Info Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>Account</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Verification Status */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 bg-gradient-to-r from-blue-500 to-purple-600 rounded flex items-center justify-center">
                    <span className="text-white font-bold text-xs">W</span>
                  </div>
                  <span>World ID</span>
                </div>
                <Badge variant="outline" className="bg-success/10 text-success border-success/20 text-xs">
                  Verified
                </Badge>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <Wallet className="h-4 w-4 text-success" />
                  <span>Wallet</span>
                </div>
                <Badge variant="outline" className="bg-success/10 text-success border-success/20 text-xs">
                  Connected
                </Badge>
              </div>
            </div>

            {/* Wallet Details */}
            <div className="pt-2 border-t space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Address:</span>
                <span className="font-mono text-xs">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Network:</span>
                <span className="font-medium text-xs">{chainName}</span>
              </div>

              {balance && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Balance:</span>
                  <span className="font-medium text-xs">
                    {parseFloat(balance).toFixed(4)} ETH
                  </span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-2 border-t space-y-2">
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link href="/dashboard">
                  <Eye className="h-4 w-4 mr-2" />
                  Dashboard
                </Link>
              </Button>
              
              <Button 
                onClick={handleDisconnect} 
                variant="outline" 
                size="sm" 
                className="w-full text-destructive hover:text-destructive"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Disconnect
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

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
              onClick={() => scrollToSection('security')}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Security
            </button>
          </nav>

          {/* Desktop User Section */}
          <div className="hidden md:block">
            {renderUserSection()}
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
                onClick={() => scrollToSection('security')}
                className="text-left text-muted-foreground hover:text-foreground transition-colors"
              >
                Security
              </button>
              
              {/* Mobile User Section */}
              {renderMobileUserSection()}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}