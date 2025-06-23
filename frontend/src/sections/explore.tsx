import { Users, DollarSign, Calendar, ArrowRight, Eye, TrendingUp } from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { formatCurrency, formatDate } from '@/lib/utils';
import { mockGroups } from '@/local-data';

export function ExploreSection() {
  // Get a few featured groups for the landing page
  const featuredGroups = mockGroups.slice(0, 3);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'recruiting':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'active':
        return 'bg-success/10 text-success border-success/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'recruiting':
        return 'Open to Join';
      case 'active':
        return 'Active';
      default:
        return status;
    }
  };

  return (
    <section id="explore" className="py-24">
      <div className="container-max container-padding">
        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          <div className="text-center space-y-2">
            <div className="text-3xl font-bold text-primary">12+</div>
            <div className="text-sm text-muted-foreground">Active RONDAs</div>
          </div>
          <div className="text-center space-y-2">
            <div className="text-3xl font-bold text-success">$2.4M</div>
            <div className="text-sm text-muted-foreground">Total Saved</div>
          </div>
          <div className="text-center space-y-2">
            <div className="text-3xl font-bold text-warning">150+</div>
            <div className="text-sm text-muted-foreground">Members</div>
          </div>
          <div className="text-center space-y-2">
            <div className="text-3xl font-bold text-info">99.8%</div>
            <div className="text-sm text-muted-foreground">Success Rate</div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center space-y-6">
          <div className="space-y-4">
            <h3 className="text-2xl font-bold">Ready to Start Saving?</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Browse all available RONDAs and find the perfect match for your financial goals. 
              Join a community of savers building their financial future together.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" asChild className="group">
              <Link href="/dashboard">
                <TrendingUp className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                Browse All RONDAs
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="#how-it-works">
                Learn How It Works
              </Link>
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="pt-8">
            <div className="inline-flex items-center space-x-6 p-4 bg-muted/30 rounded-2xl border border-border/50">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-success/20 rounded-lg flex items-center justify-center">
                  <Users className="h-4 w-4 text-success" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-sm">Community Verified</div>
                  <div className="text-xs text-muted-foreground">Trusted members</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-sm">Proven Results</div>
                  <div className="text-xs text-muted-foreground">High success rate</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}