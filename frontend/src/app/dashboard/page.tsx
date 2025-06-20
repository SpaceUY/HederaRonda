'use client';

import { useState } from 'react';

import { Header } from '@/components/layout/header';
import { ContractGroupsGrid } from '@/components/dashboard/contract-groups-grid';
import { GroupsFilters } from '@/components/dashboard/groups-filters';
import { EmptyState } from '@/components/dashboard/empty-state';
import { useRondaContracts } from '@/hooks/use-ronda-contracts';

export default function DashboardPage() {
  const { rondas, isLoading, error, refetch } = useRondaContracts();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    memberCount: '',
    status: '',
  });

  // Filter rondas based on search and filters
  const filteredRondas = rondas.filter((ronda) => {
    // Search by address or state
    const matchesSearch = !searchQuery || 
      ronda.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ronda.state.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesMemberCount = !filters.memberCount || 
      (filters.memberCount === 'small' && ronda.maxParticipants <= 8) ||
      (filters.memberCount === 'medium' && ronda.maxParticipants > 8 && ronda.maxParticipants <= 12) ||
      (filters.memberCount === 'large' && ronda.maxParticipants > 12);
    
    const matchesStatus = !filters.status || 
      (filters.status === 'recruiting' && ronda.state === 'Open') ||
      (filters.status === 'active' && ronda.state === 'Running') ||
      (filters.status === 'completed' && ronda.state === 'Finalized');
    
    return matchesSearch && matchesMemberCount && matchesStatus;
  });

  const hasActiveFilters = searchQuery || Object.values(filters).some(filter => filter);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="pt-16">
        <main className="container-max container-padding py-8">
          <div className="space-y-8">
            {/* Page Header */}
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">Available RONDAs</h1>
              <p className="text-muted-foreground">
                Join a RONDA that matches your financial goals and timeline
              </p>
            </div>

            {/* Filters - Only show if we have data and no errors */}
            {!error && !isLoading && rondas.length > 0 && (
              <GroupsFilters 
                filters={filters}
                onFiltersChange={setFilters}
              />
            )}

            {/* Results */}
            {!error && !isLoading && filteredRondas.length > 0 ? (
              <ContractGroupsGrid 
                rondas={filteredRondas} 
                isLoading={isLoading}
                error={error}
                onRefetch={refetch}
              />
            ) : !error && !isLoading && rondas.length > 0 && hasActiveFilters ? (
              <EmptyState 
                hasActiveFilters={hasActiveFilters}
                onClearFilters={() => {
                  setSearchQuery('');
                  setFilters({
                    memberCount: '',
                    status: '',
                  });
                }}
              />
            ) : (
              <ContractGroupsGrid 
                rondas={filteredRondas} 
                isLoading={isLoading}
                error={error}
                onRefetch={refetch}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}