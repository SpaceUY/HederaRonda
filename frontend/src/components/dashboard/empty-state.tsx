import { Search, Filter } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface EmptyStateProps {
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

export function EmptyState({ hasActiveFilters, onClearFilters }: EmptyStateProps) {
  if (hasActiveFilters) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-4">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">No RONDAs match your filters</h3>
            <p className="text-muted-foreground max-w-md">
              Try adjusting your search criteria or clearing some filters to see more results.
            </p>
          </div>
          <Button variant="outline" onClick={onClearFilters}>
            <Filter className="h-4 w-4 mr-2" />
            Clear all filters
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-4">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
          <Search className="h-8 w-8 text-primary" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">No RONDAs available</h3>
          <p className="text-muted-foreground max-w-md">
            Check back later for new RONDAs or contact support for assistance.
          </p>
        </div>
        <div className="pt-4 border-t border-border w-full max-w-md">
          <p className="text-sm text-muted-foreground">
            Can't find a RONDA that fits your needs?{' '}
            <a href="#" className="text-primary hover:underline">
              Contact support
            </a>{' '}
            for help finding the right RONDA.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}