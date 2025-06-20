import { UserPlus, Calendar, Coins, ArrowRight } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const steps = [
  {
    step: 1,
    icon: UserPlus,
    title: 'Join the Group',
    description: 'Create or join a savings circle with trusted participants. Set contribution amounts and schedule.',
    details: [
      'Connect your wallet',
      'Choose circle parameters',
      'Invite trusted members',
      'Lock in smart contract'
    ]
  },
  {
    step: 2,
    icon: Calendar,
    title: 'Contribute Monthly',
    description: 'Make automatic monthly contributions through smart contracts. No manual payments or reminders needed.',
    details: [
      'Automatic deductions',
      'Transparent tracking',
      'Penalty protection',
      'Real-time updates'
    ]
  },
  {
    step: 3,
    icon: Coins,
    title: 'Receive Your Turn',
    description: 'Get your lump sum when it\'s your turn. Fair rotation ensures everyone gets their payout.',
    details: [
      'Predetermined order',
      'Instant payouts',
      'Full transparency',
      'No intermediary fees'
    ]
  }
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24">
      <div className="container-max container-padding">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-balance">
            How RONDA Web3 works
          </h2>
          <p className="text-xl text-muted-foreground text-balance max-w-3xl mx-auto">
            Simple, secure, and transparent. Join a savings circle in three easy steps.
          </p>
        </div>

        <div className="relative max-w-6xl mx-auto">
          {/* Steps Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            {steps.map((step, index) => (
              <div key={step.step} className="relative">
                <Card className="h-full group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <CardHeader className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 bg-primary rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <step.icon className="h-8 w-8 text-primary-foreground" />
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-primary">Step {step.step}</div>
                      <CardTitle className="text-2xl">{step.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <CardDescription className="text-base text-center leading-relaxed">
                      {step.description}
                    </CardDescription>
                    
                    <ul className="space-y-3">
                      {step.details.map((detail, detailIndex) => (
                        <li key={detailIndex} className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                          <span className="text-sm text-muted-foreground">{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Arrow connectors for desktop - positioned to align with card centers */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-6 transform -translate-y-1/2 z-10">
                    <div className="w-12 h-12 flex items-center justify-center">
                      <ArrowRight className="h-6 w-6 text-primary/60" />
                    </div>
                  </div>
                )}

                {/* Mobile arrow - positioned below each card except the last */}
                {index < steps.length - 1 && (
                  <div className="lg:hidden flex justify-center mt-6 mb-2">
                    <div className="w-12 h-12 flex items-center justify-center">
                      <div className="transform rotate-90">
                        <ArrowRight className="h-6 w-6 text-primary/60" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Example scenario */}
        <div className="mt-20 p-8 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-2xl border border-border/50">
          <div className="text-center space-y-4 mb-8">
            <h3 className="text-2xl font-bold">Example: 12-Person Circle</h3>
            <p className="text-muted-foreground">See how a typical RONDA Web3 circle works</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="space-y-2">
              <div className="text-3xl font-bold text-primary">$100</div>
              <div className="text-sm text-muted-foreground">Monthly contribution per person</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-success">$1,200</div>
              <div className="text-sm text-muted-foreground">Lump sum each person receives</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-warning">12</div>
              <div className="text-sm text-muted-foreground">Months to complete full cycle</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}