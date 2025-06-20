import { Shield, Users, Zap, Eye, Clock, Globe } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const features = [
  {
    icon: Eye,
    title: 'Total Transparency',
    description: 'Every transaction is recorded on the blockchain, providing complete visibility and accountability for all participants.',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  {
    icon: Users,
    title: 'No Intermediaries',
    description: 'Direct peer-to-peer savings circles without banks or financial institutions taking fees or controlling your money.',
    color: 'text-success',
    bgColor: 'bg-success/10',
  },
  {
    icon: Zap,
    title: 'Automatic Payments',
    description: 'Smart contracts handle all payments automatically, ensuring timely contributions and distributions without manual intervention.',
    color: 'text-warning',
    bgColor: 'bg-warning/10',
  },
  {
    icon: Shield,
    title: 'Secure by Design',
    description: 'Built on proven blockchain technology with smart contract audits and Chainlink oracle integration for maximum security.',
    color: 'text-info',
    bgColor: 'bg-info/10',
  },
  {
    icon: Clock,
    title: 'Flexible Terms',
    description: 'Create savings circles with custom durations, contribution amounts, and payout schedules that work for your group.',
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
  },
  {
    icon: Globe,
    title: 'Global Access',
    description: 'Join or create savings circles with people anywhere in the world, breaking down geographical barriers to financial cooperation.',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
];

export function FeaturesSection() {
  return (
    <section id="about" className="py-24 bg-muted/30">
      <div className="container-max container-padding">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-balance">
            Why choose RONDA Web3?
          </h2>
          <p className="text-xl text-muted-foreground text-balance max-w-3xl mx-auto">
            Experience the future of savings circles with blockchain technology that puts you in control
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={feature.title} 
              className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-border/50"
            >
              <CardHeader className="space-y-4">
                <div className={`w-12 h-12 rounded-lg ${feature.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                </div>
                <CardTitle className="text-xl group-hover:text-primary transition-colors">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center space-x-8 p-6 bg-background rounded-2xl border border-border/50 shadow-sm">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                <span className="text-primary font-bold">CL</span>
              </div>
              <div className="text-left">
                <div className="font-semibold text-sm">Chainlink Powered</div>
                <div className="text-xs text-muted-foreground">Reliable oracles</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-success/20 rounded-lg flex items-center justify-center">
                <Shield className="h-5 w-5 text-success" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-sm">Security Audited</div>
                <div className="text-xs text-muted-foreground">Smart contracts verified</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}