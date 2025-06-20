'use client';

import Link from 'next/link';

interface DashboardHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function DashboardHeader({ searchQuery, onSearchChange }: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
      <div className="container-max container-padding">
        <div className="flex items-center justify-between h-16">
          {/* Logo - Clickable */}
          <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">R</span>
            </div>
            <span className="text-xl font-bold text-foreground">
              RONDA Web3
            </span>
          </Link>

          {/* Empty space for future actions */}
          <div className="flex items-center space-x-4">
            {/* Future: User menu, notifications, etc. */}
          </div>
        </div>
      </div>
    </header>
  );
}