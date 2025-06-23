'use client';

import Link from 'next/link';
import { useState } from 'react';

export function BoltBadge() {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Link
        href="https://bolt.new/"
        target="_blank"
        rel="noopener noreferrer"
        className="block transition-transform hover:scale-105 focus:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background rounded-full"
        aria-label="Built with Bolt.new"
      >
        {!imageError ? (
          <img
            src="/bolt-logo.png"
            alt="Built with Bolt.new"
            className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 drop-shadow-lg hover:drop-shadow-xl transition-all duration-200"
            onError={() => setImageError(true)}
          />
        ) : (
          // Fallback badge if image is not available
          <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-black rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm drop-shadow-lg hover:drop-shadow-xl transition-all duration-200">
            <div className="text-center leading-tight">
              <div>BUILT</div>
              <div>WITH</div>
              <div className="text-blue-400">BOLT</div>
            </div>
          </div>
        )}
      </Link>
    </div>
  );
}
