'use client';

import { ChevronRight, Home } from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Group } from '@/local-data';

interface BreadcrumbHeaderProps {
  group: Group;
}

export function BreadcrumbHeader({ group }: BreadcrumbHeaderProps) {
  const availableSpots = group.maxMembers - group.memberCount;

  return (
    <div className="pt-16 bg-muted/30 border-b border-border">
      <div className="container-max container-padding py-8">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
          <Button variant="ghost" size="sm" asChild className="h-auto p-0 hover:bg-transparent">
            <Link href="/" className="flex items-center space-x-1 hover:text-foreground">
              <Home className="h-4 w-4" />
              <span>Home</span>
            </Link>
          </Button>
          <ChevronRight className="h-4 w-4" />
          <Button variant="ghost" size="sm" asChild className="h-auto p-0 hover:bg-transparent">
            <Link href="/dashboard" className="hover:text-foreground">
              RONDAs
            </Link>
          </Button>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium">RONDA #{group.id}</span>
        </nav>

        {/* Page Header */}
        <div className="space-y-4">
          <h1 className="text-3xl font-bold">{group.description}</h1>
          <div className="flex items-center space-x-4">
            <Badge 
              variant="outline" 
              className={
                group.status === 'recruiting' 
                  ? 'bg-warning/10 text-warning border-warning/20'
                  : 'bg-success/10 text-success border-success/20'
              }
            >
              {group.status === 'recruiting' ? 'Open for new members' : 'Active'}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {availableSpots} spot{availableSpots !== 1 ? 's' : ''} remaining
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}