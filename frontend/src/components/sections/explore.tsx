import { ArrowRight, Calendar, DollarSign, Eye, TrendingUp, Users } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { formatCurrency, formatDate } from '@/lib/utils';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { mockGroups } from '@/local-data';

export function ExploreSection() {
  // Get a few featured groups for the landing page
  const featuredGroups = mockGroups.slice(0, 3);

  const getStatusColor = (state: string) => {
    switch (state) {
      case 'Open':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'Running':
        return 'bg-success/10 text-success border-success/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getStatusText = (state: string) => {
    switch (state) {
      case 'Open':
        return 'Open to Join';
      case 'Running':
        return 'Active';
      default:
        return state;
    }
  };

  return (
    <section id="explore" className="py-24">
      <div className="container-max container-padding">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-balance">
            Explore Active RONDAs
          </h2>
          <p className="text-xl text-muted-foreground text-balance max-w-3xl mx-auto">
            Join thousands of people already saving together. Find a RONDA that matches your goals and timeline.
          </p>
        </div>

        {/* Featured Groups Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {featuredGroups.map((group) => (
            <Card key={group.id} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col">
              <CardHeader className="space-y-4 flex-shrink-0">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <h3 className="text-lg font-semibold group-hover:text-primary transition-colors line-clamp-2">
                      {group.description}
                    </h3>
                    <Badge 
                      variant="outline" 
                      className={getStatusColor(group.state)}
                    >
                      {getStatusText(group.state)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6 flex-1 flex flex-col">
                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-4 flex-shrink-0">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>Members</span>
                    </div>
                    <div className="font-semibold">
                      {group.participants.length}/{group.maxParticipants}
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary rounded-full h-2 transition-all duration-300"
                        style={{ width: `${(group.participants.length / group.maxParticipants) * 100}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <DollarSign className="h-4 w-4" />
                      <span>Monthly</span>
                    </div>
                    <div className="font-semibold">
                      {formatCurrency(group.monthlyDepositFormatted, group.currency || 'HBAR')}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      per member
                    </div>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="space-y-3 flex-shrink-0">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Next round</span>
                    </div>
                    <span className="font-medium">
                      {formatDate(group.startDate, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total payout</span>
                    <span className="font-medium text-success">
                      {formatCurrency(group.monthlyDepositFormatted * group.maxParticipants, group.currency || 'HBAR')}
                    </span>
                  </div>
                </div>

                {/* Action Button - pushed to bottom */}
                <div className="mt-auto pt-4">
                  <Button 
                    className="w-full group-hover:bg-primary/90 transition-colors"
                    disabled={group.state === 'Finalized'}
                    asChild
                  >
                    <Link href={`/group/${group.id}`}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

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
                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
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