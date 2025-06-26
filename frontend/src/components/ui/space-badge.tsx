'use client';

import Link from 'next/link';
import { useState } from 'react';

export function SpaceBadge() {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="group fixed bottom-4 left-4 z-50 m-2">
      <Link
        href="https://spacedev.io/"
        target="_blank"
        rel="noopener noreferrer"
        className="relative block rounded-full transition-transform hover:scale-105 focus:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
        aria-label="Built with Space Dev"
      >
        {!imageError ? (
          <img
            src="/space-logo.png"
            alt="Built with Space Dev"
            className="h-12 w-12 rounded-full drop-shadow-lg transition-all duration-200 hover:drop-shadow-xl sm:h-14 sm:w-14 md:h-16 md:w-16"
            onError={() => setImageError(true)}
          />
        ) : (
          // Fallback badge if image is not available
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-xs font-bold text-white drop-shadow-lg transition-all duration-200 hover:drop-shadow-xl sm:h-14 sm:w-14 sm:text-sm md:h-16 md:w-16">
            <div className="text-center leading-tight">
              <div>BUILT</div>
              <div>WITH</div>
              <div className="text-purple-400">SPACE</div>
            </div>
          </div>
        )}

        {/* Tooltip */}
        <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 transform whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          Made by Space Dev
          {/* Tooltip arrow */}
          <div className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 transform border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      </Link>
    </div>
  );
}
