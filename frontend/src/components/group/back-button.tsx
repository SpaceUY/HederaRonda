'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';

export function BackButton() {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={handleBack}
      className="gap-2 text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" />
      Back
    </Button>
  );
}