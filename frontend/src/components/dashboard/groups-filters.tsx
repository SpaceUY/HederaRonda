'use client';

import { Filter, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface FiltersState {
  memberCount: string;
  status: string;
}

interface GroupsFiltersProps {
  filters: FiltersState;
  onFiltersChange: (filters: FiltersState) => void;
}

export function GroupsFilters({ filters, onFiltersChange }: GroupsFiltersProps) {
  const updateFilter = (key: keyof FiltersState, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const clearFilter = (key: keyof FiltersState) => {
    updateFilter(key, '');
  };

  const clearAllFilters = () => {
    onFiltersChange({
      memberCount: '',
      status: '',
    });
  };

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filters:</span>
        </div>

        <Select value={filters.memberCount} onValueChange={(value) => updateFilter('memberCount', value)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Group size" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="small">Small (≤8)</SelectItem>
            <SelectItem value="medium">Medium (9-12)</SelectItem>
            <SelectItem value="large">Large (13+)</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recruiting">Open</SelectItem>
            <SelectItem value="active">Running</SelectItem>
            <SelectItem value="completed">Finalized</SelectItem>
          </SelectContent>
        </Select>

        {activeFiltersCount > 0 && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={clearAllFilters}
            className="text-muted-foreground"
          >
            Clear all ({activeFiltersCount})
          </Button>
        )}
      </div>

      {/* Active Filters */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          
          {filters.memberCount && (
            <Badge variant="secondary" className="gap-1">
              Size: {filters.memberCount}
              <button onClick={() => clearFilter('memberCount')}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {filters.status && (
            <Badge variant="secondary" className="gap-1">
              Status: {filters.status}
              <button onClick={() => clearFilter('status')}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}