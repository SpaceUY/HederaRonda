import { Calendar, Users, DollarSign, Clock, Eye } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Group } from '@/local-data';

interface GroupsGridProps {
  groups: Group[];
}

export function GroupsGrid({ groups }: GroupsGridProps) {
  const getStatusColor = (status: Group['status']) => {
    switch (status) {
      case 'recruiting':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'active':
        return 'bg-success/10 text-success border-success/20';
      case 'completed':
        return 'bg-muted text-muted-foreground border-border';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getStatusText = (status: Group['status']) => {
    switch (status) {
      case 'recruiting':
        return 'Recruiting';
      case 'active':
        return 'Active';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {groups.map((group) => (
        <Card key={group.id} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col">
          <CardHeader className="space-y-4 flex-shrink-0">
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-semibold group-hover:text-primary transition-colors line-clamp-2">
                    {group.description}
                  </h3>
                </div>
                <Badge 
                  variant="outline" 
                  className={getStatusColor(group.status)}
                >
                  {getStatusText(group.status)}
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
                  {group.memberCount}/{group.maxMembers}
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary rounded-full h-2 transition-all duration-300"
                    style={{ width: `${(group.memberCount / group.maxMembers) * 100}%` }}
                  />
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  <span>Monthly</span>
                </div>
                <div className="font-semibold">
                  {formatCurrency(group.monthlyContribution, group.currency)}
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
                  {formatDate(group.nextRoundStart, { month: 'short', day: 'numeric' })}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Duration</span>
                </div>
                <span className="font-medium">
                  {group.duration} months
                </span>
              </div>
            </div>

            {/* Action Button - pushed to bottom */}
            <div className="mt-auto pt-4">
              <Button 
                className="w-full group-hover:bg-primary/90 transition-colors"
                disabled={group.status === 'completed'}
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
  );
}